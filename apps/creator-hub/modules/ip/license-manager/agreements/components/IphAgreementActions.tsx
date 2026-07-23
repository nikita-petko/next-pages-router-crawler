import React, { useMemo, useState } from 'react';
import type { HydratedAgreementWithHydratedTargetsResponse } from '@rbx/client-content-licensing-api/v1';
import {
  AgreementStatus,
  AgreementTransition,
  LicenseDurationType,
} from '@rbx/client-content-licensing-api/v1';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { Button, CircularProgress, Tooltip } from '@rbx/ui';
import Flex from '@modules/miscellaneous/components/Flex';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import useIpSnackbar from '../../../hooks/useIpSnackbar';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../../utils/logger';
import { getDateRangeLabel } from '../../utils/timeLimitedLicense';
import {
  useAcceptAgreementDisputeMutation,
  useActivateAcceptedAgreementMutation,
  useApproveLicenseApplicationMutation,
  useRejectLicenseApplicationMutation,
  useRejectAgreementDisputeMutation,
  useArchiveUnsuccessfulOfferMutation,
} from '../hooks/agreements';
import useConfirmation from '../hooks/useConfirmation';
import {
  getAgreementActivityByTransition,
  isEarlyIpUsageDetected,
  isConditionalOfferDisputeAgreement,
} from '../utils/agreementActivity';
import IphAcceptRequestContent from './IphAcceptRequestContent';
import IphChangeRequestDialog from './IphChangeRequestDialog';
import IphRejectRequestModal from './IphRejectRequestModal';

interface IphAgreementActionsProps {
  agreement: HydratedAgreementWithHydratedTargetsResponse;
}

/**
 * Actions an IPH can take on an agreement
 * e.g. Accept or Reject an Inquired agreement (creator applies for a license)
 */
const IphAgreementActions: React.FC<IphAgreementActionsProps> = ({ agreement }) => {
  const { isFetched, settings } = useSettings();
  const { enableIpPlatformConditionalOffers } = settings;

  const { locale } = useLocalization();
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();
  const { enqueueErrorSnackbar, enqueueSuccessSnackbar } = useIpSnackbar();
  const { confirmWithLoading, confirmationContent } = useConfirmation();
  const [isChangeRequestDialogOpen, setIsChangeRequestDialogOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const approveMutation = useApproveLicenseApplicationMutation();
  const rejectMutation = useRejectLicenseApplicationMutation();
  const acceptDisputeMutation = useAcceptAgreementDisputeMutation();
  const rejectDisputeMutation = useRejectAgreementDisputeMutation();
  const archiveMutation = useArchiveUnsuccessfulOfferMutation();
  const activateAcceptedAgreementMutation = useActivateAcceptedAgreementMutation();

  const isDeepScanFound = isEarlyIpUsageDetected(agreement.activityLog);
  const isTimelimitedLicense =
    agreement.license?.licenseDuration?.durationType === LicenseDurationType.TimeLimited;
  const useAcceptAndActivateVerbiage = isTimelimitedLicense && isDeepScanFound;

  const creatorNote =
    getAgreementActivityByTransition(agreement.activityLog, AgreementTransition.Apply)?.notes ??
    undefined;
  const hasActiveChangeRequest = useMemo(
    () => agreement.activityLog?.[0]?.transition === AgreementTransition.InitiateChangeRequest,
    [agreement.activityLog],
  );
  const isConditionalOfferDispute = useMemo(
    () => isConditionalOfferDisputeAgreement(agreement),
    [agreement],
  );
  const dateRangeString = isTimelimitedLicense
    ? getDateRangeLabel(agreement.startTime, agreement.endTime, locale ?? Locale.English)
    : undefined;

  const agreementId = agreement.id;

  if (!isFetched) {
    return <CircularProgress />;
  }

  if (!agreementId) {
    return null;
  }

  const handleAccept = async () => {
    logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageOpenRequestModalClickEvent, {
      agreementId,
      action: 'accept',
    });

    const isRevShareTimingDifferent =
      agreement.enableMonetization !== agreement.license?.enableMonetization;

    const [result, closeConfirmation] = await confirmWithLoading({
      title: translate(
        useAcceptAndActivateVerbiage
          ? 'Heading.ConfirmAcceptAndActivateAgreement'
          : 'Heading.ConfirmAcceptAgreement',
      ),
      description: translate(
        useAcceptAndActivateVerbiage
          ? 'Message.ConfirmAcceptAndActivateAgreement'
          : 'Message.ConfirmAcceptAgreement',
      ),
      primaryActionLabel: translate(
        useAcceptAndActivateVerbiage
          ? 'Action.ConfirmAcceptAndActivateAgreement'
          : 'Action.ConfirmAccept',
      ),
      extraContent: (
        <IphAcceptRequestContent
          showRevShareDisclaimer={isRevShareTimingDifferent}
          rate={agreement.license?.royaltyRate}
          creatorNote={creatorNote}
          dateRangeString={dateRangeString}
        />
      ),
    });

    if (!result.confirmed) {
      logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageCloseRequestModalClickEvent, {
        agreementId,
        action: 'accept',
      });
      return;
    }

    const licenseDurationType =
      agreement.license?.licenseDuration?.durationType ?? LicenseDurationType.Perpetual;

    logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageRightsHolderOutcomeCommitClickEvent, {
      agreementId,
      action: useAcceptAndActivateVerbiage ? 'accept_and_activate' : 'accept',
      agreementStatus: AgreementStatus.Inquired,
      isDeepScanFound,
      licenseDurationType,
    });

    try {
      await approveMutation.mutateAsync(agreementId);
      enqueueSuccessSnackbar('Message.AgreementNowApproved');
    } catch {
      enqueueErrorSnackbar();
    } finally {
      closeConfirmation();
    }
  };

  const handleReject = async () => {
    logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageOpenRequestModalClickEvent, {
      agreementId,
      action: 'reject',
    });

    setIsRejectModalOpen(true);
  };

  const handleRejectModalClose = () => {
    logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageCloseRequestModalClickEvent, {
      agreementId,
      action: 'reject',
    });
    setIsRejectModalOpen(false);
  };

  const handleRejectConfirm = async (feedback: string) => {
    try {
      const submittedFeedback = feedback.trim() !== '' ? feedback : undefined;
      await rejectMutation.mutateAsync({ agreementId, feedback: submittedFeedback });
      enqueueSuccessSnackbar('Message.AgreementNowArchived');
      setIsRejectModalOpen(false);
    } catch {
      enqueueErrorSnackbar();
    }
  };

  const handleAcceptDispute = async () => {
    logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageOpenDisputeModalClickEvent, {
      agreementId,
      action: 'accept',
    });

    const [result, closeConfirmation] = await confirmWithLoading({
      title: translate('Heading.ConfirmAcceptDispute'),
      description: translate('Message.ConfirmAcceptDispute'),
      primaryActionLabel: translate('Action.Accept'),
    });

    if (!result.confirmed) {
      logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageCloseDisputeModalClickEvent, {
        agreementId,
        action: 'accept',
      });
      return;
    }

    try {
      await acceptDisputeMutation.mutateAsync(agreementId);
      enqueueSuccessSnackbar('Message.AgreementNowArchived');
    } catch {
      enqueueErrorSnackbar();
    } finally {
      closeConfirmation();
    }
  };

  const handleRejectDispute = async () => {
    logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageOpenDisputeModalClickEvent, {
      agreementId,
      action: 'reject',
    });

    const isConditionalOfferDisputeAlert =
      enableIpPlatformConditionalOffers && isConditionalOfferDispute;

    const [result, closeConfirmation] = await confirmWithLoading({
      title: translate('Heading.ConfirmRejectDispute'),
      description: translate(
        isConditionalOfferDisputeAlert
          ? 'Message.ConfirmRejectConditionalOfferDispute'
          : 'Message.ConfirmRejectDispute',
      ),
      primaryActionLabel: translate('Action.Reject'),
      isDangerous: true,
    });

    if (!result.confirmed) {
      logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageCloseDisputeModalClickEvent, {
        agreementId,
        action: 'reject',
      });
      return;
    }

    try {
      await rejectDisputeMutation.mutateAsync(agreementId);
      enqueueSuccessSnackbar(
        isConditionalOfferDisputeAlert
          ? 'Description.ConditionalChangeRequestResentSnackBar'
          : 'Message.AgreementResent',
      );
    } catch {
      enqueueErrorSnackbar();
    } finally {
      closeConfirmation();
    }
  };

  const handleArchive = async () => {
    logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageArchiveAgreementClickEvent, {
      agreementId,
    });

    try {
      await archiveMutation.mutateAsync(agreementId);
      enqueueSuccessSnackbar('Message.AgreementNowArchived');
    } catch {
      enqueueErrorSnackbar();
    }
  };

  const handleActivateAcceptedAgreement = async () => {
    const licenseDurationType =
      agreement.license?.licenseDuration?.durationType ?? LicenseDurationType.Perpetual;

    logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageRightsHolderOutcomeCommitClickEvent, {
      agreementId,
      action: 'activate',
      agreementStatus: AgreementStatus.Accepted,
      isDeepScanFound,
      licenseDurationType,
    });

    try {
      await activateAcceptedAgreementMutation.mutateAsync(agreementId);
      enqueueSuccessSnackbar('Message.AgreementNowActive');
    } catch {
      enqueueErrorSnackbar();
    }
  };

  const handleOpenChangeRequestDialog = async () => {
    logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageOpenChangeRequestModalClickEvent, {
      agreementId,
    });
    setIsChangeRequestDialogOpen(true);
  };

  const handleCloseChangeRequestDialog = async () => {
    logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageCloseChangeRequestModalClickEvent, {
      agreementId,
    });
    setIsChangeRequestDialogOpen(false);
  };

  const isMutating =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    acceptDisputeMutation.isPending ||
    rejectDisputeMutation.isPending ||
    archiveMutation.isPending ||
    activateAcceptedAgreementMutation.isPending;

  let buttons: React.ReactNode = null;
  if (agreement.status === AgreementStatus.Inquired) {
    buttons = (
      <>
        <Button variant='contained' color='secondary' onClick={handleAccept} disabled={isMutating}>
          {translate(
            useAcceptAndActivateVerbiage ? 'Action.AcceptAndActivateAgreement' : 'Action.Accept',
          )}
        </Button>
        <Button
          variant='contained'
          color='secondary'
          onClick={handleReject}
          disabled={isMutating}
          loading={isMutating}>
          {translate('Action.Reject')}
        </Button>
      </>
    );
  } else if (agreement.status === AgreementStatus.Disputed) {
    buttons = (
      <>
        <Button
          variant='contained'
          color='secondary'
          onClick={handleAcceptDispute}
          disabled={isMutating}>
          {translate('Action.AcceptDispute')}
        </Button>
        <Button
          variant='contained'
          color='secondary'
          onClick={handleRejectDispute}
          disabled={isMutating}>
          {translate('Action.RejectDispute')}
        </Button>
      </>
    );
  } else if (agreement.status === AgreementStatus.Unsuccessful) {
    buttons = (
      <Button variant='contained' color='secondary' onClick={handleArchive} disabled={isMutating}>
        {translate('Action.Archive')}
      </Button>
    );
  } else if (agreement.status === AgreementStatus.Accepted && isDeepScanFound) {
    buttons = (
      <Button
        variant='contained'
        color='secondary'
        onClick={handleActivateAcceptedAgreement}
        disabled={isMutating}
        loading={activateAcceptedAgreementMutation.isPending}>
        {translate('Action.ActivateAgreement')}
      </Button>
    );
  } else if (agreement.status === AgreementStatus.Active) {
    buttons = (
      <Tooltip
        arrow
        placement='bottom'
        title={translate('Label.TooltipChangeRequestInProgress')}
        disableHoverListener={!hasActiveChangeRequest}
        disableFocusListener={!hasActiveChangeRequest}
        disableTouchListener={!hasActiveChangeRequest}>
        <span>
          <Button
            variant='contained'
            color='secondary'
            onClick={handleOpenChangeRequestDialog}
            disabled={isMutating || hasActiveChangeRequest}>
            {translate('Action.IphOpenChangeRequestDialog')}
          </Button>
        </span>
      </Tooltip>
    );
  }

  if (!buttons) {
    return null;
  }

  return (
    <>
      <Flex gap={8} alignItems='flex-start'>
        {buttons}
      </Flex>

      {confirmationContent}

      <IphRejectRequestModal
        isOpen={isRejectModalOpen}
        onClose={handleRejectModalClose}
        onConfirm={handleRejectConfirm}
        isLoading={rejectMutation.isPending}
        creatorNote={creatorNote}
        dateRangeString={dateRangeString}
      />

      <IphChangeRequestDialog
        agreementId={agreementId}
        onClose={handleCloseChangeRequestDialog}
        onConfirm={handleCloseChangeRequestDialog}
        isOpen={isChangeRequestDialogOpen}
      />
    </>
  );
};

export default IphAgreementActions;
