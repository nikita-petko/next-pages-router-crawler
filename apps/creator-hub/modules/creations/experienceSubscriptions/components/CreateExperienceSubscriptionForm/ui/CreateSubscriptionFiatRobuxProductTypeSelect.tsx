import type { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Radio, RadioGroup } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import type { CreateSubscriptionFormType } from '../../../constants/CreateSubscriptionRegisterConstants';
import {
  CreateSubscriptionRegisterOptions,
  ProductTypeMenuSelection,
} from '../../../constants/CreateSubscriptionRegisterConstants';
import useSubscriptionFormStyles from '../../ExperienceSubscription.styles';
import { ExperieceSubscriptionStatusHelperMessage } from '../../ExperienceSubscriptionFormMessages';
import CreateSubscriptionSubsectionTitle from './CreateSubscriptionSubsectionTitle';

type TCreateSubscriptionFiatRobuxProductTypeSelectProps = {
  control: Control<CreateSubscriptionFormType>;
  errors: FieldErrors<CreateSubscriptionFormType>;
  bottomGrid: string;
  disabled?: boolean;
};

function CreateSubscriptionFiatRobuxProductTypeSelect({
  control,
  errors,
  bottomGrid,
  disabled = false,
}: TCreateSubscriptionFiatRobuxProductTypeSelectProps) {
  const { translate } = useTranslation();
  const {
    classes: { disabledRadioText },
  } = useSubscriptionFormStyles();

  return (
    <Grid
      item
      XSmall={12}
      Medium={12}
      XXLarge={8}
      Large={7}
      XLarge={8}
      classes={{ root: bottomGrid }}>
      <Grid container direction='column'>
        <Grid item>
          <CreateSubscriptionSubsectionTitle title={translate('Label.ProductTypeOffering')} />
        </Grid>
        <Grid item className={disabled ? disabledRadioText : undefined}>
          <Controller
            name='productType'
            control={control}
            rules={CreateSubscriptionRegisterOptions.productType}
            render={({ field }) => (
              <RadioGroup
                value={field.value || ''}
                disabled={disabled}
                onValueChange={(value) => {
                  field.onChange(value);
                }}>
                {ProductTypeMenuSelection.map((menuItem) => {
                  return (
                    <Grid item key={menuItem.value} style={{ marginBottom: 8 }}>
                      <Radio
                        value={menuItem.value}
                        label={translate(menuItem.name)}
                        hint={translate(menuItem.description)}
                        data-testid={`product${menuItem.value}`}
                      />
                    </Grid>
                  );
                })}
              </RadioGroup>
            )}
          />
        </Grid>
        <Grid item>
          <Typography variant='caption' color={errors.productType ? 'error' : 'secondary'}>
            <ExperieceSubscriptionStatusHelperMessage error={errors.productType} />
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default CreateSubscriptionFiatRobuxProductTypeSelect;
