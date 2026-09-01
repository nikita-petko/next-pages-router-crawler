import type { Control, FieldErrors } from 'react-hook-form';
import type { Money } from '@rbx/client-developer-subscriptions-api/v1';
import { Grid, Typography } from '@rbx/ui';
import type { CreateSubscriptionFormType } from '../../../constants/CreateSubscriptionRegisterConstants';
import useSubscriptionFormStyles from '../../ExperienceSubscription.styles';
import CreateSubscriptionPriceSelect from './CreateSubscriptionPriceSelect';

type TCreateSubscriptionFiatPriceSectionProps = {
  control: Control<CreateSubscriptionFormType>;
  errors: FieldErrors<CreateSubscriptionFormType>;
  priceTierMap?: Record<string, Money>;
  onPriceSelect: (priceTierKey: string) => void;
  existingBasePriceId?: string | null;
  disabled?: boolean;
};

function CreateSubscriptionFiatPriceSection({
  control,
  errors,
  priceTierMap,
  onPriceSelect,
  existingBasePriceId,
  disabled = false,
}: TCreateSubscriptionFiatPriceSectionProps) {
  const { classes } = useSubscriptionFormStyles();

  return (
    <Grid
      container
      direction='column'
      spacing={2}
      classes={{ root: classes.optionalSubSectionContainer }}
      style={disabled ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
      <Grid item>
        <Grid container direction='column' spacing={1}>
          <Grid item>
            <Typography variant='body2' style={{ fontWeight: 700 }}>
              <span>US price </span>
              <span className={classes.colorContentDefault}>*</span>
            </Typography>
          </Grid>
          <Grid item>
            <CreateSubscriptionPriceSelect
              control={control}
              errors={errors}
              priceTierMap={priceTierMap}
              onPriceSelect={onPriceSelect}
              existingBasePriceId={existingBasePriceId}
              disabled={disabled}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default CreateSubscriptionFiatPriceSection;
