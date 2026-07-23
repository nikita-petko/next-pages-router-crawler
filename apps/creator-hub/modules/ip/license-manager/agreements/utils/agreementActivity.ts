/* oxlint-disable typescript/switch-exhaustiveness-check typescript/no-non-null-assertion -- partial transition handling with intentional default fallthrough */
import type {
  AgreementActivityResponse,
  HydratedAgreementWithHydratedTargetsResponse,
} from '@rbx/client-content-licensing-api/v1';
import { AgreementTransition, AgreementStatus } from '@rbx/client-content-licensing-api/v1';
import {
  DAYS_FOR_CREATOR_TO_COMPLETE_CHANGE_REQUEST,
  DAYS_FOR_CREATOR_TO_COMPLETE_CONDITIONAL_CHANGE_REQUEST,
  DAYS_FOR_CREATOR_TO_RESPOND_TO_EXPIRED_CHANGE_REQUEST,
  DAYS_FOR_IPH_TO_RESPOND_TO_COMPLETED_CHANGE_REQUEST,
  MS_PER_DAY,
} from '../../constants';
import { resolveCancellationNotesToLabelKey } from '../../utils/cancellationReason';
import { getReasonFromString } from '../../utils/disputeReason';

export const TIME_TO_RESPONSE_TO_NEW_CHANGE_REQUEST =
  DAYS_FOR_CREATOR_TO_COMPLETE_CHANGE_REQUEST * MS_PER_DAY;
export const TIME_TO_RESPOND_TO_EXPIRED_CHANGE_REQUEST =
  DAYS_FOR_CREATOR_TO_RESPOND_TO_EXPIRED_CHANGE_REQUEST * MS_PER_DAY;
export const TIME_TO_RESPOND_TO_COMPLETED_CHANGE_REQUEST =
  DAYS_FOR_IPH_TO_RESPOND_TO_COMPLETED_CHANGE_REQUEST * MS_PER_DAY;
export const TIME_TO_RESPONSE_TO_NEW_CONDITIONAL_CHANGE_REQUEST =
  DAYS_FOR_CREATOR_TO_COMPLETE_CONDITIONAL_CHANGE_REQUEST * MS_PER_DAY;

/**
 * Time-limited approval activities store the Creator's original proposed period in `notes` as
 * `"<startISO> - <endISO>"` (spaces around `-` are allowed). The UI only needs the start instant.
 */
const parseOriginalStartDateFromNotes = (notes: string): Date => {
  const startPortion = notes
    .trim()
    .split(/\s+-\s+/)[0]
    .trim();
  return new Date(startPortion);
};

/**
 * Calculates the date that the alerts shown for change request related AgreementTransitions should "expire".
 * Expire can mean a due date or when the alert would be considered stale.
 */
export const getLatestChangeRequestExpireDate = (
  activityLog: AgreementActivityResponse[] | undefined,
): Date | undefined => {
  if (!activityLog || activityLog.length === 0) {
    return undefined;
  }

  const lastActivity = activityLog[0];
  if (lastActivity.createdAt) {
    const createdAt = new Date(lastActivity.createdAt);
    // oxlint-disable-next-line typescript/switch-exhaustiveness-check -- only change-request transitions affect expiry
    switch (lastActivity.transition) {
      case AgreementTransition.InitiateChangeRequest:
        return new Date(createdAt.getTime() + TIME_TO_RESPONSE_TO_NEW_CHANGE_REQUEST);
      case AgreementTransition.CompleteChangeRequest:
        return new Date(createdAt.getTime() + TIME_TO_RESPOND_TO_COMPLETED_CHANGE_REQUEST);
      case AgreementTransition.ExpireChangeRequest:
        return new Date(createdAt.getTime() + TIME_TO_RESPOND_TO_EXPIRED_CHANGE_REQUEST);
      default:
        return undefined;
    }
  }

  return undefined;
};

/**
 * Calculates the due date for a pending conditional change request.
 */
export const getLatestConditionalChangeRequestExpireDate = (
  activityLog: AgreementActivityResponse[] | undefined,
): Date | undefined => {
  if (!activityLog || activityLog.length === 0) {
    return undefined;
  }

  const lastActivity = activityLog[0];
  if (lastActivity.createdAt) {
    const createdAt = new Date(lastActivity.createdAt);
    switch (lastActivity.transition) {
      case AgreementTransition.IphInitiateConditionalChangeRequest:
        return new Date(createdAt.getTime() + TIME_TO_RESPONSE_TO_NEW_CONDITIONAL_CHANGE_REQUEST);
      case AgreementTransition.CreatorCompleteConditionalChangeRequest:
        return new Date(createdAt.getTime() + TIME_TO_RESPOND_TO_COMPLETED_CHANGE_REQUEST);
      default:
        return undefined;
    }
  }

  return undefined;
};

/**
 * Returns the date the conditional change request window expired.
 */
export const getConditionalChangeRequestWindowExpireDate = (
  activityLog: AgreementActivityResponse[] | undefined,
  expiresAtTime?: Date | null,
): Date | undefined => {
  if (expiresAtTime) {
    return expiresAtTime;
  }

  const initiateActivity = getAgreementActivityByTransition(
    activityLog,
    AgreementTransition.IphInitiateConditionalChangeRequest,
  );
  if (initiateActivity?.createdAt) {
    const createdAt = new Date(initiateActivity.createdAt);
    return new Date(createdAt.getTime() + TIME_TO_RESPONSE_TO_NEW_CONDITIONAL_CHANGE_REQUEST);
  }

  const expireActivity = getAgreementActivityByTransition(
    activityLog,
    AgreementTransition.ExpireConditionalChangeRequest,
  );
  if (expireActivity?.createdAt) {
    return new Date(expireActivity.createdAt);
  }

  return undefined;
};

/**
 * Calculates the date that a specific agreement activity should "expire".
 * Used for change requests expiry and time-limited licenses activation and expiry.
 */
export const getSpecificActivityExpireDate = (
  activity: AgreementActivityResponse | undefined,
  enableIpPlatformConditionalOffers?: boolean,
): Date | undefined => {
  if (!activity) {
    return undefined;
  }

  const { createdAt: createdAtRaw, transition, endStatus, notes } = activity;

  if (notes && endStatus === AgreementStatus.Accepted) {
    // Backend returns the Creator's original proposed date range in `notes` to preserve it if
    // the license activates early due to early IP usage; we display only the start date.
    return parseOriginalStartDateFromNotes(notes);
  }

  if (createdAtRaw) {
    const createdAt = new Date(createdAtRaw);
    // oxlint-disable-next-line typescript/switch-exhaustiveness-check -- only change-request transitions affect expiry
    switch (transition) {
      case AgreementTransition.InitiateChangeRequest:
        return new Date(createdAt.getTime() + TIME_TO_RESPONSE_TO_NEW_CHANGE_REQUEST);
      case AgreementTransition.CompleteChangeRequest:
        return new Date(createdAt.getTime() + TIME_TO_RESPOND_TO_COMPLETED_CHANGE_REQUEST);
      case AgreementTransition.ExpireChangeRequest:
        return new Date(createdAt.getTime() + TIME_TO_RESPOND_TO_EXPIRED_CHANGE_REQUEST);
      case AgreementTransition.IphInitiateConditionalChangeRequest:
        return enableIpPlatformConditionalOffers
          ? new Date(createdAt.getTime() + TIME_TO_RESPONSE_TO_NEW_CONDITIONAL_CHANGE_REQUEST)
          : undefined;
      default:
        return undefined;
    }
  }

  return undefined;
};

/**
 * In the backend, when IPH rejects Creator request for a license, the agreement immediately moves to an Archived status.
 * However, on the frontend, we want to show these as two separate agreement activities, so we will create and inject a
 * new AgreementActivityResponse item to achieve this.
 */
const handleRejectApplicationContentLicensingAgreementActivity = (
  activityLog: AgreementActivityResponse[],
): AgreementActivityResponse[] => {
  const [originalRejectionLog, ...otherLogs] = activityLog;

  const archivedLog = {
    ...originalRejectionLog,
    id: originalRejectionLog.id?.concat('_archived') ?? '_archived', // Need unique ids
    startStatus: AgreementStatus.None,
    endStatus: AgreementStatus.Archived,
    notes: undefined,
  };

  const rejectionLog = {
    ...originalRejectionLog,
    id: originalRejectionLog.id?.concat('_rejectApplication') ?? '_rejectApplication', // Need unique ids
    startStatus: AgreementStatus.None,
    endStatus: AgreementStatus.None,
    transition: AgreementTransition.RejectApplication,
  };

  const updatedLog = [archivedLog, rejectionLog, ...otherLogs];

  return updatedLog;
};

/**
 * Updates the Creator view of the AgreementActivityResponse items for a particular agreement.
 * Handles the case where the IPH has rejected a Creator's request for a license.
 * Also handles the case where a Creator has disputed an IPH's license offer the maximum amount of
 * times, leading to an Unsuccessful status for the agreement; however, for the Creator, this status
 * is not actually relevant and so we should obscure it by showing Archived instead.
 */
export const filterCreatorContentLicensingAgreementActivity = (
  activityLog?: AgreementActivityResponse[],
): AgreementActivityResponse[] => {
  if (!activityLog || activityLog.length === 0) {
    return [];
  }

  let log = [...activityLog];
  let firstItem = log[0];

  if (firstItem.transition === AgreementTransition.RejectApplication) {
    log = handleRejectApplicationContentLicensingAgreementActivity(log);
  }

  // Creator perceives updates to Unsuccessful or Archived state only once
  // so remove this log item for them; it would be the first in a sorted list
  if (firstItem.transition === AgreementTransition.ArchiveUnsuccessfulOffer) {
    log.shift();
    [firstItem] = log;
  }

  // Creator perceives updates to Unsuccessful or Archived state only once
  // so update the log item to immediately move it to be Archived
  if (firstItem.transition === AgreementTransition.AcceptDispute) {
    firstItem.endStatus = AgreementStatus.Archived;
  }

  return log;
};

/**
 * Updates the IPH view of the AgreementActivityResponse items for a particular agreement.
 * Specifically handles the case where the IPH has rejected a Creator's request for a license.
 */
export const filterIphContentLicensingAgreementActivity = (
  activityLog?: AgreementActivityResponse[],
): AgreementActivityResponse[] => {
  if (!activityLog || activityLog.length === 0) {
    return [];
  }

  let log = [...activityLog];
  if (log[0].transition === AgreementTransition.RejectApplication) {
    log = handleRejectApplicationContentLicensingAgreementActivity(log);
  }

  return log;
};

/**
 * Returns the appropriate StepLabel key for the AgreementActivityResponse.
 */
export const getLabelFromContentLicensingActivity = (
  activity: AgreementActivityResponse,
  enableIpPlatformConditionalOffers?: boolean,
): string => {
  const { transition, startStatus, endStatus } = activity;

  // Check start and/or end status first to see if the agreement is
  // entering a terminal state (ie Active, Unsuccessful, Archive)
  if (startStatus === AgreementStatus.Pending && endStatus === AgreementStatus.Active) {
    return 'Label.ActivityAgreementActive';
  }
  if (startStatus === AgreementStatus.Disputed && endStatus === AgreementStatus.Unsuccessful) {
    return 'Label.ActivityIphOfferUnsuccessful';
  }
  if (endStatus === AgreementStatus.Archived) {
    return 'Label.ActivityArchived';
  }
  if (endStatus === AgreementStatus.Cancelled) {
    return 'Label.ActivityCreatorCancelled';
  }
  if (startStatus === AgreementStatus.Inquired && endStatus === AgreementStatus.Accepted) {
    return 'Label.ActivityIphApprovedRequest';
  }

  // Otherwise, check transition for the agreement activity
  // oxlint-disable-next-line typescript/switch-exhaustiveness-check -- unhandled transitions use default label
  switch (transition) {
    case AgreementTransition.Offer:
      return 'Label.ActivityIphLicenseOffered';
    case AgreementTransition.Apply:
      return 'Label.CreatorRequestedLicense';
    case AgreementTransition.DisputeOffer:
      return 'Label.ActivityCreatorDisputedIphOffer';
    case AgreementTransition.AcceptDispute:
      return 'Label.ActivityIphAcceptedDispute';
    case AgreementTransition.RejectDispute:
      if (enableIpPlatformConditionalOffers && endStatus === AgreementStatus.ConditionalOffer) {
        return 'Label.ActivityIphRejectedConditionalOfferDispute';
      }
      return 'Label.ActivityIphRejectedDispute';
    case AgreementTransition.EnableMonetization:
      return 'Label.ActivityIphEnableMonetization';
    case AgreementTransition.ApproveApplication:
      return 'Label.ActivityIphAcceptedRequest';
    case AgreementTransition.RejectApplication:
      return 'Label.ActivityIphRejectedRequest';
    case AgreementTransition.InitiateTermination:
      return 'Label.ActivityIphInitiatedTermination';
    case AgreementTransition.InitiateChangeRequest:
      return 'Label.ActivityIphInitiatedChangeRequest';
    case AgreementTransition.CompleteChangeRequest:
      return 'Label.ActivityCreatorCompletedChangeRequest';
    case AgreementTransition.AcknowledgeCompletedChangeRequest:
      return 'Label.ActivityIphAcknowledgedChangeRequestCompletion';
    case AgreementTransition.ExpireChangeRequest:
      return 'Label.ActivityChangeRequestExpired';
    case AgreementTransition.IphInitiateConditionalChangeRequest:
      if (!enableIpPlatformConditionalOffers) {
        return 'Label.ActivityUnknown';
      }
      if (startStatus !== AgreementStatus.ConditionalOffer) {
        return 'Label.ActivityConditionalOfferInitiated';
      }
      return 'Label.ActivityIphInitiatedConditionalChangeRequest';
    case AgreementTransition.CreatorCompleteConditionalChangeRequest:
      return enableIpPlatformConditionalOffers
        ? 'Label.ActivityCreatorCompletedChangeRequest'
        : 'Label.ActivityUnknown';
    case AgreementTransition.IphApproveConditionalChangeRequest:
      return enableIpPlatformConditionalOffers
        ? 'Label.ActivityIphAcknowledgedChangeRequestCompletion'
        : 'Label.ActivityUnknown';
    case AgreementTransition.IphRejectConditionalChangeRequest:
      return enableIpPlatformConditionalOffers
        ? 'Label.ActivityIphRejectedConditionalChangeRequest'
        : 'Label.ActivityUnknown';
    case AgreementTransition.ExpireConditionalChangeRequest:
      return enableIpPlatformConditionalOffers
        ? 'Label.ActivityConditionalChangeRequestExpired'
        : 'Label.ActivityUnknown';
    case AgreementTransition.ActivateAcceptedAgreement:
    case AgreementTransition.EarlyActivateAcceptedAgreement:
      return 'Label.ActivityActivateAcceptedAgreement';
    case AgreementTransition.ActivateInquiredAgreement:
      return 'Label.ActivityIphAcceptedRequest';
    case AgreementTransition.Expire:
      return 'Label.ActivityExpired';
    case AgreementTransition.CreatorAttestIpRemoval:
      return 'Label.ActivityCreatorRemovedIp';
    case AgreementTransition.ExpireAttestation:
      return 'Label.ActivityCreatorRemovedIpExpired';
    case AgreementTransition.ScannerResultFound:
      return 'Label.ActivityIpUsageDetected';
    default:
      return 'Label.ActivityUnknown';
  }
};

/**
 * Returns the specific AgreementActivityResponse from an agreement log with the desired transition, if it exists.
 * Otherwise, return undefined.
 */
export const getAgreementActivityByTransition = (
  activityLog: AgreementActivityResponse[] | undefined | null,
  transition: AgreementTransition,
): AgreementActivityResponse | undefined => {
  if (!activityLog || activityLog.length === 0) {
    return undefined;
  }

  return activityLog.find((item) => item.transition === transition);
};

/**
 * Returns the most recent Creator dispute activity, if one exists.
 */
export const getLatestDisputeOfferActivity = (
  activityLog: AgreementActivityResponse[] | undefined | null,
): AgreementActivityResponse | undefined => {
  return getAgreementActivityByTransition(activityLog, AgreementTransition.DisputeOffer);
};

/**
 * Whether the agreement's current or most recent dispute originated from a conditional offer.
 */
export const isConditionalOfferDisputeAgreement = (
  agreement: HydratedAgreementWithHydratedTargetsResponse,
): boolean => {
  const latestDisputeActivity = getLatestDisputeOfferActivity(agreement.activityLog);
  return latestDisputeActivity?.startStatus === AgreementStatus.ConditionalOffer;
};

/**
 * Returns the appropriate label key for who the body of text is coming from for the Agreement
 * Activity's notes.
 */
export const getNotesLabelFromAgreementActivity = (
  activity: AgreementActivityResponse,
  enableIpPlatformConditionalOffers?: boolean,
): string => {
  const { transition } = activity;
  // oxlint-disable-next-line typescript/switch-exhaustiveness-check -- unhandled transitions use default notes label
  switch (transition) {
    case AgreementTransition.CancelAcceptedAgreement:
    case AgreementTransition.CancelApplication:
      return 'Label.NoteFromCreator';
    case AgreementTransition.Apply:
    case AgreementTransition.DisputeOffer:
      return 'Label.NoteFromCreator';
    case AgreementTransition.RejectApplication:
      return 'Label.NoteFromRightsHolder';
    case AgreementTransition.InitiateChangeRequest:
      return 'Label.Details';
    case AgreementTransition.IphInitiateConditionalChangeRequest:
      return enableIpPlatformConditionalOffers
        ? 'Label.ActivitySubHeadingIphInitiatedConditionalChangeRequest'
        : 'Label.Response';
    case AgreementTransition.ActivateInquiredAgreement:
    case AgreementTransition.EarlyActivateAcceptedAgreement:
      return 'Label.Details';
    default:
      return 'Label.Response';
  }
};

/**
 * Returns the appropriate label key for the content coming from for the Agreement
 * Activity's notes.
 */
export const getNotesBodyFromAgreementActivity = (
  activity: AgreementActivityResponse,
  translate: (
    key: string,
    args?: {
      [key: string]: string;
    },
  ) => string,
  listingName: string,
): string => {
  const { transition } = activity;

  if (
    transition === AgreementTransition.CancelAcceptedAgreement ||
    transition === AgreementTransition.CancelApplication
  ) {
    return translate(resolveCancellationNotesToLabelKey(activity.notes));
  }
  if (transition === AgreementTransition.ActivateInquiredAgreement) {
    return translate('Label.ActivityBodyActivateInquiredAgreement', { listingName });
  }
  if (transition === AgreementTransition.EarlyActivateAcceptedAgreement) {
    return translate('Label.ActivityBodyActivateAcceptedAgreementEarlyIpUsage', { listingName });
  }

  if (transition === AgreementTransition.DisputeOffer) {
    return translate(getReasonFromString(activity.notes ?? ''));
  }

  return activity.notes ?? translate('Label.Unknown');
};

/**
 * Whether an activity row in the agreement activity log should render a notes / details block
 * (e.g. in the activity tab stepper). Uses the same filtered log order as the UI (newest first).
 */
export const shouldShowAgreementActivityNotesSection = (
  activity: AgreementActivityResponse,
): boolean => {
  const { transition, notes } = activity;

  if (
    transition === AgreementTransition.ActivateInquiredAgreement ||
    transition === AgreementTransition.EarlyActivateAcceptedAgreement
  ) {
    return true;
  }

  if (notes && transition === AgreementTransition.ApproveApplication) {
    // Backend intentionally returns Creator's proposed startDate in notes field to preserve
    // the original value in case of early activation due to early IP usage
    return false;
  }

  return Boolean(notes);
};

/**
 * Returns true if the first ever OR the newest activity has transition === AgreementTransition.ScannerResultFound.
 * Used to detect early IP usage in pre-active license agreements.
 */
export const isEarlyIpUsageDetected = (
  activityLog: AgreementActivityResponse[] | undefined | null,
): boolean => {
  if (!activityLog || activityLog.length === 0) {
    return false;
  }
  const deepScanActivity = getAgreementActivityByTransition(
    activityLog,
    AgreementTransition.ScannerResultFound,
  );
  if (deepScanActivity !== undefined) {
    return (
      deepScanActivity === activityLog[0] ||
      deepScanActivity === activityLog[activityLog.length - 1]
    );
  }
  return false;
};

/**
 * Get the translation key corresponding to the Creator's cancellation reason. Otherwise, unknown.
 */
export const getCancelReasonLabelKey = (activityLog: AgreementActivityResponse[]) => {
  const cancelInquiredAgreementActivity = getAgreementActivityByTransition(
    activityLog,
    AgreementTransition.CancelApplication,
  );
  const cancelAcceptedAgreementActivity = getAgreementActivityByTransition(
    activityLog,
    AgreementTransition.CancelAcceptedAgreement,
  );
  const labelFromCancelApplication = resolveCancellationNotesToLabelKey(
    cancelInquiredAgreementActivity?.notes,
  );
  // resolveCancellationNotesToLabelKey will return Label.Unknown in cases where it cannot resolve the key provided
  if (labelFromCancelApplication !== 'Label.Unknown') {
    return labelFromCancelApplication;
  }
  return resolveCancellationNotesToLabelKey(cancelAcceptedAgreementActivity?.notes);
};
