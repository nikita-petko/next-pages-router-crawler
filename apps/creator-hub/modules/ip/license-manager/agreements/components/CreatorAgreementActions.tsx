import React, { useState } from 'react';
import { Button, CircularProgress, Tooltip } from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/common/components';
import {
  AgreementStatus,
  CancellationReason,
  HydratedAgreementWithHydratedTargetsResponse,
  LicenseDurationType,
} from '@rbx/clients/contentLicensingApi/v1';
import { useSettings } from '@modules/settings';
import { useTranslation } from '@rbx/intl';

import useIpSnackbar from '../../../hooks/useIpSnackbar';
import { useCreatorCancelAgreementMutation } from '../hooks/agreements';
import { isWithinThreeDaysOfDate } from '../../utils/timeLimitedLicense';
import CreatorCancelAgreementModal from './CreatorCancelAgreementModal';

interface CreatorAgreementActionsProps {
  agreement: HydratedAgreementWithHydratedTargetsResponse;
}

/**
 * Actions a Creator can take on an agreement
 * e.g. Cancel an Accepted agreement with a time-limited license
 */
const CreatorAgreementActions: React.FC<CreatorAgreementActionsProps> = ({ agreement }) => {
  const { translate } = useTranslation();
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;
  const { enqueueErrorSnackbar, enqueueSuccessSnackbar } = useIpSnackbar();

  const cancelAcceptedAgreementMutation = useCreatorCancelAgreementMutation();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const handleCancelOpen = async () => {
    setIsCancelModalOpen(true);
  };

  const handleCancelClose = () => {
    setIsCancelModalOpen(false);
  };

  const handleCancelConfirm = async (reason: CancellationReason) => {
    try {
      await cancelAcceptedAgreementMutation.mutateAsync({
        agreementId: agreement.id!,
        reason,
      });
      enqueueSuccessSnackbar('Message.AgreementNowArchived');
      setIsCancelModalOpen(false);
    } catch {
      enqueueErrorSnackbar();
    }
  };

  const isMutating = cancelAcceptedAgreementMutation.isPending;
  const withinThreeDaysOfActivation = isWithinThreeDaysOfDate(agreement.statusExpireAt);

  if (!isFetched) {
    return <CircularProgress />;
  }

  let buttons: React.ReactNode = null;
  if (enableIpPlatformTimeboundLicenses) {
    if (agreement.status === AgreementStatus.Inquired) {
      buttons = (
        <Button
          variant='contained'
          color='secondary'
          onClick={handleCancelOpen}
          disabled={isMutating}
          loading={isMutating}>
          {translate('Action.CancelRequest')}
        </Button>
      );
    }
    if (agreement.status === AgreementStatus.Accepted) {
      // Only Time-limited licenses can be in Accepted state
      buttons = (
        <Tooltip
          arrow
          placement='bottom'
          title={translate('Tooltip.UnableToCancelTimeLimitedAgreement')}
          disableHoverListener={!withinThreeDaysOfActivation}
          disableFocusListener={!withinThreeDaysOfActivation}
          disableTouchListener={!withinThreeDaysOfActivation}>
          <span>
            <Button
              variant='contained'
              color='secondary'
              onClick={handleCancelOpen}
              disabled={isMutating || withinThreeDaysOfActivation}
              loading={isMutating}>
              {translate('Action.CancelAgreement')}
            </Button>
          </span>
        </Tooltip>
      );
    }
  }

  if (!buttons) {
    return null;
  }

  return (
    <React.Fragment>
      <Flex gap={8} alignItems='flex-start'>
        {buttons}
      </Flex>

      <CreatorCancelAgreementModal
        isOpen={isCancelModalOpen}
        onClose={handleCancelClose}
        onConfirm={handleCancelConfirm}
        isLoading={isMutating}
        isInquiredAgreement={agreement.status === AgreementStatus.Inquired}
        isTimeLimitedLicense={
          enableIpPlatformTimeboundLicenses &&
          agreement.license?.licenseDuration?.durationType === LicenseDurationType.TimeLimited
        }
      />
    </React.Fragment>
  );
};

export default CreatorAgreementActions;
