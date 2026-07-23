import type { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { TextInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import type { CreateSubscriptionFormType } from '../../../constants/CreateSubscriptionRegisterConstants';
import { CreateSubscriptionRegisterOptions } from '../../../constants/CreateSubscriptionRegisterConstants';
import useSubscriptionFormStyles from '../../ExperienceSubscription.styles';

type TCreateSubscriptionFiatRobuxNameFieldProps = {
  control: Control<CreateSubscriptionFormType>;
  errors: FieldErrors<CreateSubscriptionFormType>;
  usedSubscriptionNames?: string[];
  disabled?: boolean;
};

function CreateSubscriptionFiatRobuxNameInput({
  control,
  errors,
  usedSubscriptionNames = [],
  disabled = false,
}: TCreateSubscriptionFiatRobuxNameFieldProps) {
  const { translate } = useTranslation();
  const {
    classes: { textInputValidationHelperText },
  } = useSubscriptionFormStyles();

  return (
    <Grid container item Large={7} XLarge={8} XXLarge={8}>
      <Controller
        name='name'
        control={control}
        rules={{
          ...CreateSubscriptionRegisterOptions.name,
          validate:
            usedSubscriptionNames.length > 0
              ? (field) => {
                  if (usedSubscriptionNames.includes(field?.trim())) {
                    return 'Error.SubscriptionNameAlreadyUsed';
                  }
                  return true;
                }
              : undefined,
        }}
        render={({ field }) => {
          const helperText =
            errors.name && errors.name.message
              ? translate(errors.name.message)
              : translate('Label.CharacterCountLimit', {
                  count: (field.value?.length || 0).toString(),
                  limit: CreateSubscriptionRegisterOptions.name.maxLength.toString(),
                });

          return (
            <Grid container direction='column' style={{ width: '100%' }}>
              <Grid item>
                <TextInput
                  {...field}
                  id='name'
                  label={translate('Label.NameYourSubscription')}
                  isRequired
                  maxLength={CreateSubscriptionRegisterOptions.name.maxLength}
                  hasError={!!errors.name}
                  isDisabled={disabled}
                  onChange={disabled ? undefined : field.onChange}
                  onBlur={disabled ? undefined : field.onBlur}
                />
              </Grid>
              {!disabled && (
                <Grid item>
                  <Typography
                    variant='caption'
                    component='div'
                    className={textInputValidationHelperText}
                    color={errors.name ? 'error' : 'secondary'}>
                    {helperText}
                  </Typography>
                </Grid>
              )}
            </Grid>
          );
        }}
      />
    </Grid>
  );
}

export default CreateSubscriptionFiatRobuxNameInput;
