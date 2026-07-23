import { Control, Controller, FieldErrors } from 'react-hook-form';
import { Grid, Select, MenuItem, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import {
  CreateSubscriptionRegisterOptions,
  CreateSubscriptionFormType,
  ProductTypeMenuSelection,
} from '../../../constants/CreateSubscriptionRegisterConstants';
import showMenuBelowSelector from '../../../utils/styles';
import { ExperieceSubscriptionStatusHelperMessage } from '../../ExperienceSubscriptionFormMessages';

type TCreateSubscriptionFiatProductTypeSelectProps = {
  control: Control<CreateSubscriptionFormType>;
  errors: FieldErrors<CreateSubscriptionFormType>;
  bottomGrid: string;
};

function CreateSubscriptionFiatProductTypeSelect({
  control,
  errors,
  bottomGrid,
}: TCreateSubscriptionFiatProductTypeSelectProps) {
  const { translate } = useTranslation();

  return (
    <Grid
      item
      XSmall={12}
      Medium={12}
      XXLarge={8}
      Large={7}
      XLarge={8}
      classes={{ root: bottomGrid }}>
      <Controller
        name='productType'
        control={control}
        rules={CreateSubscriptionRegisterOptions.productType}
        render={({ field }) => (
          <Select
            {...field}
            fullWidth
            error={!!errors.productType}
            id='productType'
            label={translate('Label.ProductTypeOffering')}
            required
            SelectProps={{ ...showMenuBelowSelector }}
            InputProps={{
              'aria-label': 'productType',
            }}
            helperText={<ExperieceSubscriptionStatusHelperMessage error={errors.productType} />}>
            {ProductTypeMenuSelection.map((menuItem) => {
              return (
                <MenuItem
                  data-testid={`product${menuItem.value}`}
                  key={menuItem.value}
                  value={menuItem.value}>
                  <Grid container item direction='column'>
                    <Typography>{translate(menuItem.name)}</Typography>
                    <Typography variant='captionBody' color='secondary' display='block'>
                      {translate(menuItem.description)}
                    </Typography>
                  </Grid>
                </MenuItem>
              );
            })}
          </Select>
        )}
      />
    </Grid>
  );
}

export default CreateSubscriptionFiatProductTypeSelect;
