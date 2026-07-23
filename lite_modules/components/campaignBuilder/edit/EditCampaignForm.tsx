import { FormProvider, useForm } from 'react-hook-form';

import AudienceSection from '@components/campaignBuilder/common/AudienceSection';
import BudgetSection from '@components/campaignBuilder/common/BudgetSection';
import CreativeSection from '@components/campaignBuilder/common/creative/CreativeSection';
import ExperienceSection from '@components/campaignBuilder/common/ExperienceSection';
import ObjectiveSection from '@components/campaignBuilder/common/ObjectiveSection';
import OptimizationSection from '@components/campaignBuilder/common/OptimizationSection';
import EditCampaignFooter from '@components/campaignBuilder/edit/EditCampaignFooter';
import { AdvancedTargetingFormDefaults } from '@constants/advancedTargeting';
import type { FormType as AdvancedTargetingFormType } from '@hooks/campaignBuilder/advancedTargetingFormSchema';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import { useAdvancedTargetingFormValidation } from '@hooks/campaignBuilder/useAdvancedTargetingFormValidation';
import { useCampaignFormDefaultValue } from '@hooks/campaignBuilder/useCampaignFormDefaultValue';
import { useFormValidation } from '@hooks/campaignBuilder/useFormValidation';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { FormatSimplifiedCampaignTargetingResponseJson } from '@utils/advancedTargeting';

// Tips for watching the changes in the form:
// 1. use `useWatch` to watch the changes in the form instead of `watch`
//    Since watch won't trigger re-render when the form state changes everytime
//    useWatch will trigger re-render when the form state changes, so you can trigger logic in useEffect dependencies

const EditCampaignForm = () => {
  // useCampaignBuilderStore
  const simplifiedCampaign = useCampaignBuilderStore((state) => state.simplifiedCampaign?.data);

  const methods = useForm<FormType>({
    defaultValues: useCampaignFormDefaultValue(),
    mode: 'onChange',
    resolver: useFormValidation(),
  });

  const advancedTargetingFormMethods = useForm<AdvancedTargetingFormType>({
    defaultValues: simplifiedCampaign
      ? FormatSimplifiedCampaignTargetingResponseJson(simplifiedCampaign)
      : AdvancedTargetingFormDefaults,
    mode: 'onChange',
    resolver: useAdvancedTargetingFormValidation(),
  });

  return (
    <FormProvider {...methods}>
      <ExperienceSection advancedTargetingFormMethods={advancedTargetingFormMethods} />
      <ObjectiveSection />
      <AudienceSection advancedTargetingFormMethods={advancedTargetingFormMethods} />
      <BudgetSection />
      <OptimizationSection />
      <CreativeSection />
      <EditCampaignFooter />
    </FormProvider>
  );
};

export default EditCampaignForm;
