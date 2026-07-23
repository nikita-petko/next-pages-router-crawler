import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import useContentModerationMutation from '@modules/licenses/hooks/useContentModerationMutation';
import getKeyFromModerationReason from '@modules/licenses/utils/moderationReason';
import { ModerationStatus, RejectionReason } from '@rbx/clients/contentLicensingApi/v1';
import { useSettings } from '@modules/settings';

import { MAX_IPH_FEEDBACK_LENGTH } from '../../constants';
import {
  TextFieldWithEnhancedHelperText,
  getMaxLengthValidationRule,
} from '../../../components/TextFieldWithEnhancedHelperText';

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
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;

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
        const reason = response.reason
          ? (response.reason as RejectionReason)
          : RejectionReason.FinancialRequest;
        const errorMessage = translate(getKeyFromModerationReason(reason));
        setModerationError(errorMessage);
      }
    } catch {
      setModerationError(translate('Error.LoadingData'));
    }
  };

  const isSubmitting = isLoading || contentModerationMutation.isPending;

  if (!isFetched) {
    return <CircularProgress />;
  }

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogTitle>{translate('Heading.ConfirmRejectAgreement')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{translate('Message.ConfirmRejectAgreement')}</DialogContentText>
      </DialogContent>

      {enableIpPlatformTimeboundLicenses && (
        <div>
          <DialogContent>
            <DialogContentText>
              <Typography variant='h6' color='primary'>
                {translate('Label.NoteFromTheCreator')}
              </Typography>
            </DialogContentText>
            <DialogContentText whiteSpace='pre-wrap'>{creatorNote}</DialogContentText>
          </DialogContent>
          {dateRangeString && (
            <div>
              <DialogContent>
                <DialogContentText>
                  <Typography variant='h6' color='primary'>
                    {translate('Header.AgreementDuration')}
                  </Typography>
                </DialogContentText>
                <DialogContentText>
                  {translate('Description.AgreementDurationShort', { dateRange: dateRangeString })}
                </DialogContentText>
              </DialogContent>
            </div>
          )}
        </div>
      )}

      <DialogContent>
        <FormProvider {...methods}>
          <DialogContentText gutterBottom>
            <Typography variant='h6' color='primary'>
              {translate('Label.RejectionReasonOptional')}
            </Typography>
          </DialogContentText>

          <Controller
            name='feedback'
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextFieldWithEnhancedHelperText
                {...field}
                id='iph-rejection-feedback'
                label=''
                placeholder={translate('Label.FeedbackToCreatorPlaceholder')}
                fullWidth
                multiline
                minRows={3}
                maxRows={15}
                error={!!error || !!moderationError}
                helperText={error?.message || moderationError}
                maxLength={MAX_IPH_FEEDBACK_LENGTH}
                showCharacterCount
                disabled={isSubmitting}
                onChange={(e) => {
                  field.onChange(e);
                  if (moderationError) {
                    setModerationError(undefined);
                  }
                }}
              />
            )}
            rules={{
              validate: getMaxLengthValidationRule(MAX_IPH_FEEDBACK_LENGTH, translate),
            }}
          />
        </FormProvider>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant='contained' color='secondary' disabled={isSubmitting}>
          {translate('Action.Cancel')}
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          loading={isSubmitting}
          variant='contained'
          color='destructive'>
          {translate('Action.Reject')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IphRejectRequestModal;
