/* oxlint-disable typescript/switch-exhaustiveness-check typescript/no-non-null-assertion -- intentional default branches and guarded activity log access */
import React, { memo, useCallback, useMemo } from 'react';
import type { HydratedAgreementWithHydratedTargetsResponse } from '@rbx/client-content-licensing-api/v1';
import {
  AgreementStatus,
  AgreementTransition,
  IpRemovalAttestationStatus,
  LicenseDurationType,
} from '@rbx/client-content-licensing-api/v1';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import { Alert, AlertTitle, Button, makeStyles } from '@rbx/ui';
import { isNonEmptyString } from '@modules/miscellaneous/utils';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import AgreementDetailsTabs from '../../agreements/enums/AgreementDetailsTabs';
import {
  getAgreementActivityByTransition,
  getCancelReasonLabelKey,
  getLatestChangeRequestExpireDate,
  getLatestConditionalChangeRequestExpireDate,
  getConditionalChangeRequestWindowExpireDate,
} from '../../agreements/utils/agreementActivity';
import formatDate from '../../agreements/utils/formatDate';
import { getLatestDisputeReasonLabelKey, MAX_DISPUTE_ATTEMPTS } from '../../utils/disputeReason';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../../utils/logger';
import { isWithinThreeDaysOfDate } from '../../utils/timeLimitedLicense';

const useStyles = makeStyles()(() => ({
  fullWidth: {
    width: '100%',
  },
  /** Keeps action controls from shrinking below their content on narrow viewports */
  alertAction: {
    flex: '0 0 fit-content',
    alignItems: 'center',
  },
  buttonContainer: {
    display: 'flex',
    flexWrap: 'nowrap',
    gap: '8px',
    alignSelf: 'center',
    marginTop: '-4px',
  },
  actionButtonLabel: {
    whiteSpace: 'nowrap',
  },
}));

type severity = 'warning' | 'success' | 'error' | 'info';

export enum AlertType {
  Active = 'Active',
  Disputed = 'Disputed',
  DisputeAccepted = 'DisputeAccepted',
  DisputeMaxed = 'DisputeMaxed',
  DisputeRejected = 'DisputeRejected',
  RequestRejected = 'RequestRejected',
  RequestRejectedWithFeedback = 'RequestRejectedWithFeedback',
  Terminated = 'Terminated',
  ChangeRequestReceived = 'ChangeRequestReceived',
  ChangeRequestExpired = 'ChangeRequestExpired',
  ConditionalChangeRequestReceived = 'ConditionalChangeRequestReceived',
  ConditionalChangeRequestConfirmed = 'ConditionalChangeRequestConfirmed',
  ConditionalChangeRequestExpired = 'ConditionalChangeRequestExpired',
  ConditionalChangeRequestResent = 'ConditionalChangeRequestResent',
  ConditionalChangeRequestRejected = 'ConditionalChangeRequestRejected',
  TimelimitedPendingExpiration = 'TimelimitedPendingExpiration',
  Cancelled = 'Cancelled',
  IpRemovalAttestationInitiated = 'IpRemovalAttestationInitiated',
  IpRemovalAttestationCompleted = 'IpRemovalAttestationCompleted',
  IpRemovalAttestationExpired = 'IpRemovalAttestationExpired',
}

interface Content {
  severity: severity;
  headerText?: string;
  bodyText: string;
  bodyTextHasReason?: boolean;
}

const statusToContent: { [key in AlertType]: Content } = {
  Active: {
    severity: 'success',
    headerText: 'Heading.LicenseAcceptedWithDate',
    bodyText: 'Description.LicenseAccepted',
  },
  Disputed: {
    severity: 'warning',
    headerText: 'Heading.LicenseDisputedWithDate',
    bodyText: 'Description.LicenseDisputedWithReason',
    bodyTextHasReason: true,
  },
  DisputeAccepted: {
    severity: 'success',
    headerText: 'Heading.DisputeAcceptedWithDate',
    bodyText: 'Description.LicenseDisputedWithReason',
    bodyTextHasReason: true,
  },
  DisputeMaxed: {
    severity: 'success',
    headerText: 'Heading.LicenseDisputedWithDate',
    bodyText: 'Description.LicenseDisputedWithReason',
    bodyTextHasReason: true,
  },
  DisputeRejected: {
    severity: 'error',
    headerText: 'Heading.DisputeRejectedWithDate',
    bodyText: 'Description.DisputeRejected',
  },
  RequestRejected: {
    severity: 'error',
    headerText: 'Heading.LicenseRejectedWithDate',
    bodyText: 'Description.LicenseRejected',
  },
  RequestRejectedWithFeedback: {
    severity: 'error',
    headerText: 'Heading.LicenseRejectedWithDate',
    bodyText: 'Description.LicenseRejectedWithFeedback',
  },
  Terminated: {
    severity: 'error',
    headerText: 'Heading.CreatorTerminatedWithDate',
    bodyText: 'Description.CreatorTerminated',
  },
  ChangeRequestReceived: {
    severity: 'error',
    headerText: 'Heading.CreatorChangeRequestInitiatedAlert',
    bodyText: 'Description.CreatorChangeRequestInitiatedAlert',
  },
  ChangeRequestExpired: {
    severity: 'error',
    headerText: 'Heading.CreatorChangeRequestLateAlert',
    bodyText: 'Message.CreatorChangeRequestLateAlert',
  },
  ConditionalChangeRequestReceived: {
    severity: 'warning',
    bodyText: 'Description.CreatorConditionalChangeRequestInitiatedAlert',
  },
  ConditionalChangeRequestConfirmed: {
    severity: 'info',
    bodyText: 'Description.CreatorConditionalChangeRequestConfirmedAlert',
  },
  ConditionalChangeRequestExpired: {
    severity: 'error',
    bodyText: 'Description.CreatorConditionalChangeRequestExpiredAlert',
  },
  ConditionalChangeRequestResent: {
    severity: 'warning',
    bodyText: 'Description.ConditionalChangeRequestResentAlert',
  },
  ConditionalChangeRequestRejected: {
    severity: 'error',
    bodyText: 'Description.IphConditionalChangeRequestRejectedAlert',
  },
  TimelimitedPendingExpiration: {
    severity: 'warning',
    headerText: 'Heading.CreatorExpiresOnWithDate',
    bodyText: 'Description.CreatorTimeboundLicensePendingTermination',
  },
  Cancelled: {
    severity: 'error',
    headerText: 'Heading.CancelledAlertWithDate',
    bodyText: 'Description.LicenseDisputedWithReason',
    bodyTextHasReason: true,
  },
  IpRemovalAttestationInitiated: {
    severity: 'warning',
    headerText: 'Heading.GenericAgreementExpiredWithDate',
    bodyText: 'Description.CreatorIpRemovalAttestationInitiated',
  },
  IpRemovalAttestationCompleted: {
    severity: 'success',
    headerText: 'Heading.GenericAgreementExpiredWithDate',
    bodyText: 'Description.CreatorIpRemovalAttestationCompleted',
  },
  IpRemovalAttestationExpired: {
    severity: 'error',
    headerText: 'Heading.GenericAgreementExpiredWithDate',
    bodyText: 'Description.CreatorIpRemovalAttestationExpired',
  },
};

const getAlertType = (
  agreement: HydratedAgreementWithHydratedTargetsResponse,
  isTimelimitedLicense?: boolean,
  enableIpPlatformConditionalOffers?: boolean,
): AlertType | null => {
  if (!agreement || !agreement.status) {
    return null;
  }
  const { status, activityLog, disputeReasons, ipRemovalAttestation, endTime } = agreement;
  const numDisputeReasons = disputeReasons?.length ?? 0;
  const rejectApplicationLog = getAgreementActivityByTransition(
    activityLog,
    AgreementTransition.RejectApplication,
  );

  if (activityLog) {
    const { transition } = activityLog[0];
    if (status === AgreementStatus.Active) {
      // Change requests are only valid for active agreements
      // oxlint-disable-next-line typescript/switch-exhaustiveness-check -- non-change-request transitions fall through
      switch (transition) {
        case AgreementTransition.InitiateChangeRequest:
          return AlertType.ChangeRequestReceived;
        case AgreementTransition.ExpireChangeRequest: {
          // Autohide overdue alerts from Creators after 7 days if not already dismissed
          const autoHideDate = getLatestChangeRequestExpireDate(activityLog);
          if (autoHideDate && Date.now() > autoHideDate.getTime()) {
            break;
          }
          return AlertType.ChangeRequestExpired;
        }
        default:
          break;
      }
    }
    if (enableIpPlatformConditionalOffers && status === AgreementStatus.ConditionalOffer) {
      if (numDisputeReasons > 0 && transition === AgreementTransition.RejectDispute) {
        return AlertType.ConditionalChangeRequestResent;
      }
      switch (transition) {
        case AgreementTransition.CreatorCompleteConditionalChangeRequest:
          return AlertType.ConditionalChangeRequestConfirmed;
        case AgreementTransition.IphInitiateConditionalChangeRequest:
          return AlertType.ConditionalChangeRequestReceived;
        case AgreementTransition.ExpireConditionalChangeRequest:
          return AlertType.ConditionalChangeRequestExpired;
        default:
          break;
      }
    }
    if (
      enableIpPlatformConditionalOffers &&
      (status === AgreementStatus.Unsuccessful || status === AgreementStatus.Archived) &&
      transition === AgreementTransition.IphRejectConditionalChangeRequest
    ) {
      return AlertType.ConditionalChangeRequestRejected;
    }
  }

  if (isTimelimitedLicense && status === AgreementStatus.Expired && ipRemovalAttestation) {
    const { ipRemovalAttestationStatus } = ipRemovalAttestation;
    // oxlint-disable-next-line typescript/switch-exhaustiveness-check -- other attestation statuses fall through
    switch (ipRemovalAttestationStatus) {
      case IpRemovalAttestationStatus.Pending:
        return AlertType.IpRemovalAttestationInitiated;
      case IpRemovalAttestationStatus.Attested:
        return AlertType.IpRemovalAttestationCompleted;
      case IpRemovalAttestationStatus.NotAttested:
        return AlertType.IpRemovalAttestationExpired;
      default:
        break;
    }
  }

  // oxlint-disable-next-line typescript/switch-exhaustiveness-check -- unhandled statuses return null via default
  switch (status) {
    case AgreementStatus.Active:
      if (isTimelimitedLicense && isWithinThreeDaysOfDate(endTime)) {
        return AlertType.TimelimitedPendingExpiration;
      }
      return AlertType.Active;
    case AgreementStatus.Disputed:
      return AlertType.Disputed;
    case AgreementStatus.Unsuccessful:
      return AlertType.DisputeMaxed;
    case AgreementStatus.Pending:
      // Pending status with dispute history means dispute was rejected
      if (numDisputeReasons > 0) {
        return AlertType.DisputeRejected;
      }
      // Pending status with no dispute history means IPH just sent the license offer
      // So no alert should be shown
      return null;
    case AgreementStatus.Archived:
      // Archived status with dispute history implies IPH initiated
      if (numDisputeReasons > 0) {
        if (numDisputeReasons >= MAX_DISPUTE_ATTEMPTS) {
          return AlertType.DisputeMaxed;
        }
        return AlertType.DisputeAccepted;
      }
      // Archived status with no dispute history implies Creator initiated
      // If rejection has IPH feedback, show the specific feedback
      if (rejectApplicationLog?.notes && rejectApplicationLog?.notes !== '') {
        return AlertType.RequestRejectedWithFeedback;
      }
      // If rejection has no feedback, then show generic feedback
      return AlertType.RequestRejected;
    case AgreementStatus.Terminated:
      return AlertType.Terminated;
    case AgreementStatus.Cancelled:
      return AlertType.Cancelled;
    default:
      // All other AgreementStatuses should not have an alert shown
      return null;
  }
};

/**
 * Generates a unique dismissal key for an alert.
 * For ChangeRequestReceived, includes the activity log ID
 * to allow multiple instances of these alerts to be dismissed independently.
 * For other alert types, uses just the alertType since they only appear once.
 */
const getDismissalKey = (
  alertType: AlertType,
  activityLog?: Array<{ id?: string | null }> | null,
): string => {
  const isMultiInstanceAlert =
    alertType === AlertType.ChangeRequestReceived ||
    alertType === AlertType.ConditionalChangeRequestReceived ||
    alertType === AlertType.ConditionalChangeRequestRejected;

  if (isMultiInstanceAlert && activityLog && activityLog.length > 0 && activityLog[0].id) {
    return `${alertType}_${activityLog[0].id}`;
  }

  return alertType;
};

const isNonDismissableAlert = (alertType: AlertType): boolean => {
  return (
    alertType === AlertType.ConditionalChangeRequestReceived ||
    alertType === AlertType.ConditionalChangeRequestConfirmed ||
    alertType === AlertType.ConditionalChangeRequestExpired ||
    alertType === AlertType.ConditionalChangeRequestResent
  );
};

interface Props {
  agreement: HydratedAgreementWithHydratedTargetsResponse;
  listingName: string;
  handleTabChange?: (event: unknown, newTabValue: string) => void;
  handleCompleteChangeRequest?: () => void;
  handleCompleteConditionalChangeRequest?: () => void;
  handleCompleteIpRemoval?: () => void;
}

const CreatorAgreementAlert: React.FC<Props> = ({
  agreement,
  listingName,
  handleTabChange,
  handleCompleteChangeRequest,
  handleCompleteConditionalChangeRequest,
  handleCompleteIpRemoval,
}) => {
  const { locale } = useLocalization();
  const { translate } = useTranslation();
  const {
    classes: { fullWidth, alertAction, buttonContainer, actionButtonLabel },
  } = useStyles();
  const { logEvent } = useLicenseManagerLogger();
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformConditionalOffers } = settings;
  const isTimelimitedLicense =
    agreement.license?.licenseDuration?.durationType === LicenseDurationType.TimeLimited;

  const alertType = getAlertType(
    agreement,
    isTimelimitedLicense,
    enableIpPlatformConditionalOffers,
  );
  const dismissalKey = useMemo(() => {
    if (!alertType) {
      return null;
    }
    return getDismissalKey(alertType, agreement.activityLog ?? undefined);
  }, [alertType, agreement.activityLog]);
  const [dismissedAlertKeys, setDismissedAlertKeys] = useLocalStorage<string[]>(
    `dismissedAgreementAlerts_${agreement.id}`,
    [],
  );

  const onClose = useCallback(() => {
    if (!alertType || !dismissalKey) {
      return;
    }

    const agreementId = agreement.id;
    if (!isNonEmptyString(agreementId)) {
      return;
    }

    logEvent(LicenseManagerClickEvent.CreatorAgreementDetailsPageDismissAlertClickEvent, {
      agreementId,
      alertType,
    });

    setDismissedAlertKeys((prev) => {
      const prevArray = prev && Array.isArray(prev) ? prev : [];
      if (prevArray.includes(dismissalKey)) {
        return prevArray;
      }
      return [...prevArray, dismissalKey];
    });
  }, [agreement.id, alertType, dismissalKey, logEvent, setDismissedAlertKeys]);

  const isDismissed = useMemo(() => {
    if (!dismissalKey) {
      return false;
    }
    if (!dismissedAlertKeys || !Array.isArray(dismissedAlertKeys)) {
      return false;
    }
    return dismissedAlertKeys.includes(dismissalKey);
  }, [dismissedAlertKeys, dismissalKey]);

  const openActivityTab = useCallback(() => {
    handleTabChange?.(null, AgreementDetailsTabs.Activity);
  }, [handleTabChange]);

  const alertClasses = useMemo(() => ({ action: alertAction }), [alertAction]);
  const isDismissable = alertType ? !isNonDismissableAlert(alertType) : false;

  if (!isFetched || !alertType || !agreement.updatedAt || (isDismissable && isDismissed)) {
    return null;
  }

  let headerDate: Date | undefined;
  let bodyDate: Date | undefined;
  // oxlint-disable-next-line typescript/switch-exhaustiveness-check -- alert types without dates use updatedAt default
  switch (alertType) {
    case AlertType.ChangeRequestReceived:
      bodyDate = getLatestChangeRequestExpireDate(agreement.activityLog ?? undefined);
      break;
    case AlertType.ConditionalChangeRequestReceived:
    case AlertType.ConditionalChangeRequestResent:
      bodyDate =
        agreement.conditionalChangeRequest?.expiresAtTime ??
        getLatestConditionalChangeRequestExpireDate(agreement.activityLog!);
      break;
    case AlertType.ConditionalChangeRequestExpired:
      bodyDate = getConditionalChangeRequestWindowExpireDate(
        agreement.activityLog!,
        agreement.conditionalChangeRequest?.expiresAtTime,
      );
      break;
    case AlertType.ChangeRequestExpired:
      bodyDate = agreement.activityLog?.[0]?.createdAt ?? undefined;
      break;
    case AlertType.TimelimitedPendingExpiration:
      headerDate = agreement.endTime ?? undefined;
      break;
    case AlertType.IpRemovalAttestationInitiated:
    case AlertType.IpRemovalAttestationCompleted:
    case AlertType.IpRemovalAttestationExpired:
      headerDate = agreement.endTime ?? undefined;
      bodyDate = agreement.ipRemovalAttestation?.expiresAtTime ?? undefined;
      break;
    default:
      headerDate = agreement.updatedAt;
      bodyDate = agreement.updatedAt;
      break;
  }

  const content = statusToContent[alertType];
  const alertLocale = locale ?? Locale.English;
  const headerText = content.headerText
    ? translate(content.headerText, {
        listingName,
        date: formatDate(headerDate, alertLocale),
      })
    : undefined;
  let bodyText = translate(content.bodyText, {
    listingName,
    ipListing: listingName,
    date: formatDate(bodyDate, alertLocale),
    // The following fields are specific to IpRemovalAttestation{...} alerts
    expiryDate: formatDate(bodyDate, alertLocale),
    endDate: formatDate(headerDate, alertLocale),
  });

  if (content.bodyTextHasReason) {
    if (alertType === AlertType.Cancelled) {
      bodyText = translate(content.bodyText, {
        reason: translate(getCancelReasonLabelKey(agreement.activityLog ?? [])),
      });
    } else {
      // Otherwise, alertTypes with bodyTextHasReason are Disputed, DisputeAccepted, and DisputeMaxed
      bodyText = translate(content.bodyText, {
        reason: translate(getLatestDisputeReasonLabelKey(agreement)),
      });
    }
  }

  let action: React.ReactNode;
  // oxlint-disable-next-line typescript/switch-exhaustiveness-check -- alerts without actions use null action
  switch (alertType) {
    case AlertType.ChangeRequestReceived:
      action = (
        <div className={buttonContainer}>
          <Button
            className={actionButtonLabel}
            variant='text'
            color='inherit'
            size='small'
            onClick={openActivityTab}>
            {translate('Action.ViewRequest')}
          </Button>
          <Button
            className={actionButtonLabel}
            variant='outlined'
            color='inherit'
            size='small'
            onClick={handleCompleteChangeRequest}>
            {translate('Action.ChangeImplemented')}
          </Button>
        </div>
      );
      break;
    case AlertType.ConditionalChangeRequestReceived:
    case AlertType.ConditionalChangeRequestResent:
      action = (
        <div className={buttonContainer}>
          <Button
            className={actionButtonLabel}
            variant='text'
            color='inherit'
            size='small'
            onClick={openActivityTab}>
            {translate('Action.ViewRequest')}
          </Button>
          <Button
            className={actionButtonLabel}
            variant='outlined'
            color='inherit'
            size='small'
            onClick={handleCompleteConditionalChangeRequest}>
            {translate('Action.ChangeImplemented')}
          </Button>
        </div>
      );
      break;
    case AlertType.ConditionalChangeRequestExpired:
      action = (
        <div className={buttonContainer}>
          <Button
            className={actionButtonLabel}
            variant='text'
            color='inherit'
            size='small'
            onClick={openActivityTab}>
            {translate('Action.ViewRequest')}
          </Button>
          <Button
            className={actionButtonLabel}
            variant='outlined'
            color='inherit'
            size='small'
            onClick={onClose}>
            {translate('Action.Dismiss')}
          </Button>
        </div>
      );
      break;
    case AlertType.ChangeRequestExpired:
      action = (
        <div className={buttonContainer}>
          <Button
            className={actionButtonLabel}
            variant='text'
            color='inherit'
            size='small'
            onClick={openActivityTab}>
            {translate('Action.ViewRequest')}
          </Button>
          <Button
            className={actionButtonLabel}
            variant='outlined'
            color='inherit'
            size='small'
            onClick={onClose}>
            {translate('Action.Dismiss')}
          </Button>
        </div>
      );
      break;
    case AlertType.RequestRejectedWithFeedback:
      action = (
        <Button
          className={actionButtonLabel}
          variant='outlined'
          color='inherit'
          size='small'
          onClick={openActivityTab}>
          {translate('Action.SeeFullReason')}
        </Button>
      );
      break;
    case AlertType.IpRemovalAttestationInitiated:
      action = (
        <Button
          className={actionButtonLabel}
          variant='outlined'
          color='inherit'
          size='small'
          onClick={handleCompleteIpRemoval}>
          {translate('Action.ChangeImplemented')}
        </Button>
      );
      break;
    default:
      break;
  }

  return (
    <Alert
      severity={content.severity}
      variant='outlined'
      className={fullWidth}
      classes={alertClasses}
      onClose={isDismissable ? onClose : undefined}
      action={action}>
      {headerText ? <AlertTitle paddingBottom={1}>{headerText}</AlertTitle> : null}
      {bodyText}
    </Alert>
  );
};

export default memo(CreatorAgreementAlert);
