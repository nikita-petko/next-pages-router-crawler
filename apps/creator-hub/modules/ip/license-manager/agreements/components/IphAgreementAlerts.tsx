import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HydratedAgreementWithHydratedTargetsResponse } from '@rbx/client-content-licensing-api/v1';
import {
  AgreementStatus,
  AgreementTransition,
  IpRemovalAttestationStatus,
  LicenseDurationType,
} from '@rbx/client-content-licensing-api/v1';
import type { RobloxApiDevelopModelsUniverseModel as Universe } from '@rbx/client-develop/v1';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import { Alert, AlertTitle, Button, makeStyles, OpenInNewIcon, Typography } from '@rbx/ui';
import { Link } from '@modules/miscellaneous/components';
import { useDebouncedFunction } from '@modules/miscellaneous/hooks/useDebouncedFunction';
import { isNonEmptyString } from '@modules/miscellaneous/utils';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import ReportIpMessageMenu from '../../../components/ReportIpMessageMenu';
import { EXTERNAL_EXPERIENCE_HREF } from '../../urls';
import { getLatestDisputeReasonLabelKey } from '../../utils/disputeReason';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../../utils/logger';
import AgreementDetailsTabs from '../enums/AgreementDetailsTabs';
import normalizeTerminatesAt from '../utils/agreement';
import {
  getLatestChangeRequestExpireDate,
  getLatestConditionalChangeRequestExpireDate,
  getConditionalChangeRequestWindowExpireDate,
  getAgreementActivityByTransition,
  isEarlyIpUsageDetected,
  getCancelReasonLabelKey,
  isConditionalOfferDisputeAgreement,
} from '../utils/agreementActivity';
import formatDate from '../utils/formatDate';

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
  link: {
    paddingLeft: '10px',
  },
  openIcon: {
    padding: '2px',
    marginBottom: '-5px',
  },
}));

type severity = 'success' | 'error' | 'info' | 'warning';

export enum AlertType {
  Inquired = 'Inquired',
  Disputed = 'Disputed',
  Terminated = 'Terminated',
  TerminatesOn = 'TerminatesOn',
  Unsuccessful = 'Unsuccessful',
  ChangeRequestInitiated = 'ChangeRequestInitiated',
  ChangeRequestCompleted = 'ChangeRequestCompleted',
  ChangeRequestExpired = 'ChangeRequestExpired',
  ConditionalChangeRequestInitiated = 'ConditionalChangeRequestInitiated',
  ConditionalChangeRequestCompleted = 'ConditionalChangeRequestCompleted',
  ConditionalChangeRequestExpired = 'ConditionalChangeRequestExpired',
  ConditionalChangeRequestRejected = 'ConditionalChangeRequestRejected',
  ConditionalChangeRequestDisputed = 'ConditionalChangeRequestDisputed',
  Cancelled = 'Cancelled',
  IpRemovalAttestationInitiated = 'IpRemovalAttestationInitiated',
  IpRemovalAttestationCompleted = 'IpRemovalAttestationCompleted',
  IpRemovalAttestationExpired = 'IpRemovalAttestationExpired',
  EarlyIpUsageInquiredPerpetual = 'EarlyIpUsageInquiredPerpetual',
  EarlyIpUsageInquiredTimeLimited = 'EarlyIpUsageInquiredTimeLimited',
  EarlyIpUsageAcceptedTimeLimited = 'EarlyIpUsageAcceptedTimeLimited',
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
  ConditionalChangeRequestInitiated: {
    severity: 'info',
    headerText: 'Heading.IphConditionalChangeRequestInitiatedAlert',
    bodyText: 'Description.IphConditionalChangeRequestInitiatedAlert',
  },
  ConditionalChangeRequestCompleted: {
    severity: 'warning',
    headerText: 'Heading.IphConditionalChangeRequestImplementedAlert',
    bodyText: 'Message.IphConditionalChangeRequestImplementedAlert',
  },
  ConditionalChangeRequestExpired: {
    severity: 'error',
    headerText: '',
    bodyText: 'Description.IphConditionalChangeRequestExpiredAlert',
  },
  ConditionalChangeRequestRejected: {
    severity: 'error',
    headerText: '',
    bodyText: 'Description.IphConditionalChangeRequestRejectedAlert',
  },
  ConditionalChangeRequestDisputed: {
    severity: 'error',
    headerText: '',
    bodyText: 'Description.ConditionalChangeRequestDisputedAlert',
  },
  Cancelled: {
    severity: 'error',
    headerText: 'Heading.CancelledAlertWithDate',
    bodyText: 'Description.IphCancelledAlertWithReason',
  },
  IpRemovalAttestationInitiated: {
    severity: 'warning',
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
  EarlyIpUsageInquiredPerpetual: {
    severity: 'error',
    headerText: 'Heading.DeepScanNotice',
    bodyText: 'Message.ConfirmAcceptDisclaimer',
  },
  EarlyIpUsageInquiredTimeLimited: {
    severity: 'error',
    headerText: 'Heading.DeepScanNotice',
    bodyText: 'Message.ConfirmAcceptAndActivateAgreementDisclaimer',
  },
  EarlyIpUsageAcceptedTimeLimited: {
    severity: 'error',
    headerText: 'Heading.DeepScanNotice',
    bodyText: 'Message.ConfirmActivateAgreementDisclaimer',
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

  const { status, activityLog, ipRemovalAttestation } = agreement;

  if (activityLog) {
    const { transition } = activityLog[0];
    if (status === AgreementStatus.Active) {
      // Change requests are only valid for active agreements
      // oxlint-disable-next-line typescript/switch-exhaustiveness-check -- non-change-request transitions fall through
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
    if (enableIpPlatformConditionalOffers && status === AgreementStatus.ConditionalOffer) {
      // oxlint-disable-next-line typescript/switch-exhaustiveness-check -- non-conditional transitions fall through
      switch (transition) {
        case AgreementTransition.IphInitiateConditionalChangeRequest:
          return AlertType.ConditionalChangeRequestInitiated;
        case AgreementTransition.CreatorCompleteConditionalChangeRequest:
          return AlertType.ConditionalChangeRequestCompleted;
        case AgreementTransition.ExpireConditionalChangeRequest:
          return AlertType.ConditionalChangeRequestExpired;
        default:
          break;
      }
    }
    if (
      enableIpPlatformConditionalOffers &&
      status === AgreementStatus.Unsuccessful &&
      transition === AgreementTransition.IphRejectConditionalChangeRequest
    ) {
      return AlertType.ConditionalChangeRequestRejected;
    }
    if (
      (status === AgreementStatus.Inquired || status === AgreementStatus.Accepted) &&
      isEarlyIpUsageDetected(activityLog)
    ) {
      // Only pre-Active agreements should show an early IP usage alert
      if (isTimelimitedLicense) {
        return status === AgreementStatus.Inquired
          ? AlertType.EarlyIpUsageInquiredTimeLimited
          : AlertType.EarlyIpUsageAcceptedTimeLimited;
      }
      return AlertType.EarlyIpUsageInquiredPerpetual;
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
    case AgreementStatus.Active: {
      if (normalizeTerminatesAt(agreement.terminatesAt)) {
        return AlertType.TerminatesOn;
      }
      return null;
    }
    case AgreementStatus.Disputed:
      if (enableIpPlatformConditionalOffers && isConditionalOfferDisputeAgreement(agreement)) {
        return AlertType.ConditionalChangeRequestDisputed;
      }
      return AlertType.Disputed;
    case AgreementStatus.Unsuccessful:
      return AlertType.Unsuccessful;
    case AgreementStatus.Inquired:
      return AlertType.Inquired;
    case AgreementStatus.Terminated:
      return AlertType.Terminated;
    case AgreementStatus.Cancelled:
      return AlertType.Cancelled;
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
  const isMultiInstanceAlert =
    alertType === AlertType.ChangeRequestExpired ||
    alertType === AlertType.ConditionalChangeRequestExpired ||
    alertType === AlertType.ConditionalChangeRequestCompleted ||
    alertType === AlertType.ConditionalChangeRequestRejected;

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
  handleApproveConditionalChangeRequest?: () => void;
  handleRejectConditionalChangeRequest?: () => void;
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
  handleApproveConditionalChangeRequest,
  handleRejectConditionalChangeRequest,
}) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const { classes } = useStyles();
  const { logEvent } = useLicenseManagerLogger();
  const { isFetched, settings } = useSettings();
  const { enableIpPlatformConditionalOffers } = settings;
  const isTimelimitedLicense =
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
      getAgreementActivityByTransition(agreement.activityLog, AgreementTransition.Apply)?.notes ??
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

    logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageDismissAlertClickEvent, {
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

  const alertClasses = useMemo(() => ({ action: classes.alertAction }), [classes.alertAction]);

  if (
    !isFetched ||
    !alertType ||
    isDismissed ||
    (alertType === AlertType.Inquired && creatorNote === '')
  ) {
    return null;
  }

  const content = statusToContent[alertType];
  const alertLocale = locale ?? Locale.English;
  let headerDate: string | Date | null | undefined;
  let bodyDate: string | Date | null | undefined;
  // oxlint-disable-next-line typescript/switch-exhaustiveness-check -- alert types without dates omit date interpolation
  switch (alertType) {
    case AlertType.Unsuccessful:
    case AlertType.ConditionalChangeRequestRejected:
    case AlertType.Terminated:
    case AlertType.Cancelled:
      headerDate = agreement.updatedAt;
      bodyDate = agreement.updatedAt;
      break;
    case AlertType.TerminatesOn:
      headerDate = agreement.terminatesAt;
      bodyDate = agreement.terminatesAt;
      break;
    case AlertType.Disputed:
      headerDate = agreement.statusExpireAt;
      break;
    case AlertType.ChangeRequestInitiated:
    case AlertType.ChangeRequestCompleted:
      bodyDate = getLatestChangeRequestExpireDate(agreement.activityLog ?? undefined);
      break;
    case AlertType.ConditionalChangeRequestInitiated:
      bodyDate =
        agreement.conditionalChangeRequest?.expiresAtTime ??
        getLatestConditionalChangeRequestExpireDate(agreement.activityLog ?? undefined);
      break;
    case AlertType.ConditionalChangeRequestCompleted:
      bodyDate =
        agreement.conditionalChangeRequest?.expiresAtTime ??
        getLatestConditionalChangeRequestExpireDate(agreement.activityLog ?? undefined);
      break;
    case AlertType.ConditionalChangeRequestExpired:
      bodyDate = getConditionalChangeRequestWindowExpireDate(
        agreement.activityLog ?? undefined,
        agreement.conditionalChangeRequest?.expiresAtTime,
      );
      break;
    case AlertType.IpRemovalAttestationInitiated:
    case AlertType.IpRemovalAttestationCompleted:
    case AlertType.IpRemovalAttestationExpired:
      headerDate = agreement.endTime;
      bodyDate = agreement.ipRemovalAttestation?.expiresAtTime;
      break;
    case AlertType.EarlyIpUsageAcceptedTimeLimited:
    case AlertType.EarlyIpUsageInquiredPerpetual:
    case AlertType.EarlyIpUsageInquiredTimeLimited: {
      const ipUsageDetectedActivity = getAgreementActivityByTransition(
        agreement.activityLog,
        AgreementTransition.ScannerResultFound,
      );
      headerDate = ipUsageDetectedActivity?.createdAt;
      break;
    }
    default:
      break;
  }
  const headerText = content.headerText
    ? translate(content.headerText, {
        date: formatDate(headerDate, alertLocale),
      })
    : undefined;
  let bodyText = translate(content.bodyText, {
    creatorName: universe.creatorName ?? '',
    disputeReason: translate(getLatestDisputeReasonLabelKey(agreement)),
    cancelReason: translate(getCancelReasonLabelKey(agreement.activityLog ?? [])),
    listingName,
    date: formatDate(bodyDate, alertLocale),
    // The following fields are specific to IpRemovalAttestation{...} alerts
    expiryDate: formatDate(bodyDate, alertLocale),
    endDate: formatDate(headerDate, alertLocale),
  });
  if (content.bodyTextHasExternalInput) {
    bodyText = creatorNote;
  }

  let alertTitle = headerText ? <AlertTitle paddingBottom={1}>{headerText}</AlertTitle> : null;
  let action = null;
  // oxlint-disable-next-line typescript/switch-exhaustiveness-check -- alerts without actions use null action
  switch (alertType) {
    case AlertType.Inquired: {
      const activity = getAgreementActivityByTransition(
        agreement.activityLog,
        AgreementTransition.Apply,
      );
      const creatorName = universe.creatorName ?? '';
      action =
        activity && isNonEmptyString(creatorName) ? (
          <div>
            {isTextTruncated ? (
              <Button
                className={classes.actionButtonLabel}
                variant='outlined'
                color='inherit'
                size='small'
                onClick={() => handleTabChange?.(null, AgreementDetailsTabs.Activity)}>
                {translate('Action.SeeFullMsg')}
              </Button>
            ) : null}
            <ReportIpMessageMenu
              isCreator={false}
              agreementActivity={activity}
              creatorName={creatorName}
              listingName={listingName}
            />
          </div>
        ) : null;
      break;
    }
    case AlertType.ChangeRequestInitiated:
      action = (
        <Button
          className={classes.actionButtonLabel}
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
            {universe.rootPlaceId != null ? (
              <Link
                className={classes.link}
                href={EXTERNAL_EXPERIENCE_HREF(universe.rootPlaceId)}
                target='_blank'
                style={{ textDecoration: 'none' }}>
                <Typography color='secondary' variant='body2'>
                  {translate('Action.ViewExperience')}
                </Typography>
                <OpenInNewIcon color='disabled' className={classes.openIcon} />
              </Link>
            ) : null}
          </AlertTitle>
        </div>
      );
      action = (
        <Button
          className={classes.actionButtonLabel}
          variant='outlined'
          color='inherit'
          size='small'
          onClick={handleCompleteChangeRequest}>
          {translate('Action.Confirm')}
        </Button>
      );
      break;
    case AlertType.ConditionalChangeRequestInitiated:
      action = (
        <Button
          className={classes.actionButtonLabel}
          variant='outlined'
          color='inherit'
          size='small'
          onClick={openActivityTab}>
          {translate('Action.ViewRequest')}
        </Button>
      );
      break;
    case AlertType.ConditionalChangeRequestCompleted:
      alertTitle = (
        <div>
          <Typography variant='body2' paddingBottom={1}>
            {headerText}
            {universe.rootPlaceId != null ? (
              <Link
                className={classes.link}
                href={EXTERNAL_EXPERIENCE_HREF(universe.rootPlaceId)}
                target='_blank'
                style={{ textDecoration: 'none' }}>
                <Typography color='secondary' variant='body2'>
                  {translate('Action.ViewExperience')}
                </Typography>
                <OpenInNewIcon color='disabled' className={classes.openIcon} />
              </Link>
            ) : null}
          </Typography>
        </div>
      );
      action = (
        <div className={classes.buttonContainer}>
          <Button
            className={classes.actionButtonLabel}
            variant='outlined'
            color='inherit'
            size='small'
            onClick={handleApproveConditionalChangeRequest}>
            {translate('Action.Accept')}
          </Button>
          <Button
            className={classes.actionButtonLabel}
            variant='outlined'
            color='inherit'
            size='small'
            onClick={handleRejectConditionalChangeRequest}>
            {translate('Action.Reject')}
          </Button>
        </div>
      );
      break;
    case AlertType.ConditionalChangeRequestExpired:
      action = (
        <div className={classes.buttonContainer}>
          <Button
            className={classes.actionButtonLabel}
            variant='text'
            color='inherit'
            size='small'
            onClick={openActivityTab}>
            {translate('Action.ViewRequest')}
          </Button>
          <Button
            className={classes.actionButtonLabel}
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
        <div className={classes.buttonContainer}>
          <Button
            className={classes.actionButtonLabel}
            variant='text'
            color='inherit'
            size='small'
            onClick={openActivityTab}>
            {translate('Action.ViewRequest')}
          </Button>
          <Button
            className={classes.actionButtonLabel}
            variant='outlined'
            color='inherit'
            size='small'
            onClick={onClose}>
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
      classes={alertClasses}
      onClose={alertType === AlertType.ConditionalChangeRequestRejected ? onClose : undefined}
      action={action}>
      {alertTitle}
      {bodyText}
    </Alert>
  );
};

export default IphAgreementAlerts;
