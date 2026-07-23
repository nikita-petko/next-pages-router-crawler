import React, { useCallback, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import getKeyFromModerationReason from '@modules/licenses/utils/moderationReason';
import {
  ContentStandardAnswer,
  LicenseResponse,
  ModerationStatus,
} from '@rbx/clients/contentLicensingApi/v1';
import { MAX_IPH_FEEDBACK_LENGTH } from '../../constants';
import {
  TextFieldWithEnhancedHelperText,
  getMaxLengthValidationRule,
} from '../../../components/TextFieldWithEnhancedHelperText';
import { useRequestLicenseUsageChangesMutation } from '../hooks/agreements';
import useIpSnackbar from '../../../hooks/useIpSnackbar';
import GenericStandardsAccordion from '../../components/GenericStandardsAccordion';

export interface RequestLicenseUsageChangesFormData {
  feedback: string;
}

interface IphChangeRequestDialogProps {
  agreementId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (feedback: string) => void;
  license?: LicenseResponse;
  isLoading?: boolean;
}

const IphChangeRequestDialog: React.FC<IphChangeRequestDialogProps> = ({
  agreementId,
  license,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const { translate } = useTranslation();
  const [moderationError, setModerationError] = useState<string | undefined>(undefined);
  const requestLicenseUsageChangesMutation = useRequestLicenseUsageChangesMutation();
  const { enqueueSuccessSnackbar } = useIpSnackbar();

  const form = useForm<RequestLicenseUsageChangesFormData>({
    defaultValues: { feedback: '' },
  });

  const handleClose = useCallback(() => {
    setModerationError(undefined);
    form.reset();
    onClose();
  }, [onClose, form]);

  const handleSubmit = useCallback(
    async (data: RequestLicenseUsageChangesFormData) => {
      const feedback = data.feedback.trim();

      if (!feedback) {
        return;
      }

      setModerationError(undefined);

      try {
        const { status, reason } = await requestLicenseUsageChangesMutation.mutateAsync({
          agreementId,
          feedback,
        });

        if (status === ModerationStatus.Accepted) {
          enqueueSuccessSnackbar('Message.IphChangeRequestSubmitted');
          onConfirm(feedback);
          onClose();
        } else {
          const problem = translate(getKeyFromModerationReason(reason));
          setModerationError(problem);
        }
      } catch {
        setModerationError(translate('Error.LoadingData'));
      }
    },
    [
      agreementId,
      enqueueSuccessSnackbar,
      onClose,
      onConfirm,
      requestLicenseUsageChangesMutation,
      translate,
    ],
  );

  const [isAllowedExpanded, setIsAllowedExpanded] = useState<boolean>(false);
  const [isNotAllowedExpanded, setIsNotAllowedExpanded] = useState<boolean>(false);

  const allowedStandards = useMemo(
    () =>
      license?.contentStandardAnswers?.filter(
        (statement) => statement.answer === ContentStandardAnswer.Yes,
      ) || [],
    [license?.contentStandardAnswers],
  );
  const notAllowedStandards = useMemo(
    () =>
      license?.contentStandardAnswers?.filter(
        (statement) => statement.answer === ContentStandardAnswer.No,
      ) || [],
    [license?.contentStandardAnswers],
  );

  const isSubmitting = isLoading || requestLicenseUsageChangesMutation.isPending;

  return (
    <Dialog fullWidth maxWidth='Medium' open={isOpen}>
      <DialogTitle>{translate('Label.IphChangeRequestDialogTitle')}</DialogTitle>

      <DialogContent>
        {license?.contentStandardsScope && (
          <div>
            <DialogContentText paddingBottom={1}>
              <strong>{translate('Label.ScopeOfLicense')}</strong>
            </DialogContentText>

            <DialogContentText paddingBottom={1} variant='body2' whiteSpace='pre-wrap'>
              {license.contentStandardsScope}
            </DialogContentText>
          </div>
        )}

        {/* Ensures that we only render the accordion if we would have content in it */}
        {(allowedStandards.length > 0 || notAllowedStandards.length > 0) && (
          <div>
            <DialogContentText>
              <strong>{translate('Label.ContentStandards')}</strong>
            </DialogContentText>

            {allowedStandards.length > 0 && (
              <GenericStandardsAccordion
                isAccordionOpen={isAllowedExpanded}
                setIsOpen={setIsAllowedExpanded}
                title={translate('Label.Allowed')}
                statementsToShow={allowedStandards}
              />
            )}
            {notAllowedStandards.length > 0 && (
              <GenericStandardsAccordion
                isAccordionOpen={isNotAllowedExpanded}
                setIsOpen={setIsNotAllowedExpanded}
                title={translate('Label.NotAllowed')}
                statementsToShow={notAllowedStandards}
              />
            )}
            {/* Note: we intentionally do not render the Not Applicable selections */}
          </div>
        )}
      </DialogContent>

      <DialogContent>
        <DialogContentText paddingBottom={1}>
          {translate('Label.IphChangeRequestDialogDetails')}
        </DialogContentText>

        <FormProvider {...form}>
          <Controller
            name='feedback'
            control={form.control}
            render={({ field, fieldState: { error } }) => (
              <TextFieldWithEnhancedHelperText
                {...field}
                id='iph-requested-changes'
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
              required: translate('Label.FieldIsRequired'),
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
          onClick={form.handleSubmit(handleSubmit)}
          loading={isSubmitting}
          disabled={!!moderationError}
          variant='contained'
          color='primaryBrand'>
          {translate('Action.Submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IphChangeRequestDialog;
