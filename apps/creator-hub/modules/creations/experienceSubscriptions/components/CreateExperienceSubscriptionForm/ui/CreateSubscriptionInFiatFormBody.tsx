import { Control, FieldErrors } from 'react-hook-form';
import { Grid } from '@rbx/ui';
import { Money } from '@rbx/clients/developerSubscriptionsApi';
import { CreateSubscriptionFormType } from '../../../constants/CreateSubscriptionRegisterConstants';
import CreateSubscriptionImageUploader from './CreateSubscriptionImageUploader';
import CreateSubscriptionFiatNameInput from './CreateSubscriptionFiatNameInput';
import CreateSubscriptionPeriodSelect from './CreateSubscriptionPeriodSelect';
import CreateSubscriptionPriceSelect from './CreateSubscriptionPriceSelect';
import CreateSubscriptionFiatDescriptionInput from './CreateSubscriptionFiatDescriptionInput';
import CreateSubscriptionRevShareDemoCard from './CreateSubscriptionRevShareDemoCard';
import CreateSubscriptionFiatProductTypeSelect from './CreateSubscriptionFiatProductTypeSelect';

type TCreateSubscriptionInFiatFormBodyProps = {
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
};

function CreateSubscriptionInFiatFormBody({
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
}: TCreateSubscriptionInFiatFormBodyProps) {
  return (
    <Grid container item direction='row' classes={{ root: inputFormPadding }}>
      <CreateSubscriptionImageUploader onChange={onFileChange} />
      <CreateSubscriptionFiatNameInput
        control={control}
        errors={errors}
        usedSubscriptionNames={usedSubscriptionNames}
      />
      <Grid item XSmall={12} Medium={12} XXLarge={8} Large={7} XLarge={8}>
        <Grid container item direction='row' classes={{ root: inputFormPadding }}>
          <CreateSubscriptionPeriodSelect control={control} errors={errors} />

          <CreateSubscriptionPriceSelect
            control={control}
            errors={errors}
            priceTierMap={priceTierMap}
            onPriceSelect={onPriceSelect}
          />

          {shouldFoldRevshareDemoInCreationForm && (
            <CreateSubscriptionRevShareDemoCard revshareCard={revshareCard}>
              {revshareStatDemo}
            </CreateSubscriptionRevShareDemoCard>
          )}

          <CreateSubscriptionFiatDescriptionInput control={control} errors={errors} />
        </Grid>
      </Grid>
      {!shouldFoldRevshareDemoInCreationForm && (
        <CreateSubscriptionRevShareDemoCard revshareCard={revshareCard}>
          {revshareStatDemo}
        </CreateSubscriptionRevShareDemoCard>
      )}
      <CreateSubscriptionFiatProductTypeSelect
        control={control}
        errors={errors}
        bottomGrid={bottomGrid}
      />
    </Grid>
  );
}

export default CreateSubscriptionInFiatFormBody;
