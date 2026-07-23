import React, { useCallback, useMemo, useState } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import type { LicenseResponse } from '@rbx/client-content-licensing-api/v1';
import { ContentStandardAnswer, ModerationStatus } from '@rbx/client-content-licensing-api/v1';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';
import getKeyFromModerationReason from '@modules/licenses/utils/moderationReason';
import {
  TextFieldWithEnhancedHelperTextV2,
  getMaxLengthValidationRule,
} from '../../../components/TextFieldWithEnhancedHelperTextV2';
import useIpSnackbar from '../../../hooks/useIpSnackbar';
import GenericStandardsAccordion from '../../components/GenericStandardsAccordion';
import { MAX_IPH_CHANGE_REQUEST_LENGTH } from '../../constants';
import { useRequestLicenseUsageChangesMutation } from '../hooks/agreements';

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
      ) ?? [],
    [license?.contentStandardAnswers],
  );
  const notAllowedStandards = useMemo(
    () =>
      license?.contentStandardAnswers?.filter(
        (statement) => statement.answer === ContentStandardAnswer.No,
      ) ?? [],
    [license?.contentStandardAnswers],
  );

  const isSubmitting = isLoading || requestLicenseUsageChangesMutation.isPending;

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
            {translate('Label.IphChangeRequestDialogTitle')}
          </DialogTitle>

          {license?.contentStandardsScope ? (
            <div className='flex flex-col gap-y-xsmall'>
              <span className='text-label-medium'>{translate('Label.ScopeOfLicense')}</span>
              <span className='text-body-medium content-muted margin-none [white-space:pre-wrap]'>
                {license.contentStandardsScope}
              </span>
            </div>
          ) : null}

          {/* Ensures that we only render the accordion if we would have content in it */}
          {allowedStandards.length > 0 || notAllowedStandards.length > 0 ? (
            <div className='flex flex-col gap-y-xsmall'>
              <span className='text-label-medium'>{translate('Label.ContentStandards')}</span>

              {allowedStandards.length > 0 ? (
                <GenericStandardsAccordion
                  isAccordionOpen={isAllowedExpanded}
                  setIsOpen={setIsAllowedExpanded}
                  title={translate('Label.Allowed')}
                  statementsToShow={allowedStandards}
                />
              ) : null}
              {notAllowedStandards.length > 0 ? (
                <GenericStandardsAccordion
                  isAccordionOpen={isNotAllowedExpanded}
                  setIsOpen={setIsNotAllowedExpanded}
                  title={translate('Label.NotAllowed')}
                  statementsToShow={notAllowedStandards}
                />
              ) : null}
              {/* Note: we intentionally do not render the Not Applicable selections */}
            </div>
          ) : null}

          <span className='text-body-medium content-default margin-none'>
            {translate('Label.IphChangeRequestDialogDetails')}
          </span>

          <FormProvider {...form}>
            <Controller
              name='feedback'
              control={form.control}
              render={({ field, fieldState: { error } }) => (
                <TextFieldWithEnhancedHelperTextV2
                  {...field}
                  id='iph-requested-changes'
                  label=''
                  placeholder={translate('Label.FeedbackToCreatorPlaceholder')}
                  fullWidth
                  multiline
                  minRows={4}
                  maxRows={15}
                  error={!!error || !!moderationError}
                  helperText={error?.message ?? moderationError}
                  maxLength={MAX_IPH_CHANGE_REQUEST_LENGTH}
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
                required: translate('Label.FieldIsRequired'),
                validate: getMaxLengthValidationRule(MAX_IPH_CHANGE_REQUEST_LENGTH, translate),
              }}
            />
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
            onClick={form.handleSubmit(handleSubmit)}
            loading={isSubmitting}
            disabled={!!moderationError}
            variant='contained'
            color='primaryBrand'>
            {translate('Action.Submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IphChangeRequestDialog;
