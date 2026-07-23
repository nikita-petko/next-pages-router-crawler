import {
  AgreementActivityResponse,
  AgreementTransition,
  AgreementStatus,
} from '@rbx/clients/contentLicensingApi/v1';

import {
  DAYS_FOR_CREATOR_TO_COMPLETE_CHANGE_REQUEST,
  DAYS_FOR_CREATOR_TO_RESPOND_TO_EXPIRED_CHANGE_REQUEST,
  DAYS_FOR_IPH_TO_RESPOND_TO_COMPLETED_CHANGE_REQUEST,
  MS_PER_DAY,
} from '../../constants';
import { TimelimitedDateRange } from '../../utils/timeLimitedLicense';
import { getReasonFromString } from '../../utils/disputeReason';

export const TIME_TO_RESPONSE_TO_NEW_CHANGE_REQUEST =
  DAYS_FOR_CREATOR_TO_COMPLETE_CHANGE_REQUEST * MS_PER_DAY;
export const TIME_TO_RESPOND_TO_EXPIRED_CHANGE_REQUEST =
  DAYS_FOR_CREATOR_TO_RESPOND_TO_EXPIRED_CHANGE_REQUEST * MS_PER_DAY;
export const TIME_TO_RESPOND_TO_COMPLETED_CHANGE_REQUEST =
  DAYS_FOR_IPH_TO_RESPOND_TO_COMPLETED_CHANGE_REQUEST * MS_PER_DAY;

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
 * Calculates the date that a specific agreement activity should "expire".
 * Used for change requests expiry and time-limited licenses activation and expiry.
 */
export const getSpecificActivityExpireDate = (
  activity: AgreementActivityResponse | undefined,
  timeBoundDateRange?: TimelimitedDateRange,
  enableIpPlatformTimeboundLicenses?: boolean,
): Date | undefined => {
  if (!activity) {
    return undefined;
  }

  if (
    enableIpPlatformTimeboundLicenses &&
    timeBoundDateRange &&
    activity.endStatus === AgreementStatus.Accepted
  ) {
    return timeBoundDateRange.startDate;
  }

  if (activity.createdAt) {
    const createdAt = new Date(activity.createdAt);
    switch (activity.transition as AgreementTransition) {
      // Change requests
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
  enableIpPlatformTimeboundLicenses?: boolean,
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
  if (enableIpPlatformTimeboundLicenses) {
    if (endStatus === AgreementStatus.Cancelled) {
      return 'Label.ActivityCreatorCancelled';
    }
    if (endStatus === AgreementStatus.Accepted) {
      return 'Label.ActivityIphApprovedRequest';
    }
  }

  // Otherwise, check transition for the agreement activity
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
    case AgreementTransition.ActivateAcceptedAgreement:
      return 'Label.ActivityActivateAcceptedAgreement';
    case AgreementTransition.Expire:
      return enableIpPlatformTimeboundLicenses ? 'Label.ActivityExpired' : 'Label.ActivityUnknown';
    case AgreementTransition.CreatorAttestIpRemoval:
      return enableIpPlatformTimeboundLicenses
        ? 'Label.ActivityCreatorRemovedIp'
        : 'Label.ActivityUnknown';
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
 * Returns the appropriate label key for who the body of text is coming from for the Agreement
 * Activity's notes.
 */
export const getNotesLabelFromAgreementActivity = (
  activity: AgreementActivityResponse,
  enableIpPlatformTimeboundLicenses?: boolean,
): string => {
  const { transition } = activity;
  switch (transition) {
    case AgreementTransition.CancelAcceptedAgreement:
    case AgreementTransition.CancelApplication:
      return enableIpPlatformTimeboundLicenses ? 'Label.NoteFromCreator' : 'Label.Response';
    case AgreementTransition.Apply:
    case AgreementTransition.DisputeOffer:
      return 'Label.NoteFromCreator';
    case AgreementTransition.RejectApplication:
      return 'Label.NoteFromRightsHolder';
    case AgreementTransition.InitiateChangeRequest:
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
  enableIpPlatformTimeboundLicenses?: boolean,
): string => {
  const { transition } = activity;

  if (
    enableIpPlatformTimeboundLicenses &&
    (transition === AgreementTransition.CancelAcceptedAgreement ||
      transition === AgreementTransition.CancelApplication)
  ) {
    return activity.notes!;
    // TODO - aquach - uncomment this once backend returns CancellationReason enum
    // return translate(resolveCancellationNotesToLabelKey(activity.notes));
  }

  if (transition === AgreementTransition.DisputeOffer) {
    return translate(getReasonFromString(activity.notes!));
  }

  return activity.notes ?? translate('Label.Unknown');
};
