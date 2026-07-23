import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { EventName, logNativeImpressionEvent } from '@clients/unifiedLogger';
import AudienceSection from '@components/campaignBuilder/common/AudienceSection';
import BudgetSection from '@components/campaignBuilder/common/BudgetSection';
import CreativeSection from '@components/campaignBuilder/common/creative/CreativeSection';
import ExperienceSection from '@components/campaignBuilder/common/ExperienceSection';
import ObjectiveSection from '@components/campaignBuilder/common/ObjectiveSection';
import OptimizationSection from '@components/campaignBuilder/common/OptimizationSection';
import CreateCampaignFooter from '@components/campaignBuilder/create/CreateCampaignFooter';
import { ServerAdType } from '@constants/ad';
import { ServerAdSetBrandSuitabilityType } from '@constants/adSet';
import {
  AdvancedTargetingFormDefaults,
  FormField as AdvancedTargetingFormField,
} from '@constants/advancedTargeting';
import { DefaultServerDetailedTargetingMatchType } from '@constants/campaign';
import { FlowTypes, FormField } from '@constants/campaignBuilder';
import type { FormType as AdvancedTargetingFormType } from '@hooks/campaignBuilder/advancedTargetingFormSchema';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import { useAdvancedTargetingFormValidation } from '@hooks/campaignBuilder/useAdvancedTargetingFormValidation';
import { useCampaignFormDefaultValue } from '@hooks/campaignBuilder/useCampaignFormDefaultValue';
import { useFormValidation } from '@hooks/campaignBuilder/useFormValidation';
import { useAiCreateSessionStore } from '@stores/aiCreateSessionStoreProvider';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import {
  FormatSimplifiedCampaignTargetingResponseJson,
  FormatTargetingCriteriaRequestJson,
} from '@utils/advancedTargeting';
import { IsAdvancedTargetingAllowed } from '@utils/campaignBuilder';
import { IncludesEUCountry } from '@utils/locationAutocomplete';

// Tips for watching the changes in the form:
// 1. use `useWatch` to watch the changes in the form instead of `watch`
//    Since watch won't trigger re-render when the form state changes everytime
//    useWatch will trigger re-render when the form state changes, so you can trigger logic in useEffect dependencies

const CreateCampaignForm = () => {
  // useCampaignBuilderStore
  const flowType = useCampaignBuilderStore((state) => state.flowType);
  const initialCampaign = useCampaignBuilderStore((state) => state.simplifiedCampaign?.data);
  const getAudienceEstimate = useCampaignBuilderStore((state) => state.getAudienceEstimate);

  const setCalloutBanners = useCampaignBuilderStore((state) => state.setCalloutBanners);
  const setDetailedTargetingMatchType = useCampaignBuilderStore(
    (state) => state.setDetailedTargetingMatchType,
  );
  const resetAiCreateCampaignScope = useAiCreateSessionStore(
    (state) => state.resetAiCreateCampaignScope,
  );

  const defaultValues = useCampaignFormDefaultValue();
  const methods = useForm<FormType>({
    defaultValues,
    mode: 'onChange',
    resolver: useFormValidation(),
  });

  const { errors, isDirty, isValid } = methods.formState;

  // Scope persisted AI-generated creatives to a single create-campaign session.
  // Entering the flow starts clean, and leaving/publishing clears any leftovers.
  useEffect(() => {
    resetAiCreateCampaignScope();
    return () => {
      resetAiCreateCampaignScope();
    };
  }, [resetAiCreateCampaignScope]);

  // Initialize store with form's default audience selection
  useEffect(() => {
    const initialDetailedTargetingMatchType =
      defaultValues[FormField.DETAILED_TARGETING_MATCH_TYPE] ??
      DefaultServerDetailedTargetingMatchType;
    setDetailedTargetingMatchType(initialDetailedTargetingMatchType);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isValid) {
      logNativeImpressionEvent(EventName.CampaignBuilderFormValidationError, {
        errors: JSON.stringify(errors),
        flowType,
        isDirty: isDirty.toString(),
      });
    }
  }, [errors, flowType]); // eslint-disable-line react-hooks/exhaustive-deps

  const experience = methods.getValues(FormField.EXPERIENCE);
  const advancedTargetingFormMethods = useForm<AdvancedTargetingFormType>({
    defaultValues: {
      ...AdvancedTargetingFormDefaults,
      [AdvancedTargetingFormField.UNIVERSE]:
        experience && experience.universe_id ? experience : undefined,
    },
    mode: 'onChange',
    resolver: useAdvancedTargetingFormValidation(),
  });

  const EURegionCodeList = useAppStore((state) => state.appMetadataState?.data?.EURegionCodeList);

  const cloneMode = flowType === FlowTypes.CLONE;

  useEffect(() => {
    setCalloutBanners([]);
    if (cloneMode && initialCampaign) {
      // Don't set advanced targeting values as defaultValues, otherwise reset form will not work correctly
      const targeting = FormatSimplifiedCampaignTargetingResponseJson(initialCampaign);
      Object.values(AdvancedTargetingFormField).forEach((advancedTargetingFormField) => {
        if (targeting[advancedTargetingFormField] !== undefined) {
          if (advancedTargetingFormField === AdvancedTargetingFormField.LOCATIONS) {
            const locations = targeting[advancedTargetingFormField];
            locations.includesEUCountry = IncludesEUCountry(locations, EURegionCodeList);
            advancedTargetingFormMethods.setValue(advancedTargetingFormField, locations);
          } else {
            advancedTargetingFormMethods.setValue(
              advancedTargetingFormField,
              targeting[advancedTargetingFormField],
            );
          }
        }
      });
      advancedTargetingFormMethods.trigger();
      const objective = methods.getValues(FormField.GOAL);
      const isExtendToOffPlatformEnabled = methods.getValues(
        FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED,
      );
      if (IsAdvancedTargetingAllowed(objective, isExtendToOffPlatformEnabled)) {
        const requestPayload = {
          detailedTargetingMatchType: methods.getValues(FormField.DETAILED_TARGETING_MATCH_TYPE),
          request: {
            ad_type: [ServerAdType.SPONSORED_UNIVERSE],
            targeting_criteria: FormatTargetingCriteriaRequestJson(
              advancedTargetingFormMethods.getValues(),
            ),
            universe_suitability_filter:
              ServerAdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_UNSPECIFIED,
          },
          universeId: methods.getValues(FormField.EXPERIENCE).universe_id,
        };

        getAudienceEstimate(requestPayload);
      }
    }
  }, [
    advancedTargetingFormMethods,
    cloneMode,
    initialCampaign,
    EURegionCodeList,
    getAudienceEstimate,
    methods,
    setCalloutBanners,
  ]);

  return (
    <FormProvider {...methods}>
      <ExperienceSection advancedTargetingFormMethods={advancedTargetingFormMethods} />
      <ObjectiveSection />
      <AudienceSection advancedTargetingFormMethods={advancedTargetingFormMethods} />
      <BudgetSection />
      <OptimizationSection />
      <CreativeSection />
      <CreateCampaignFooter advancedTargetingFormMethods={advancedTargetingFormMethods} />
    </FormProvider>
  );
};

export default CreateCampaignForm;
