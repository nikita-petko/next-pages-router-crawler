import { Control, Controller, FieldErrors } from 'react-hook-form';
import { Grid, TextField } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import {
  CreateSubscriptionRegisterOptions,
  CreateSubscriptionFormType,
} from '../../../constants/CreateSubscriptionRegisterConstants';
import { ExperienceSubscriptionLimitErrorMessage } from '../../ExperienceSubscriptionFormMessages';

export type TCreateSubscriptionFiatDescriptionInputProps = {
  control: Control<CreateSubscriptionFormType>;
  errors: FieldErrors<CreateSubscriptionFormType>;
};

function CreateSubscriptionFiatDescriptionInput({
  control,
  errors,
}: TCreateSubscriptionFiatDescriptionInputProps) {
  const { translate } = useTranslation();

  return (
    <Grid item XSmall={12}>
      <Controller
        name='description'
        control={control}
        rules={CreateSubscriptionRegisterOptions.description}
        render={({ field }) => (
          <TextField
            {...field}
            error={!!errors.description}
            fullWidth
            multiline
            required
            minRows={6}
            id='description'
            label={translate('Label.DescribeSubscriptionOffering')}
            inputProps={{
              maxLength: CreateSubscriptionRegisterOptions.description.maxLength,
            }}
            helperText={
              <ExperienceSubscriptionLimitErrorMessage
                error={errors.description}
                charCount={field.value.length}
                limit={CreateSubscriptionRegisterOptions.description.maxLength}
              />
            }
          />
        )}
      />
    </Grid>
  );
}

export default CreateSubscriptionFiatDescriptionInput;
