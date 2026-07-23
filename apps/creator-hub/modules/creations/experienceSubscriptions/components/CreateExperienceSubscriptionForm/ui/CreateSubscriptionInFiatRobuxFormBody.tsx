import { Control, FieldErrors } from 'react-hook-form';
import { Grid } from '@rbx/ui';
import { Money } from '@rbx/clients/developerSubscriptionsApi';
import { CreateSubscriptionFormType } from '../../../constants/CreateSubscriptionRegisterConstants';
import CreateSubscriptionImageUploader from './CreateSubscriptionImageUploader';
import CreateSubscriptionFiatRobuxNameInput from './CreateSubscriptionFiatRobuxNameInput';
import CreateSubscriptionPeriodSelect from './CreateSubscriptionPeriodSelect';
import CreateSubscriptionFiatRobuxDescriptionInput from './CreateSubscriptionFiatRobuxDescriptionInput';
import CreateSubscriptionRevShareDemoCard from './CreateSubscriptionRevShareDemoCard';
import CreateSubscriptionFiatRobuxProductTypeSelect from './CreateSubscriptionFiatRobuxProductTypeSelect';
import CreateSubscriptionCurrencyTypeSelect from './CreateSubscriptionCurrencyTypeSelect';

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
      <Grid item XSmall={12} Medium={12} XXLarge={8} Large={7} XLarge={8}>
        <Grid container item direction='row' classes={{ root: inputFormPadding }}>
          <CreateSubscriptionFiatRobuxDescriptionInput control={control} errors={errors} />
          <CreateSubscriptionPeriodSelect control={control} errors={errors} />
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
      </Grid>
      {!shouldFoldRevshareDemoInCreationForm && (
        <CreateSubscriptionRevShareDemoCard revshareCard={revshareCard}>
          {revshareStatDemo}
        </CreateSubscriptionRevShareDemoCard>
      )}
      <CreateSubscriptionFiatRobuxProductTypeSelect
        control={control}
        errors={errors}
        bottomGrid={bottomGrid}
      />
    </Grid>
  );
}

export default CreateSubscriptionInFiatRobuxFormBody;
