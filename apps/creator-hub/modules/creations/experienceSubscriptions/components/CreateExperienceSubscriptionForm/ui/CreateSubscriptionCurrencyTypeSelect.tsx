import { Fragment } from 'react';
import type { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import type { Money } from '@rbx/client-developer-subscriptions-api/v1';
import { CurrencyType } from '@rbx/client-developer-subscriptions-api/v1';
import { Radio, RadioGroup, FeedbackBanner } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import { ACCOUNT_VERIFICATION_URL } from '@modules/miscellaneous/common/constants/linkConstants';
import type { CreateSubscriptionFormType } from '../../../constants/CreateSubscriptionRegisterConstants';
import useSubscriptionFormStyles from '../../ExperienceSubscription.styles';
import CreateSubscriptionFiatPriceSection from './CreateSubscriptionFiatPriceSection';
import CreateSubscriptionRobuxPriceSection from './CreateSubscriptionRobuxPriceSection';
import CreateSubscriptionSubsectionTitle from './CreateSubscriptionSubsectionTitle';

type TCreateSubscriptionCurrencyTypeSelectProps = {
  control: Control<CreateSubscriptionFormType>;
  errors: FieldErrors<CreateSubscriptionFormType>;
  inputFormPadding: string;
  priceTierMap?: Record<string, Money>;
  onPriceSelect: (priceTierKey: string) => void;
  onRobuxPriceChange?: (priceInRobux: number) => void;
  existingCurrencyType?: CurrencyType;
  existingRobuxPrice?: number | null;
  existingBasePriceId?: string | null;
  canAccessExperienceSubscription?: boolean;
};

function CreateSubscriptionCurrencyTypeSelect({
  control,
  errors,
  inputFormPadding,
  priceTierMap,
  onPriceSelect,
  onRobuxPriceChange,
  existingCurrencyType,
  existingRobuxPrice,
  existingBasePriceId,
  canAccessExperienceSubscription = true,
}: TCreateSubscriptionCurrencyTypeSelectProps) {
  const {
    classes: { largeGapItem },
  } = useSubscriptionFormStyles();
  const { translate } = useTranslation();

  // Convert CurrencyType enum to string format used by the form
  const getDefaultCurrencyType = (): string => {
    if (existingCurrencyType === CurrencyType.Robux) {
      return 'robux';
    }
    if (existingCurrencyType === CurrencyType.Fiat) {
      return 'fiat';
    }
    return '';
  };

  return (
    <Grid item XSmall={12}>
      <CreateSubscriptionSubsectionTitle title='Payment options' />
      <Controller
        name='currencyType'
        control={control}
        defaultValue={getDefaultCurrencyType()}
        render={({ field }) => (
          <Grid container direction='column' classes={{ root: inputFormPadding }}>
            <RadioGroup
              value={field.value || ''}
              onValueChange={(value) => {
                field.onChange(value);
              }}>
              <>
                <Grid item XSmall={12}>
                  <Radio
                    value='robux'
                    label='Subscribers pay Robux'
                    hint='Charge users recurring Robux fee to access your subscription'
                  />
                </Grid>
                <Grid item XSmall={12}>
                  <Grid
                    item
                    XSmall={12}
                    className={largeGapItem}
                    style={{ display: field.value === 'robux' ? 'block' : 'none' }}>
                    <CreateSubscriptionRobuxPriceSection
                      control={control}
                      onRobuxPriceChange={onRobuxPriceChange}
                      existingRobuxPrice={existingRobuxPrice}
                    />
                  </Grid>
                </Grid>
              </>
              <>
                <Grid item XSmall={12}>
                  <Radio
                    value='fiat'
                    label='Subscribers pay local currency'
                    hint='Charge users recurring credit card payment to access your subscription'
                  />
                </Grid>
                <Grid item XSmall={12} className={largeGapItem}>
                  <Grid
                    item
                    XSmall={12}
                    style={{
                      marginTop: 8,
                      display: field.value === 'fiat' ? 'block' : 'none',
                    }}>
                    <CreateSubscriptionFiatPriceSection
                      control={control}
                      errors={errors}
                      priceTierMap={priceTierMap}
                      onPriceSelect={onPriceSelect}
                      existingBasePriceId={existingBasePriceId}
                      disabled={!canAccessExperienceSubscription}
                    />
                  </Grid>
                </Grid>
                {field.value === 'fiat' && !canAccessExperienceSubscription && (
                  <Grid item XSmall={12} style={{ marginTop: 8, marginLeft: 36 }}>
                    <FeedbackBanner
                      title=''
                      severity='Warning'
                      description={translate(
                        'Message.VerifyAccountForFiatSubscription' /* TranslationNamespace.ExperienceSubscriptions */,
                      )}
                      layout='Inline'
                      linkHref={ACCOUNT_VERIFICATION_URL}
                      linkLabel={translate(
                        'Action.LearnMore' /* TranslationNamespace.ExperienceSubscriptions */,
                      )}
                      variant='Emphasis'
                    />
                  </Grid>
                )}
              </>
            </RadioGroup>
          </Grid>
        )}
      />
    </Grid>
  );
}

export default CreateSubscriptionCurrencyTypeSelect;
