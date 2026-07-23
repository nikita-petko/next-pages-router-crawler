import type { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { TextArea } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import type { CreateSubscriptionFormType } from '../../../constants/CreateSubscriptionRegisterConstants';
import { CreateSubscriptionRegisterOptions } from '../../../constants/CreateSubscriptionRegisterConstants';
import useSubscriptionFormStyles from '../../ExperienceSubscription.styles';

type TCreateSubscriptionDescriptionInputProps = {
  control: Control<CreateSubscriptionFormType>;
  errors: FieldErrors<CreateSubscriptionFormType>;
};

function CreateSubscriptionDescriptionInput({
  control,
  errors,
}: TCreateSubscriptionDescriptionInputProps) {
  const { translate } = useTranslation();
  const {
    classes: { textInputValidationHelperText },
  } = useSubscriptionFormStyles();

  return (
    <Grid item XSmall={12}>
      <Controller
        name='description'
        control={control}
        rules={CreateSubscriptionRegisterOptions.description}
        render={({ field }) => {
          const helperText =
            errors.description && errors.description.message
              ? translate(errors.description.message)
              : translate('Label.CharacterCountLimit', {
                  count: (field.value?.length || 0).toString(),
                  limit: CreateSubscriptionRegisterOptions.description.maxLength.toString(),
                });

          return (
            <Grid container direction='column' style={{ width: '100%' }}>
              <Grid item>
                <TextArea
                  {...field}
                  id='description'
                  label={`${translate('Label.DescribeSubscriptionOffering')} *`}
                  rows={6}
                  maxLength={CreateSubscriptionRegisterOptions.description.maxLength}
                  hasError={!!errors.description}
                  style={{ width: '100%' }}
                />
              </Grid>
              <Grid item>
                <Typography
                  variant='caption'
                  component='div'
                  className={textInputValidationHelperText}
                  color={errors.description ? 'error' : 'secondary'}>
                  {helperText}
                </Typography>
              </Grid>
            </Grid>
          );
        }}
      />
    </Grid>
  );
}

export default CreateSubscriptionDescriptionInput;
