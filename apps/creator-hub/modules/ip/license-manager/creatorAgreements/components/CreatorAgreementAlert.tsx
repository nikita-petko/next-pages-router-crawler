import React, { memo, useCallback, useMemo } from 'react';
import { Alert, AlertTitle, Button, makeStyles } from '@rbx/ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import {
  AgreementStatus,
  AgreementTransition,
  HydratedAgreementWithHydratedTargetsResponse,
  IpRemovalAttestationStatus,
  LicenseDurationType,
} from '@rbx/clients/contentLicensingApi/v1';
import { useSettings } from '@modules/settings';

import { AgreementDetailsTabs } from '../../agreements/IphAgreementDetailsContainer';
import { getLatestDisputeReasonLabelKey, MAX_DISPUTE_ATTEMPTS } from '../../utils/disputeReason';
import {
  getAgreementActivityByTransition,
  getLatestChangeRequestExpireDate,
} from '../../agreements/utils/agreementActivity';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../../utils/logger';
import { isWithinThreeDaysOfDate } from '../../utils/timeLimitedLicense';

const useStyles = makeStyles()(() => ({
  fullWidth: {
    width: '100%',
  },
  buttonContainer: {
    display: 'flex',
    gap: '8px',
    alignSelf: 'center',
    marginTop: '-4px',
  },
}));

type severity = 'warning' | 'success' | 'error';

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
  TimelimitedPendingTermination = 'TimelimitedPendingTermination',
  Cancelled = 'Cancelled',
  IpRemovalAttestationInitiated = 'IpRemovalAttestationInitiated',
  IpRemovalAttestationCompleted = 'IpRemovalAttestationCompleted',
  IpRemovalAttestationExpired = 'IpRemovalAttestationExpired',
}

interface Content {
  severity: severity;
  headerText: string;
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
  TimelimitedPendingTermination: {
    severity: 'warning',
    headerText: 'Heading.CreatorTerminatesOnWithDate',
    bodyText: 'Description.CreatorTimeboundLicensePendingTermination',
  },
  Cancelled: {
    severity: 'error',
    headerText: 'Heading.CancelledAlertWithDate',
    bodyText: 'Description.LicenseDisputedWithReason',
    bodyTextHasReason: true,
  },
  IpRemovalAttestationInitiated: {
    severity: 'error',
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
  enableIpPlatformTimeboundLicenses?: boolean,
): AlertType | null => {
  if (!agreement || !agreement.status) {
    return null;
  }
  const { status, activityLog, disputeReasons, ipRemovalAttestation, terminatesAt } = agreement;
  const numDisputeReasons = disputeReasons?.length ?? 0;
  const rejectApplicationLog = getAgreementActivityByTransition(
    activityLog,
    AgreementTransition.RejectApplication,
  );

  if (activityLog) {
    const { transition } = activityLog[0];
    if (status === AgreementStatus.Active) {
      // Change requests are only valid for active agreements
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
  }

  if (
    enableIpPlatformTimeboundLicenses &&
    isTimelimitedLicense &&
    status === AgreementStatus.Expired &&
    ipRemovalAttestation
  ) {
    const { ipRemovalAttestationStatus } = ipRemovalAttestation;
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

  switch (status) {
    case AgreementStatus.Active:
      if (isTimelimitedLicense && isWithinThreeDaysOfDate(terminatesAt)) {
        return AlertType.TimelimitedPendingTermination;
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
      if (enableIpPlatformTimeboundLicenses) {
        return AlertType.Cancelled;
      }
      return null;
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
  const isMultiInstanceAlert = alertType === AlertType.ChangeRequestReceived;

  if (isMultiInstanceAlert && activityLog && activityLog.length > 0 && activityLog[0].id) {
    return `${alertType}_${activityLog[0].id}`;
  }

  return alertType;
};

interface Props {
  agreement: HydratedAgreementWithHydratedTargetsResponse;
  listingName: string;
  handleTabChange?: (event: unknown, newTabValue: string) => void;
  handleCompleteChangeRequest?: () => void;
  handleCompleteIpRemoval?: () => void;
}

const CreatorAgreementAlert: React.FC<Props> = ({
  agreement,
  listingName,
  handleTabChange,
  handleCompleteChangeRequest,
  handleCompleteIpRemoval,
}) => {
  const { locale } = useLocalization();
  const { translate } = useTranslation();
  const {
    classes: { fullWidth, buttonContainer },
  } = useStyles();
  const { logEvent } = useLicenseManagerLogger();
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;
  const isTimelimitedLicense =
    enableIpPlatformTimeboundLicenses &&
    agreement.license?.licenseDuration?.durationType === LicenseDurationType.TimeLimited;

  const alertType = getAlertType(
    agreement,
    isTimelimitedLicense,
    enableIpPlatformTimeboundLicenses,
  );
  const dismissalKey = useMemo(() => {
    if (!alertType) return null;
    return getDismissalKey(alertType, agreement.activityLog ?? undefined);
  }, [alertType, agreement.activityLog]);
  const [dismissedAlertKeys, setDismissedAlertKeys] = useLocalStorage<string[]>(
    `dismissedAgreementAlerts_${agreement.id}`,
    [],
  );

  const onClose = useCallback(() => {
    if (!alertType || !dismissalKey) return;

    logEvent(LicenseManagerClickEvent.CreatorAgreementDetailsPageDismissAlertClickEvent, {
      agreementId: agreement.id!,
      alertType: alertType as AlertType,
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
    if (!dismissalKey) return false;
    if (!dismissedAlertKeys || !Array.isArray(dismissedAlertKeys)) return false;
    return dismissedAlertKeys.includes(dismissalKey);
  }, [dismissedAlertKeys, dismissalKey]);

  const openActivityTab = useCallback(() => {
    handleTabChange?.(null, AgreementDetailsTabs.Activity);
  }, [handleTabChange]);

  if (!isFetched || !alertType || !agreement.updatedAt || isDismissed) {
    return null;
  }

  let headerDate: Date | undefined;
  let bodyDate: Date | undefined;
  switch (alertType) {
    case AlertType.ChangeRequestReceived:
      bodyDate = getLatestChangeRequestExpireDate(agreement.activityLog!);
      break;
    case AlertType.ChangeRequestExpired:
      bodyDate = agreement.activityLog![0].createdAt!;
      break;
    case AlertType.TimelimitedPendingTermination:
      headerDate = agreement.endTime!;
      break;
    case AlertType.IpRemovalAttestationInitiated:
    case AlertType.IpRemovalAttestationCompleted:
    case AlertType.IpRemovalAttestationExpired:
      headerDate = agreement.endTime!;
      bodyDate = agreement.ipRemovalAttestation!.expiresAtTime!;
      break;
    default:
      headerDate = agreement.updatedAt;
      bodyDate = agreement.updatedAt;
      break;
  }

  const content = statusToContent[alertType];
  const headerText = translate(content.headerText, {
    date:
      headerDate?.toLocaleDateString(locale ?? Locale.English, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }) ?? '',
    listingName,
  });
  let bodyText = translate(content.bodyText, {
    date:
      bodyDate?.toLocaleDateString(locale ?? Locale.English, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }) ?? '',
    listingName,
  });

  if (content.bodyTextHasReason) {
    if (enableIpPlatformTimeboundLicenses && alertType === AlertType.Cancelled) {
      bodyText = translate(content.bodyText, {
        reason: agreement.activityLog![0].notes!,
        // TODO - aquach - uncomment this once backend returns CancellationReason enum
        // reason: translate(getCancelReasonLabelKey(agreement.activityLog!)),
      });
    } else {
      // Otherwise, alertTypes with bodyTextHasReason are Disputed, DisputeAccepted, and DisputeMaxed
      bodyText = translate(content.bodyText, {
        reason: translate(getLatestDisputeReasonLabelKey(agreement)),
      });
    }
  }

  let action: React.ReactNode;
  switch (alertType) {
    case AlertType.ChangeRequestReceived:
      action = (
        <div className={buttonContainer}>
          <Button variant='text' color='inherit' size='small' onClick={openActivityTab}>
            {translate('Action.ViewRequest')}
          </Button>
          <Button
            variant='outlined'
            color='inherit'
            size='small'
            onClick={handleCompleteChangeRequest}>
            {translate('Action.ChangeImplemented')}
          </Button>
        </div>
      );
      break;
    case AlertType.ChangeRequestExpired:
      action = (
        <div className={buttonContainer}>
          <Button variant='text' color='inherit' size='small' onClick={openActivityTab}>
            {translate('Action.ViewRequest')}
          </Button>
          <Button variant='outlined' color='inherit' size='small' onClick={onClose}>
            {translate('Action.Dismiss')}
          </Button>
        </div>
      );
      break;
    case AlertType.RequestRejectedWithFeedback:
      action = (
        <Button variant='outlined' color='inherit' size='small' onClick={openActivityTab}>
          {translate('Action.SeeFullReason')}
        </Button>
      );
      break;
    case AlertType.IpRemovalAttestationInitiated:
      action = (
        <Button variant='outlined' color='inherit' size='small' onClick={handleCompleteIpRemoval}>
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
      onClose={onClose}
      action={action}>
      <AlertTitle paddingBottom={1}>{headerText}</AlertTitle>
      {bodyText}
    </Alert>
  );
};

export default memo(CreatorAgreementAlert);
