import { FunctionComponent } from 'react';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { Grid, TextField } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import {
  CreateSubscriptionRegisterOptions,
  CreateSubscriptionFormType,
} from '../../../constants/CreateSubscriptionRegisterConstants';
import { ExperienceSubscriptionLimitErrorMessage } from '../../ExperienceSubscriptionFormMessages';

export type TCreateSubscriptionFiatNameFieldProps = {
  control: Control<CreateSubscriptionFormType>;
  errors: FieldErrors<CreateSubscriptionFormType>;
  usedSubscriptionNames: string[];
};

const CreateSubscriptionFiatNameInput: FunctionComponent<TCreateSubscriptionFiatNameFieldProps> = ({
  control,
  errors,
  usedSubscriptionNames,
}) => {
  const { translate } = useTranslation();

  return (
    <Grid container item Large={7} XLarge={8} XXLarge={8}>
      <Controller
        name='name'
        control={control}
        rules={{
          ...CreateSubscriptionRegisterOptions.name,
          validate: (field) => {
            if (usedSubscriptionNames.includes(field?.trim())) {
              return 'Error.SubscriptionNameAlreadyUsed';
            }
            return true;
          },
        }}
        render={({ field }) => (
          <TextField
            {...field}
            error={!!errors.name}
            fullWidth
            multiline
            required
            id='name'
            label={translate('Label.NameYourSubscription')}
            inputProps={{
              maxLength: CreateSubscriptionRegisterOptions.name.maxLength,
            }}
            helperText={
              <ExperienceSubscriptionLimitErrorMessage
                error={errors.name}
                charCount={field.value.length}
                limit={CreateSubscriptionRegisterOptions.name.maxLength}
              />
            }
          />
        )}
      />
    </Grid>
  );
};

export default CreateSubscriptionFiatNameInput;
