import React, { useCallback } from 'react';
import { useForm, FormProvider, useController } from 'react-hook-form';
import type { AgreementStatus } from '@rbx/client-content-licensing-api/v1';
import { CancellationReason } from '@rbx/client-content-licensing-api/v1';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Radio,
  RadioGroup,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Button, FormHelperText } from '@rbx/ui';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../../utils/logger';
import { foundationRadioLabel } from './foundationRadioLabel';

const CANCELLATION_REASON_FROM_RADIO_VALUE_BASE: Record<string, CancellationReason> = {
  [CancellationReason.NoLongerPlanningToUseIp]: CancellationReason.NoLongerPlanningToUseIp,
};

const CANCELLATION_REASON_FROM_RADIO_VALUE_WITH_TIME_LIMITED: Record<string, CancellationReason> = {
  ...CANCELLATION_REASON_FROM_RADIO_VALUE_BASE,
  [CancellationReason.NotReadyForProposedDates]: CancellationReason.NotReadyForProposedDates,
};

function cancellationReasonFromRadioValue(
  value: string,
  includeTimeLimitedOption: boolean,
): CancellationReason | '' {
  const map = includeTimeLimitedOption
    ? CANCELLATION_REASON_FROM_RADIO_VALUE_WITH_TIME_LIMITED
    : CANCELLATION_REASON_FROM_RADIO_VALUE_BASE;
  return map[value] ?? '';
}

export interface CreatorCancelAgreementFormData {
  reason: CancellationReason | '';
}

interface CreatorCancelAgreementModalProps {
  agreementId: string;
  agreementStatus: AgreementStatus;
  isInquiredAgreement: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: CancellationReason) => Promise<void>;
  isLoading?: boolean;
  isTimeLimitedLicense?: boolean;
}

const CreatorCancelAgreementModal: React.FC<CreatorCancelAgreementModalProps> = ({
  agreementId,
  agreementStatus,
  isInquiredAgreement,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  isTimeLimitedLicense = false,
}) => {
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();

  const methods = useForm<CreatorCancelAgreementFormData>({
    defaultValues: { reason: '' },
  });

  const { control, handleSubmit, reset } = methods;

  const {
    field: reasonField,
    fieldState: { error: reasonError },
  } = useController({
    name: 'reason',
    control,
    rules: { required: translate('Label.FieldIsRequired') },
  });

  const handleReasonRadioValueChange = useCallback(
    (value: string) => {
      reasonField.onChange(cancellationReasonFromRadioValue(value, isTimeLimitedLicense));
    },
    [reasonField, isTimeLimitedLicense],
  );

  const handleClose = useCallback(() => {
    logEvent(LicenseManagerClickEvent.CreatorAgreementCancelModalDismissClickEvent, {
      agreementId,
      agreementStatus,
    });
    reset();
    onClose();
  }, [agreementId, agreementStatus, logEvent, onClose, reset]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleClose();
      }
    },
    [handleClose],
  );

  const onSubmit = async (data: CreatorCancelAgreementFormData) => {
    const { reason } = data;
    if (reason === '') {
      return;
    }
    logEvent(LicenseManagerClickEvent.CreatorAgreementCancelModalConfirmClickEvent, {
      agreementId,
      agreementStatus,
      cancellationReason: reason,
    });
    await onConfirm(reason);
  };

  const isSubmitting = isLoading;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      size='Medium'
      isModal
      hasCloseAffordance={false}>
      <DialogContent>
        <DialogBody className='flex flex-col gap-y-xsmall scroll-y min-height-[0px]'>
          <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
            {isInquiredAgreement
              ? translate('Action.CancelLicenseRequest')
              : translate('Action.CancelAgreement')}
          </DialogTitle>
          <span className='text-body-medium content-default margin-none padding-bottom-medium'>
            {isInquiredAgreement
              ? translate('Description.CancelLicenseRequest')
              : translate('Description.CancelAgreement')}
          </span>

          <FormProvider {...methods}>
            <span className='text-label-medium content-default margin-none padding-bottom-large'>
              <strong>{translate('Header.CancellationReason')}</strong>
            </span>
            <RadioGroup
              value={reasonField.value}
              onValueChange={handleReasonRadioValueChange}
              size='Medium'>
              <Radio
                value={CancellationReason.NoLongerPlanningToUseIp}
                label={foundationRadioLabel(
                  <span className='text-body-medium content-muted'>
                    {translate('Label.NoLongerInterested')}
                  </span>,
                )}
              />
              {isTimeLimitedLicense && (
                <Radio
                  value={CancellationReason.NotReadyForProposedDates}
                  label={foundationRadioLabel(
                    <span className='text-body-medium content-muted'>
                      {translate('Label.NotReadyByProposedDates')}
                    </span>,
                  )}
                />
              )}
            </RadioGroup>
            <div className='min-height-[24px]'>
              <FormHelperText error>{reasonError ? reasonError.message : ''}</FormHelperText>
            </div>
          </FormProvider>
        </DialogBody>

        <DialogFooter className='flex flex-col gap-small small:flex-row small:justify-end'>
          <Button
            onClick={handleClose}
            variant='contained'
            color='secondary'
            disabled={isSubmitting}>
            {translate('Action.Cancel')}
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting}
            variant='contained'
            color='destructive'>
            {isInquiredAgreement
              ? translate('Action.ConfirmCancelRequest')
              : translate('Action.ConfirmCancelAgreement')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatorCancelAgreementModal;
