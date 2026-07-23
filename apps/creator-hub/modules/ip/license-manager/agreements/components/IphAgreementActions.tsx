import React, { Fragment, useState } from 'react';
import { Button, CircularProgress, Tooltip } from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/common/components';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import {
  AgreementStatus,
  AgreementTransition,
  HydratedAgreementWithHydratedTargetsResponse,
  LicenseDurationType,
} from '@rbx/clients/contentLicensingApi/v1';
import { useSettings } from '@modules/settings';

import {
  useAcceptAgreementDisputeMutation,
  useApproveLicenseApplicationMutation,
  useRejectLicenseApplicationMutation,
  useRejectAgreementDisputeMutation,
  useArchiveUnsuccessfulOfferMutation,
} from '../hooks/agreements';
import useIpSnackbar from '../../../hooks/useIpSnackbar';
import useConfirmation from '../hooks/useConfirmation';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../../utils/logger';
import IphAcceptRequestContent from './IphAcceptRequestContent';
import IphRejectRequestModal from './IphRejectRequestModal';
import { getAgreementActivityByTransition } from '../utils/agreementActivity';
import IphChangeRequestDialog from './IphChangeRequestDialog';
import { getDateRangeLabel } from '../../utils/timeLimitedLicense';

interface IphAgreementActionsProps {
  agreement: HydratedAgreementWithHydratedTargetsResponse;
}

/**
 * Actions an IPH can take on an agreement
 * e.g. Accept or Reject an Inquired agreement (creator applies for a license)
 */
const IphAgreementActions: React.FC<IphAgreementActionsProps> = ({ agreement }) => {
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;

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

  const isTimelimitedLicense =
    enableIpPlatformTimeboundLicenses &&
    agreement.license?.licenseDuration?.durationType === LicenseDurationType.TimeLimited;
  const creatorNote =
    getAgreementActivityByTransition(agreement.activityLog, AgreementTransition.Apply)?.notes ??
    undefined;
  const dateRangeString = isTimelimitedLicense
    ? getDateRangeLabel(agreement.startTime, agreement.endTime, locale ?? Locale.English)
    : undefined;

  const handleAccept = async () => {
    logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageOpenRequestModalClickEvent, {
      agreementId: agreement.id!,
      action: 'accept',
    });

    const isRevShareTimingDifferent =
      agreement.enableMonetization !== agreement.license!.enableMonetization;

    const [result, closeConfirmation] = await confirmWithLoading({
      title: translate('Heading.ConfirmAcceptAgreement'),
      description: translate('Message.ConfirmAcceptAgreement'),
      primaryActionLabel: translate('Action.Accept'),
      extraContent: (
        <IphAcceptRequestContent
          showDisclaimer={isRevShareTimingDifferent}
          rate={agreement.license?.royaltyRate}
          creatorNote={creatorNote}
          dateRangeString={dateRangeString}
        />
      ),
    });

    if (!result.confirmed) {
      logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageCloseRequestModalClickEvent, {
        agreementId: agreement.id!,
        action: 'accept',
      });
      return;
    }

    try {
      await approveMutation.mutateAsync(agreement.id!);
      enqueueSuccessSnackbar('Message.AgreementNowApproved');
    } catch {
      enqueueErrorSnackbar();
    } finally {
      closeConfirmation();
    }
  };

  const handleReject = async () => {
    logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageOpenRequestModalClickEvent, {
      agreementId: agreement.id!,
      action: 'reject',
    });

    setIsRejectModalOpen(true);
  };

  const handleRejectModalClose = () => {
    logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageCloseRequestModalClickEvent, {
      agreementId: agreement.id!,
      action: 'reject',
    });
    setIsRejectModalOpen(false);
  };

  const handleRejectConfirm = async (feedback: string) => {
    try {
      const submittedFeedback = feedback.trim() !== '' ? feedback : undefined;
      await rejectMutation.mutateAsync({ agreementId: agreement.id!, feedback: submittedFeedback });
      enqueueSuccessSnackbar('Message.AgreementNowArchived');
      setIsRejectModalOpen(false);
    } catch {
      enqueueErrorSnackbar();
    }
  };

  const handleAcceptDispute = async () => {
    logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageOpenDisputeModalClickEvent, {
      agreementId: agreement.id!,
      action: 'accept',
    });

    const [shouldContinue, closeConfirmation] = await confirmWithLoading({
      title: translate('Heading.ConfirmAcceptDispute'),
      description: translate('Message.ConfirmAcceptDispute'),
      primaryActionLabel: translate('Action.Accept'),
    });

    if (!shouldContinue) {
      logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageCloseDisputeModalClickEvent, {
        agreementId: agreement.id!,
        action: 'accept',
      });
      return;
    }

    try {
      await acceptDisputeMutation.mutateAsync(agreement.id!);
      enqueueSuccessSnackbar('Message.AgreementNowArchived');
    } catch {
      enqueueErrorSnackbar();
    } finally {
      closeConfirmation();
    }
  };

  const handleRejectDispute = async () => {
    logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageOpenDisputeModalClickEvent, {
      agreementId: agreement.id!,
      action: 'reject',
    });

    const [shouldContinue, closeConfirmation] = await confirmWithLoading({
      title: translate('Heading.ConfirmRejectDispute'),
      description: translate('Message.ConfirmRejectDispute'),
      primaryActionLabel: translate('Action.Reject'),
      isDangerous: true,
    });

    if (!shouldContinue) {
      logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageCloseDisputeModalClickEvent, {
        agreementId: agreement.id!,
        action: 'reject',
      });
      return;
    }

    try {
      await rejectDisputeMutation.mutateAsync(agreement.id!);
      enqueueSuccessSnackbar('Message.AgreementResent');
    } catch {
      enqueueErrorSnackbar();
    } finally {
      closeConfirmation();
    }
  };

  const handleArchive = async () => {
    logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageArchiveAgreementClickEvent, {
      agreementId: agreement.id!,
    });

    try {
      await archiveMutation.mutateAsync(agreement.id!);
      enqueueSuccessSnackbar('Message.AgreementNowArchived');
    } catch {
      enqueueErrorSnackbar();
    }
  };

  const handleOpenChangeRequestDialog = async () => {
    logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageOpenChangeRequestModalClickEvent, {
      agreementId: agreement.id!,
    });
    setIsChangeRequestDialogOpen(true);
  };

  const handleCloseChangeRequestDialog = async () => {
    logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageCloseChangeRequestModalClickEvent, {
      agreementId: agreement.id!,
    });
    setIsChangeRequestDialogOpen(false);
  };

  const isMutating =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    acceptDisputeMutation.isPending ||
    rejectDisputeMutation.isPending ||
    archiveMutation.isPending;

  if (!isFetched) {
    return <CircularProgress />;
  }

  let buttons: React.ReactNode = null;
  if (agreement.status === AgreementStatus.Inquired) {
    buttons = (
      <Fragment>
        <Button variant='contained' color='secondary' onClick={handleAccept} disabled={isMutating}>
          {translate('Action.Accept')}
        </Button>
        <Button
          variant='contained'
          color='secondary'
          onClick={handleReject}
          disabled={isMutating}
          loading={isMutating}>
          {translate('Action.Reject')}
        </Button>
      </Fragment>
    );
  } else if (agreement.status === AgreementStatus.Disputed) {
    buttons = (
      <Fragment>
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
      </Fragment>
    );
  } else if (agreement.status === AgreementStatus.Unsuccessful) {
    buttons = (
      <Button variant='contained' color='secondary' onClick={handleArchive} disabled={isMutating}>
        {translate('Action.Archive')}
      </Button>
    );
  } else if (agreement.status === AgreementStatus.Active) {
    const hasActiveChangeRequest = agreement.activityLog
      ? agreement.activityLog[0].transition === AgreementTransition.InitiateChangeRequest
      : false;

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
    <React.Fragment>
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
        agreementId={agreement.id!}
        onClose={handleCloseChangeRequestDialog}
        onConfirm={handleCloseChangeRequestDialog}
        isOpen={isChangeRequestDialogOpen}
      />
    </React.Fragment>
  );
};

export default IphAgreementActions;
