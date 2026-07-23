import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AlertTitle, Button, makeStyles, OpenInNewIcon, Typography } from '@rbx/ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { RobloxApiDevelopModelsUniverseModel as Universe } from '@rbx/clients/develop/v1';
import { formatDate } from '@modules/miscellaneous/common/utils';
import { useDebouncedFunction } from '@modules/miscellaneous/hooks/useDebouncedFunction';
import { Link } from '@modules/miscellaneous/common';
import { useLocalStorage } from '@rbx/react-utilities';
import {
  AgreementStatus,
  AgreementTransition,
  HydratedAgreementWithHydratedTargetsResponse,
  IpRemovalAttestationStatus,
  LicenseDurationType,
} from '@rbx/clients/contentLicensingApi/v1';
import { useSettings } from '@modules/settings';

import normalizeTerminatesAt from '../utils/agreement';
import {
  getLatestChangeRequestExpireDate,
  getAgreementActivityByTransition,
} from '../utils/agreementActivity';
import { getLatestDisputeReasonLabelKey } from '../../utils/disputeReason';
import { AgreementDetailsTabs } from '../IphAgreementDetailsContainer';
import ReportIpMessageMenu from '../../../components/ReportIpMessageMenu';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../../utils/logger';
import { EXTERNAL_EXPERIENCE_HREF } from '../../urls';

const useStyles = makeStyles()(() => ({
  responsiveTruncatedText: {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fullWidth: {
    width: '100%',
  },
  buttonContainer: {
    display: 'flex',
    gap: '8px',
    alignSelf: 'center',
    marginTop: '-4px',
  },
  link: {
    paddingLeft: '10px',
  },
  openIcon: {
    padding: '2px',
    marginBottom: '-5px',
  },
}));

type severity = 'success' | 'error' | 'info';

export enum AlertType {
  Inquired = 'Inquired',
  Disputed = 'Disputed',
  Terminated = 'Terminated',
  TerminatesOn = 'TerminatesOn',
  Unsuccessful = 'Unsuccessful',
  ChangeRequestInitiated = 'ChangeRequestInitiated',
  ChangeRequestCompleted = 'ChangeRequestCompleted',
  ChangeRequestExpired = 'ChangeRequestExpired',
  Cancelled = 'Cancelled',
  IpRemovalAttestationInitiated = 'IpRemovalAttestationInitiated',
  IpRemovalAttestationCompleted = 'IpRemovalAttestationCompleted',
  IpRemovalAttestationExpired = 'IpRemovalAttestationExpired',
}

interface Content {
  severity: severity;
  headerText: string;
  bodyText: string;
  bodyTextHasExternalInput?: boolean;
}

const statusToContent: { [key in AlertType]: Content } = {
  Inquired: {
    severity: 'info',
    headerText: 'Label.NoteFromTheCreator',
    bodyText: '', // later replaced with creatorNote
    bodyTextHasExternalInput: true,
  },
  Disputed: {
    severity: 'error',
    headerText: 'Heading.DisputeAlert',
    bodyText: 'Message.DisputeAlertDescription',
  },
  Terminated: {
    severity: 'error',
    headerText: 'Heading.IphTerminatedWithDate',
    bodyText: 'Description.IphTerminated',
  },
  TerminatesOn: {
    severity: 'error',
    headerText: 'Heading.IphTerminatesOnWithDate',
    bodyText: 'Description.IphTerminatesOnWithDate',
  },
  Unsuccessful: {
    severity: 'error',
    headerText: 'Heading.UnsuccessfulOfferAlert',
    bodyText: 'Message.UnsuccessfulOfferAlertDescription',
  },
  ChangeRequestInitiated: {
    severity: 'info',
    headerText: 'Heading.IphChangeRequestInitiatedAlert',
    bodyText: 'Description.IphChangeRequestInitiatedAlert',
  },
  ChangeRequestCompleted: {
    severity: 'success',
    headerText: 'Heading.IphChangeRequestImplementedAlert',
    bodyText: 'Message.IphChangeRequestImplementedAlert',
  },
  ChangeRequestExpired: {
    severity: 'error',
    headerText: 'Heading.IphChangeRequestLateAlert',
    bodyText: 'Message.IphChangeRequestLateAlert',
  },
  Cancelled: {
    severity: 'error',
    headerText: 'Heading.CancelledAlertWithDate',
    bodyText: 'Description.IphCancelledAlertWithReason',
  },
  IpRemovalAttestationInitiated: {
    severity: 'error',
    headerText: 'Heading.GenericAgreementExpiredWithDate',
    bodyText: 'Description.IphIpRemovalAttestationInitiated',
  },
  IpRemovalAttestationCompleted: {
    severity: 'success',
    headerText: 'Heading.GenericAgreementExpiredWithDate',
    bodyText: 'Description.IphIpRemovalAttestationCompleted',
  },
  IpRemovalAttestationExpired: {
    severity: 'error',
    headerText: 'Heading.GenericAgreementExpiredWithDate',
    bodyText: 'Description.IphIpRemovalAttestationExpired',
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

  const { status, activityLog, ipRemovalAttestation } = agreement;

  if (activityLog) {
    const { transition } = activityLog[0];
    if (status === AgreementStatus.Active) {
      // Change requests are only valid for active agreements
      switch (transition) {
        case AgreementTransition.InitiateChangeRequest:
          return AlertType.ChangeRequestInitiated;
        case AgreementTransition.CompleteChangeRequest:
          return AlertType.ChangeRequestCompleted;
        case AgreementTransition.ExpireChangeRequest: {
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
    case AgreementStatus.Active: {
      if (normalizeTerminatesAt(agreement.terminatesAt)) {
        return AlertType.TerminatesOn;
      }
      return null;
    }
    case AgreementStatus.Disputed:
      return AlertType.Disputed;
    case AgreementStatus.Unsuccessful:
      return AlertType.Unsuccessful;
    case AgreementStatus.Inquired:
      return AlertType.Inquired;
    case AgreementStatus.Terminated:
      return AlertType.Terminated;
    case AgreementStatus.Cancelled:
      if (enableIpPlatformTimeboundLicenses) {
        return AlertType.Cancelled;
      }
      return null;
    default:
      // All other AgreementStatuss should not have an alert shown
      return null;
  }
};

/**
 * Generates a unique dismissal key for an alert.
 * For ChangeRequestReceived and ChangeRequestCompleted, includes the activity log ID
 * to allow multiple instances of these alerts to be dismissed independently.
 * For other alert types, uses just the alertType since they only appear once.
 */
const getDismissalKey = (
  alertType: AlertType,
  activityLog?: Array<{ id?: string | null }>,
): string => {
  const isMultiInstanceAlert = alertType === AlertType.ChangeRequestExpired;

  if (isMultiInstanceAlert && activityLog && activityLog.length > 0 && activityLog[0].id) {
    return `${alertType}_${activityLog[0].id}`;
  }

  return alertType;
};

interface IphAgreementAlertsProps {
  agreement: HydratedAgreementWithHydratedTargetsResponse;
  universe: Universe;
  listingName: string;
  handleTabChange?: (event: unknown, newTabValue: string) => void;
  handleCompleteChangeRequest?: () => void;
}

/**
 * Alerts/summaries we show on the IPH agreement details page
 */
const IphAgreementAlerts: React.FC<IphAgreementAlertsProps> = ({
  agreement,
  universe,
  listingName,
  handleTabChange,
  handleCompleteChangeRequest,
}) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const { classes } = useStyles();
  const { logEvent } = useLicenseManagerLogger();
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;
  const isTimelimitedLicense =
    enableIpPlatformTimeboundLicenses &&
    agreement.license?.licenseDuration?.durationType === LicenseDurationType.TimeLimited;

  const textRef = useRef<HTMLDivElement>(null);
  const [isTextTruncated, setIsTextTruncated] = useState(false);

  const checkTruncation = useCallback(() => {
    if (textRef.current) {
      setIsTextTruncated(textRef.current.scrollHeight > textRef.current.clientHeight);
    }
  }, []);

  // Debounce the resize handler to prevent excessive renders during window resize
  const [debouncedCheckTruncation] = useDebouncedFunction(checkTruncation, 100);

  // Only run truncation check for Inquired agreements with a creator note
  const creatorNote = useMemo(
    () =>
      getAgreementActivityByTransition(agreement.activityLog!, AgreementTransition.Apply)?.notes ??
      '',
    [agreement.activityLog],
  );
  useEffect(() => {
    if (agreement.status === AgreementStatus.Inquired && creatorNote !== '') {
      checkTruncation();
      window.addEventListener('resize', debouncedCheckTruncation);
      return () => window.removeEventListener('resize', debouncedCheckTruncation);
    }
    return undefined;
  }, [agreement.status, creatorNote, checkTruncation, debouncedCheckTruncation]);

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

    logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageDismissAlertClickEvent, {
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

  if (
    !isFetched ||
    !alertType ||
    isDismissed ||
    (alertType === AlertType.Inquired && creatorNote === '')
  ) {
    return null;
  }

  const content = statusToContent[alertType];
  let headerTextDate = '';
  let bodyTextDate = '';
  if (
    alertType === AlertType.Unsuccessful ||
    alertType === AlertType.Terminated ||
    alertType === AlertType.Cancelled
  ) {
    headerTextDate = formatDate(agreement.updatedAt!, locale ?? Locale.English);
    bodyTextDate = formatDate(agreement.updatedAt!, locale ?? Locale.English);
  } else if (alertType === AlertType.TerminatesOn) {
    headerTextDate = formatDate(agreement.terminatesAt!, locale ?? Locale.English);
    bodyTextDate = formatDate(agreement.terminatesAt!, locale ?? Locale.English);
  } else if (alertType === AlertType.Disputed) {
    headerTextDate = formatDate(agreement.statusExpireAt!, locale ?? Locale.English);
  } else if (
    alertType === AlertType.ChangeRequestInitiated ||
    alertType === AlertType.ChangeRequestCompleted
  ) {
    const expireDate = getLatestChangeRequestExpireDate(agreement.activityLog!);
    bodyTextDate = expireDate
      ? expireDate.toLocaleDateString(locale ?? Locale.English, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '';
  } else if (
    alertType === AlertType.IpRemovalAttestationInitiated ||
    alertType === AlertType.IpRemovalAttestationCompleted ||
    alertType === AlertType.IpRemovalAttestationExpired
  ) {
    headerTextDate = formatDate(agreement.endTime!, locale ?? Locale.English);
    const expireDate = agreement.ipRemovalAttestation!.expiresAtTime;
    bodyTextDate = expireDate
      ? expireDate.toLocaleDateString(locale ?? Locale.English, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '';
  }
  const headerText = translate(content.headerText, {
    date: headerTextDate,
  });
  let bodyText = translate(content.bodyText, {
    creatorName: universe.creatorName ?? '',
    disputeReason: translate(getLatestDisputeReasonLabelKey(agreement)),
    cancelReason: agreement.activityLog![0].notes!,
    // TODO - aquach - uncomment this once backend returns CancellationReason enum
    // cancelReason: translate(getCancelReasonLabelKey(agreement.activityLog!)),
    listingName,
    date: bodyTextDate,
  });
  if (content.bodyTextHasExternalInput) {
    bodyText = creatorNote;
  }

  let alertTitle = <AlertTitle paddingBottom={1}>{headerText}</AlertTitle>;
  let action = null;
  switch (alertType) {
    case AlertType.Inquired: {
      const activity = getAgreementActivityByTransition(
        agreement.activityLog,
        AgreementTransition.Apply,
      );
      action = (
        <div>
          {isTextTruncated ? (
            <Button
              variant='outlined'
              color='inherit'
              size='small'
              onClick={() => handleTabChange?.(null, AgreementDetailsTabs.Activity)}>
              {translate('Action.SeeFullMsg')}
            </Button>
          ) : null}
          <ReportIpMessageMenu
            isCreator={false}
            agreementActivity={activity!}
            creatorName={universe.creatorName!}
            listingName={listingName}
          />
        </div>
      );
      break;
    }
    case AlertType.ChangeRequestInitiated:
      action = (
        <Button
          className={classes.buttonContainer}
          variant='outlined'
          color='inherit'
          size='small'
          onClick={openActivityTab}>
          {translate('Action.ViewRequest')}
        </Button>
      );
      break;
    case AlertType.ChangeRequestCompleted:
      alertTitle = (
        <div>
          <AlertTitle paddingBottom={1}>
            {headerText}
            <Link
              className={classes.link}
              href={EXTERNAL_EXPERIENCE_HREF(universe.rootPlaceId!)}
              target='_blank'
              style={{ textDecoration: 'none' }}>
              <Typography color='secondary' variant='body2'>
                {translate('Action.ViewExperience')}
              </Typography>
              <OpenInNewIcon color='disabled' className={classes.openIcon} />
            </Link>
          </AlertTitle>
        </div>
      );
      action = (
        <Button
          className={classes.buttonContainer}
          variant='outlined'
          color='inherit'
          size='small'
          onClick={handleCompleteChangeRequest}>
          {translate('Action.Confirm')}
        </Button>
      );
      break;
    case AlertType.ChangeRequestExpired:
      action = (
        <div className={classes.buttonContainer}>
          <Button variant='text' color='inherit' size='small' onClick={openActivityTab}>
            {translate('Action.ViewRequest')}
          </Button>
          <Button variant='outlined' color='inherit' size='small' onClick={onClose}>
            {translate('Action.Dismiss')}
          </Button>
        </div>
      );
      break;
    default:
      break;
  }

  return (
    <Alert
      severity={content.severity}
      variant='outlined'
      className={classes.fullWidth}
      action={action}>
      {alertTitle}
      {bodyText}
    </Alert>
  );
};

export default IphAgreementAlerts;
