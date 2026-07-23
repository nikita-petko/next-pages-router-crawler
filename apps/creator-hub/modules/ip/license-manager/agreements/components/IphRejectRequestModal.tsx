import React, { useState } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { ModerationStatus, RejectionReason } from '@rbx/client-content-licensing-api/v1';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';
import useContentModerationMutation from '@modules/licenses/hooks/useContentModerationMutation';
import getKeyFromModerationReason from '@modules/licenses/utils/moderationReason';
import {
  TextFieldWithEnhancedHelperTextV2,
  getMaxLengthValidationRule,
} from '../../../components/TextFieldWithEnhancedHelperTextV2';
import { MAX_IPH_REJECT_FEEDBACK_LENGTH } from '../../constants';

export interface IphRejectRequestFormData {
  feedback: string;
}

interface IphRejectRequestModalProps {
  creatorNote?: string;
  dateRangeString?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (feedback: string) => Promise<void>;
  isLoading?: boolean;
}

const IphRejectRequestModal: React.FC<IphRejectRequestModalProps> = ({
  creatorNote,
  dateRangeString,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const { translate } = useTranslation();
  const [moderationError, setModerationError] = useState<string | undefined>(undefined);
  const contentModerationMutation = useContentModerationMutation();

  const methods = useForm<IphRejectRequestFormData>({
    defaultValues: { feedback: '' },
  });

  const { control, handleSubmit, reset } = methods;

  const handleClose = () => {
    setModerationError(undefined);
    reset();
    onClose();
  };

  const onSubmit = async (data: IphRejectRequestFormData) => {
    if (!data.feedback.trim()) {
      await onConfirm(data.feedback);
      return;
    }

    setModerationError(undefined);

    try {
      const { response } = await contentModerationMutation.mutateAsync(data.feedback);

      if (response.status === ModerationStatus.Accepted) {
        await onConfirm(data.feedback);
        setModerationError(undefined);
      } else {
        const reason = response.reason ?? RejectionReason.FinancialRequest;
        const errorMessage = translate(getKeyFromModerationReason(reason));
        setModerationError(errorMessage);
      }
    } catch {
      setModerationError(translate('Error.LoadingData'));
    }
  };

  const isSubmitting = isLoading || contentModerationMutation.isPending;

  const showCreatorNote = typeof creatorNote === 'string' && creatorNote !== '';
  const showDateRange = typeof dateRangeString === 'string' && dateRangeString !== '';

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
      size='Medium'
      isModal
      hasCloseAffordance={false}>
      <DialogContent>
        <DialogBody className='flex flex-col gap-y-xsmall scroll-y min-height-[0px]'>
          <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
            {translate('Heading.ConfirmRejectAgreement')}
          </DialogTitle>
          <span className='text-body-medium content-default padding-bottom-small'>
            {translate('Message.ConfirmRejectAgreement')}
          </span>

          <div className='flex flex-col gap-medium'>
            {showCreatorNote ? (
              <div className='flex flex-col gap-y-xsmall'>
                <span className='text-label-medium'>{translate('Label.NoteFromTheCreator')}</span>
                <span className='text-body-medium content-muted margin-none [white-space:pre-wrap]'>
                  {creatorNote}
                </span>
              </div>
            ) : null}

            {showDateRange ? (
              <div className='flex flex-col gap-y-xsmall'>
                <span className='text-label-medium'>{translate('Header.AgreementDuration')}</span>
                <span className='text-body-medium content-muted margin-none'>
                  {translate('Description.AgreementDurationShort', {
                    dateRange: dateRangeString,
                  })}
                </span>
              </div>
            ) : null}

            <div className='flex flex-col gap-y-xsmall'>
              <span className='text-label-medium padding-bottom-xsmall'>
                {translate('Label.RejectionReasonOptional')}
              </span>
              <FormProvider {...methods}>
                <Controller
                  name='feedback'
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextFieldWithEnhancedHelperTextV2
                      {...field}
                      id='iph-rejection-feedback'
                      label=''
                      placeholder={translate('Label.FeedbackToCreatorPlaceholder')}
                      fullWidth
                      multiline
                      minRows={5}
                      maxRows={15}
                      error={!!error || !!moderationError}
                      helperText={error?.message ?? moderationError}
                      maxLength={MAX_IPH_REJECT_FEEDBACK_LENGTH}
                      showCharacterCount
                      isDisabled={isSubmitting}
                      onChange={(e) => {
                        field.onChange(e);
                        if (moderationError) {
                          setModerationError(undefined);
                        }
                      }}
                    />
                  )}
                  rules={{
                    validate: getMaxLengthValidationRule(MAX_IPH_REJECT_FEEDBACK_LENGTH, translate),
                  }}
                />
              </FormProvider>
            </div>
          </div>
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
            {translate('Action.Reject')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IphRejectRequestModal;
