import { Button, Checkbox, Link } from '@rbx/foundation-ui';
import { Alert, Autocomplete, FormLabel, TextField, Typography } from '@rbx/ui';
import { useId } from 'react';
import { Controller, FormProvider, UseFormReturn } from 'react-hook-form';

import useAccountFormStyles from '@components/account/AccountForm.styles';
import { FormFields } from '@constants/account';
import { TranslationNamespace } from '@constants/localization';
import { type AdAccountFormType, type TimezoneType } from '@hooks/account/useAccountForm';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

interface AccountInfoStepProps {
  form: UseFormReturn<AdAccountFormType>;
  handleTimeZoneChange: (timezone: TimezoneType) => void;
  isCompactTermsLabel?: boolean;
  isCompleted: boolean;
  isCreatingAccount: boolean;
  isUnlocked: boolean;
  localizedTimezones: TimezoneType[];
  onCreateAccount: () => void;
  shouldRenderSubmitButton?: boolean;
}

const AccountInfoStep = ({
  form,
  handleTimeZoneChange,
  isCompactTermsLabel = false,
  isCompleted,
  isCreatingAccount,
  isUnlocked,
  localizedTimezones,
  onCreateAccount,
  shouldRenderSubmitButton = true,
}: AccountInfoStepProps) => {
  const { translate, translateHTML } = useNamespacedTranslation(TranslationNamespace.Account);
  const termsLabelId = useId();
  const termsCheckboxId = useId();
  const {
    control,
    formState: { errors, isValid: formIsValid },
  } = form;

  const {
    classes: { setupFormColumn },
  } = useAccountFormStyles();

  if (isCompleted) {
    return (
      <Alert severity='success' sx={{ mt: 1 }}>
        {translate('Message.SetupStepCompleted')}
      </Alert>
    );
  }

  if (!isUnlocked) {
    return (
      <Typography sx={{ color: 'text.secondary', mt: 1 }} variant='body2'>
        {translate('Description.CompleteStepAbove')}
      </Typography>
    );
  }

  return (
    <FormProvider {...form}>
      <div className={setupFormColumn}>
        <Controller
          control={control}
          name={FormFields.TIME_ZONE}
          render={({ field }) => (
            <Autocomplete
              disableClearable
              getOptionLabel={(option) => (option && option.title) || ''}
              id={FormFields.TIME_ZONE}
              onChange={(_event, timezoneObj) => handleTimeZoneChange(timezoneObj)}
              options={localizedTimezones}
              renderInput={(params) => (
                <TextField
                  {...params}
                  error={Boolean(errors[FormFields.TIME_ZONE])}
                  helperText={
                    errors[FormFields.TIME_ZONE]?.message ||
                    translate('Description.TimezoneCannotUpdate')
                  }
                  label={translate('Label.Timezone')}
                  name={FormFields.TIME_ZONE}
                  onBlur={field.onBlur}
                />
              )}
              value={field.value}
            />
          )}
        />

        <Controller
          control={control}
          name={FormFields.TERMS_CHECKBOX}
          render={({ field }) => (
            <>
              <div className='flex items-start gap-small'>
                <Checkbox
                  aria-labelledby={termsLabelId}
                  id={termsCheckboxId}
                  isChecked={field.value === true}
                  name={FormFields.TERMS_CHECKBOX}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  placement='Start'
                  size='Small'
                />
                <Typography
                  className='cursor-pointer'
                  component='label'
                  htmlFor={termsCheckboxId}
                  id={termsLabelId}
                  variant={isCompactTermsLabel ? 'body2' : 'body1'}>
                  {translateHTML('Description.TermsAgreementV2', [
                    {
                      closing: 'linkEnd',
                      content: (chunks) => (
                        <Link
                          href='https://en.help.roblox.com/hc/articles/15494846263060'
                          isExternal={false}
                          rel='noopener noreferrer'
                          target='_blank'
                          underline='always'>
                          {chunks}
                        </Link>
                      ),
                      opening: 'linkStart',
                    },
                  ])}
                </Typography>
              </div>
              {errors[FormFields.TERMS_CHECKBOX] && (
                <FormLabel error>{errors[FormFields.TERMS_CHECKBOX]?.message}</FormLabel>
              )}
            </>
          )}
        />

        {shouldRenderSubmitButton && (
          <div>
            <Button
              isDisabled={!formIsValid || isCreatingAccount}
              isLoading={isCreatingAccount}
              onClick={onCreateAccount}
              size='Medium'
              variant='Emphasis'>
              {translate('Action.Continue')}
            </Button>
          </div>
        )}
      </div>
    </FormProvider>
  );
};

export default AccountInfoStep;
