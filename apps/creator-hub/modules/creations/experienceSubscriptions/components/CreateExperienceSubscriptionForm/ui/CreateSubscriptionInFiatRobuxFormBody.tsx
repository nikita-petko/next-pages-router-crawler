import type { Control, FieldErrors } from 'react-hook-form';
import type { Money } from '@rbx/client-developer-subscriptions-api/v1';
import { Grid } from '@rbx/ui';
import type { CreateSubscriptionFormType } from '../../../constants/CreateSubscriptionRegisterConstants';
import CreateSubscriptionCurrencyTypeSelect from './CreateSubscriptionCurrencyTypeSelect';
import CreateSubscriptionFiatRobuxDescriptionInput from './CreateSubscriptionFiatRobuxDescriptionInput';
import CreateSubscriptionFiatRobuxNameInput from './CreateSubscriptionFiatRobuxNameInput';
import CreateSubscriptionFiatRobuxProductTypeSelect from './CreateSubscriptionFiatRobuxProductTypeSelect';
import CreateSubscriptionImageUploader from './CreateSubscriptionImageUploader';
import CreateSubscriptionPeriodSelect from './CreateSubscriptionPeriodSelect';
import CreateSubscriptionRevShareDemoCard from './CreateSubscriptionRevShareDemoCard';

type TCreateSubscriptionInFiatRobuxFormBodyProps = {
  control: Control<CreateSubscriptionFormType>;
  errors: FieldErrors<CreateSubscriptionFormType>;
  usedSubscriptionNames: string[];
  priceTierMap?: Record<string, Money>;
  inputFormPadding: string;
  revshareCard: string;
  bottomGrid: string;
  shouldFoldRevshareDemoInCreationForm: boolean;
  revshareStatDemo: React.ReactNode;
  onFileChange: (file: File | null) => void;
  onPriceSelect: (priceTierKey: string) => void;
  onRobuxPriceChange?: (priceInRobux: number) => void;
  canAccessExperienceSubscription?: boolean;
};

function CreateSubscriptionInFiatRobuxFormBody({
  control,
  errors,
  usedSubscriptionNames,
  priceTierMap,
  inputFormPadding,
  revshareCard,
  bottomGrid,
  shouldFoldRevshareDemoInCreationForm,
  revshareStatDemo,
  onFileChange,
  onPriceSelect,
  onRobuxPriceChange,
  canAccessExperienceSubscription,
}: TCreateSubscriptionInFiatRobuxFormBodyProps) {
  return (
    <Grid container item direction='row' classes={{ root: inputFormPadding }}>
      <CreateSubscriptionImageUploader onChange={onFileChange} />
      <CreateSubscriptionFiatRobuxNameInput
        control={control}
        errors={errors}
        usedSubscriptionNames={usedSubscriptionNames}
      />
      <Grid item XSmall={12}>
        <Grid container direction='column' classes={{ root: inputFormPadding }}>
          <Grid item XSmall={12} Medium={12} XXLarge={8} XLarge={8}>
            <Grid container item direction='row' classes={{ root: inputFormPadding }}>
              <CreateSubscriptionFiatRobuxDescriptionInput control={control} errors={errors} />
              <CreateSubscriptionPeriodSelect control={control} errors={errors} />
            </Grid>
          </Grid>
          <Grid container item direction='row' XSmall={12} classes={{ root: inputFormPadding }}>
            <Grid
              item
              XSmall={12}
              Medium={12}
              XXLarge={8}
              XLarge={8}
              classes={{ root: inputFormPadding }}>
              <CreateSubscriptionCurrencyTypeSelect
                control={control}
                errors={errors}
                inputFormPadding={inputFormPadding}
                priceTierMap={priceTierMap}
                onPriceSelect={onPriceSelect}
                onRobuxPriceChange={onRobuxPriceChange}
                canAccessExperienceSubscription={canAccessExperienceSubscription}
              />

              {shouldFoldRevshareDemoInCreationForm && (
                <CreateSubscriptionRevShareDemoCard revshareCard={revshareCard}>
                  {revshareStatDemo}
                </CreateSubscriptionRevShareDemoCard>
              )}
            </Grid>
            {!shouldFoldRevshareDemoInCreationForm && (
              <CreateSubscriptionRevShareDemoCard revshareCard={revshareCard}>
                {revshareStatDemo}
              </CreateSubscriptionRevShareDemoCard>
            )}
          </Grid>
        </Grid>
      </Grid>
      <CreateSubscriptionFiatRobuxProductTypeSelect
        control={control}
        errors={errors}
        bottomGrid={bottomGrid}
      />
    </Grid>
  );
}

export default CreateSubscriptionInFiatRobuxFormBody;
