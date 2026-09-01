import React, { useState } from 'react';
import type {
  CancellationReason,
  HydratedAgreementWithHydratedTargetsResponse,
} from '@rbx/client-content-licensing-api/v1';
import { AgreementStatus, LicenseDurationType } from '@rbx/client-content-licensing-api/v1';
import { useTranslation } from '@rbx/intl';
import { Button, CircularProgress, Tooltip } from '@rbx/ui';
import Flex from '@modules/miscellaneous/components/Flex';
import { isNonEmptyString } from '@modules/miscellaneous/utils';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import useIpSnackbar from '../../../hooks/useIpSnackbar';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../../utils/logger';
import { isWithinThreeDaysOfDate } from '../../utils/timeLimitedLicense';
import { useCreatorCancelAgreementMutation } from '../hooks/agreements';
import { isEarlyIpUsageDetected } from '../utils/agreementActivity';
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
  const { isFetched } = useSettings();
  const { enqueueErrorSnackbar, enqueueSuccessSnackbar } = useIpSnackbar();
  const { logEvent } = useLicenseManagerLogger();

  const cancelAcceptedAgreementMutation = useCreatorCancelAgreementMutation();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const handleCancelOpen = async () => {
    const agreementId = agreement.id;
    const agreementStatus = agreement.status;
    if (!isNonEmptyString(agreementId) || agreementStatus == null) {
      return;
    }

    logEvent(LicenseManagerClickEvent.CreatorAgreementCancelModalOpenClickEvent, {
      agreementId,
      agreementStatus,
    });
    setIsCancelModalOpen(true);
  };

  const handleCancelClose = () => {
    setIsCancelModalOpen(false);
  };

  const handleCancelConfirm = async (reason: CancellationReason) => {
    const agreementId = agreement.id;
    if (!isNonEmptyString(agreementId)) {
      return;
    }

    try {
      await cancelAcceptedAgreementMutation.mutateAsync({
        agreementId,
        reason,
      });
      enqueueSuccessSnackbar(
        agreement.status === AgreementStatus.Inquired
          ? 'Message.LicenseRequestNowCancelled'
          : 'Message.AgreementNowCancelled',
      );
      setIsCancelModalOpen(false);
    } catch {
      enqueueErrorSnackbar();
    }
  };

  const isMutating = cancelAcceptedAgreementMutation.isPending;
  const withinThreeDaysOfActivation = isWithinThreeDaysOfDate(agreement.statusExpireAt);
  const isDeepScanFound = isEarlyIpUsageDetected(agreement.activityLog);

  const timeLimitedCancelTooltipTitleKey =
    withinThreeDaysOfActivation || !isDeepScanFound
      ? 'Tooltip.UnableToCancelTimeLimitedAgreement'
      : 'Tooltip.IpUseDetected';

  if (!isFetched) {
    return <CircularProgress />;
  }

  let buttons: React.ReactNode = null;
  if (agreement.status === AgreementStatus.Inquired) {
    buttons = (
      <Tooltip
        arrow
        placement='bottom'
        title={translate(timeLimitedCancelTooltipTitleKey)}
        disableHoverListener={!withinThreeDaysOfActivation && !isDeepScanFound}
        disableFocusListener={!withinThreeDaysOfActivation && !isDeepScanFound}
        disableTouchListener={!withinThreeDaysOfActivation && !isDeepScanFound}>
        <span>
          <Button
            variant='contained'
            color='secondary'
            onClick={handleCancelOpen}
            disabled={isMutating || withinThreeDaysOfActivation || isDeepScanFound}
            loading={isMutating}>
            {translate('Action.CancelRequest')}
          </Button>
        </span>
      </Tooltip>
    );
  }
  if (agreement.status === AgreementStatus.Accepted) {
    // Only Time-limited licenses can be in Accepted state
    buttons = (
      <Tooltip
        arrow
        placement='bottom'
        title={translate(timeLimitedCancelTooltipTitleKey)}
        disableHoverListener={!withinThreeDaysOfActivation && !isDeepScanFound}
        disableFocusListener={!withinThreeDaysOfActivation && !isDeepScanFound}
        disableTouchListener={!withinThreeDaysOfActivation && !isDeepScanFound}>
        <span>
          <Button
            variant='contained'
            color='secondary'
            onClick={handleCancelOpen}
            disabled={isMutating || withinThreeDaysOfActivation || isDeepScanFound}
            loading={isMutating}>
            {translate('Action.CancelAgreement')}
          </Button>
        </span>
      </Tooltip>
    );
  }

  if (!buttons) {
    return null;
  }

  const agreementId = agreement.id;
  const agreementStatus = agreement.status;

  return (
    <>
      <Flex gap={8} alignItems='flex-start'>
        {buttons}
      </Flex>

      {isNonEmptyString(agreementId) && agreementStatus != null ? (
        <CreatorCancelAgreementModal
          agreementId={agreementId}
          agreementStatus={agreementStatus}
          isOpen={isCancelModalOpen}
          onClose={handleCancelClose}
          onConfirm={handleCancelConfirm}
          isLoading={isMutating}
          isInquiredAgreement={agreement.status === AgreementStatus.Inquired}
          isTimeLimitedLicense={
            agreement.license?.licenseDuration?.durationType === LicenseDurationType.TimeLimited
          }
        />
      ) : null}
    </>
  );
};

export default CreatorAgreementActions;
