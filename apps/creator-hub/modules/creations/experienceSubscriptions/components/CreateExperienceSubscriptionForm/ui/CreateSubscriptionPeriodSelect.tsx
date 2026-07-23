import { Control, Controller, FieldErrors } from 'react-hook-form';
import { Grid, Select, MenuItem } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import {
  CreateSubscriptionRegisterOptions,
  CreateSubscriptionFormType,
  SubscriptionPeriodMenuSelection,
} from '../../../constants/CreateSubscriptionRegisterConstants';

type TCreateSubscriptionPeriodSelectProps = {
  control: Control<CreateSubscriptionFormType>;
  errors: FieldErrors<CreateSubscriptionFormType>;
};

function CreateSubscriptionPeriodSelect({ control, errors }: TCreateSubscriptionPeriodSelectProps) {
  const { translate } = useTranslation();

  return (
    <Grid item XSmall={12}>
      <Controller
        name='period'
        control={control}
        rules={CreateSubscriptionRegisterOptions.period}
        render={({ field }) => (
          <Select
            {...field}
            fullWidth
            error={!!errors.period}
            id='period'
            label={translate('Label.RenewalFrequency')}
            required
            disabled // Monthly is the only currently available recurrence cadence
            sx={{
              '& .MuiSelect-icon': {
                fontSize: '0',
              },
            }}>
            {SubscriptionPeriodMenuSelection.map((menuItem) => {
              return (
                <MenuItem key={menuItem.value} value={menuItem.value}>
                  {translate(menuItem.name)}
                </MenuItem>
              );
            })}
          </Select>
        )}
      />
    </Grid>
  );
}

export default CreateSubscriptionPeriodSelect;
