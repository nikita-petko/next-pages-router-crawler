import { Button } from '@rbx/foundation-ui';
import { Alert, TextField, Tooltip } from '@rbx/ui';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useFormContext, UseFormReturn, useWatch } from 'react-hook-form';

import { EventName, logNativeImpressionEvent } from '@clients/unifiedLogger';
import AdvancedJoinOptionsDrawer from '@components/campaignBuilder/common/AdvancedJoinOptionsDrawer';
import useCampaignBuilderCommonStyles from '@components/campaignBuilder/common/CampaignBuilderCommon.styles';
import ExperienceSelect from '@components/campaignBuilder/common/ExperienceSelect';
import FormAccordion from '@components/campaignBuilder/common/FormAccordion';
import useFormLayoutStyles from '@components/campaignBuilder/common/FormLayout.styles';
import { applyObjectiveChange } from '@components/campaignBuilder/common/objectiveHelpers';
import { defaultTimeZone } from '@constants/app';
import {
  DefaultServerCampaignObjectiveType,
  ServerCampaignObjectiveType,
  ServerPaymentType,
} from '@constants/campaign';
import {
  AllDetailedTargetingMatchTypes,
  CONTINUOUS_VALUE,
  DEFAULT_RECOMMENDATION_RESPONSE,
  experienceNotFoundOption,
  FlowTypes,
  FORM_HELPER_TEXT_PROPS,
  FormField,
  INPUT_LABEL_PROPS,
  noExperiencesOption,
  SERVER_CONTINUOUS_VALUE,
  warningUniverseId,
} from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType as AdvancedTargetingFormType } from '@hooks/campaignBuilder/advancedTargetingFormSchema';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import { useCampaignNameGeneration } from '@hooks/campaignBuilder/useCampaignNameGeneration';
import useNeedsPaymentSetup from '@hooks/campaignBuilder/useNeedsPaymentSetup';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { getCampaignRecommendation } from '@services/ads/campaignBuilderService';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { usePaymentStore } from '@stores/paymentStoreProvider';
import {
  BudgetOptionType,
  GetRecommendationResponse,
  SimplifiedCampaignType,
} from '@type/campaignBuilder';
import { EligibilityStatus } from '@type/eligibility';
import { ResetForm as ResetAdvancedTargetingForm } from '@utils/advancedTargeting';
import {
  GetEditCampaignDisabledTooltipText,
  IsEditCampaignDisabled,
  ResetFormRecommendations,
} from '@utils/campaignBuilder';
import { MicroUsdToUsd } from '@utils/currency';
import { SelectObjectiveEligibilityForUniverse } from '@utils/eligibility';
import { GetTimezoneObjFromEnum, GetValidatedTimezoneDbName } from '@utils/timezone';

interface ExperienceSectionProps {
  advancedTargetingFormMethods: UseFormReturn<AdvancedTargetingFormType>;
}

const ExperienceSection = ({ advancedTargetingFormMethods }: ExperienceSectionProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { clearErrors, control, getValues, setValue, trigger } = useFormContext<FormType>();
  const { fetchInitialAudienceEstimates, flowType, getAudienceEstimate, getEligibility } =
    useCampaignBuilderStore();
  const editMode = flowType === FlowTypes.EDIT;
  const cloneMode = flowType === FlowTypes.CLONE;
  const createMode = flowType === FlowTypes.CREATE;

  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(createMode);
  const campaignStatus = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.display_status,
  );
  const { data: universes, isLoading: fetchUniversesCanAdvertiseIsLoading } =
    useCampaignBuilderStore((state) => state.universesCanAdvertise);
  const { prefilledCampaignFields } = useCampaignBuilderStore();
  const overridePrefill = useRef<boolean>(false);
  const lastDefaultedGoalUniverseIdRef = useRef<number | undefined>(undefined);
  const isUniverseOwnershipBypassEnabled =
    useAppStore.getState().appMetadataState?.data?.isUniverseOwnershipBypassEnabled ?? false;
  const isAdAccountAutoCreateEnabled =
    useAppStore.getState().appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false;
  const isGaasEnabled = useAppStore((state) => state.appMetadataState.data?.isGaasEnabled ?? false);
  const isMaxReachEnabled = useAppStore(
    (state) => state.appMetadataState.data?.isMaxReachEnabled ?? false,
  );
  const isSpendObjectiveEnabled = useAppStore(
    (state) => state.appMetadataState.data?.isSpendObjectiveEnabled ?? false,
  );
  const isSpendOffPlatformOnly = isGaasEnabled && !isSpendObjectiveEnabled;
  const offPlatformRequestMinimumDaysFromStartDate = useAppStore(
    (state) => state.appMetadataState.data?.offPlatformRequestMinimumDaysFromStartDate ?? 0,
  );
  const offPlatformRequestMinimumDurationDays = useAppStore(
    (state) => state.appMetadataState.data?.offPlatformRequestMinimumDurationDays ?? 0,
  );
  const offPlatformRequestMinimumLifetimeBudgetMicroUsd = useAppStore(
    (state) => state.appMetadataState.data?.offPlatformRequestMinimumLifetimeBudgetMicroUsd ?? 0,
  );
  const needsAccountSetup = useNeedsPaymentSetup();
  const eligibilityContext = useCampaignBuilderStore((state) => state.eligibilityContext);
  const { setAdvancedJoinDrawerOpen } = useCampaignBuilderStore();

  useEffect(() => {
    if (universes) {
      if (!fetchUniversesCanAdvertiseIsLoading && universes.length === 0) {
        setValue(FormField.EXPERIENCE, {
          ...noExperiencesOption,
          universe_name: translate(noExperiencesOption.universe_name),
        });
      } else if (editMode || cloneMode) {
        const currentUniverseId = getValues(FormField.EXPERIENCE)?.universe_id;
        const existingUniverse = universes.find(
          ({ universe_id }) => universe_id === currentUniverseId,
        );
        if (!existingUniverse) {
          if (!isUniverseOwnershipBypassEnabled || !currentUniverseId) {
            setValue(FormField.EXPERIENCE, {
              ...experienceNotFoundOption,
              universe_name: translate(experienceNotFoundOption.universe_name),
            });
            logNativeImpressionEvent(EventName.ExperienceNoLongerEligible);
          }
        } else {
          setValue(FormField.EXPERIENCE, existingUniverse);
          fetchInitialAudienceEstimates({
            detailedTargetingMatchTypes: AllDetailedTargetingMatchTypes,
            universeId: existingUniverse.universe_id,
          });
          ResetAdvancedTargetingForm({
            getAudienceEstimate,
            getValues: advancedTargetingFormMethods.getValues,
            reset: advancedTargetingFormMethods.reset,
            setValue: advancedTargetingFormMethods.setValue,
            trigger: advancedTargetingFormMethods.trigger,
            universe: existingUniverse,
          });
        }
        // TODO: ADS-7785 intelligently select the default Universe
      } else if (universes.length > 0) {
        let selectedUniverse = universes[0];
        if (prefilledCampaignFields?.target_universe_id) {
          const prefillUniverse = universes.find(
            (universe) => universe.universe_id === prefilledCampaignFields.target_universe_id,
          );
          if (prefillUniverse) {
            selectedUniverse = prefillUniverse;
          }
        }
        setValue(FormField.EXPERIENCE, selectedUniverse);

        fetchInitialAudienceEstimates({
          detailedTargetingMatchTypes: AllDetailedTargetingMatchTypes,
          universeId: selectedUniverse.universe_id,
        });
        ResetAdvancedTargetingForm({
          getAudienceEstimate,
          getValues: advancedTargetingFormMethods.getValues,
          reset: advancedTargetingFormMethods.reset,
          setValue: advancedTargetingFormMethods.setValue,
          trigger: advancedTargetingFormMethods.trigger,
          universe: selectedUniverse,
        });
      }
    }
  }, [
    cloneMode,
    editMode,
    fetchUniversesCanAdvertiseIsLoading,
    getValues,
    isUniverseOwnershipBypassEnabled,
    universes,
    setValue,
    advancedTargetingFormMethods,
    getAudienceEstimate,
    fetchInitialAudienceEstimates,
    prefilledCampaignFields?.target_universe_id,
    translate,
  ]);

  const adCreditBalance = useAppStore(
    (state) => state.adCreditState.data?.ad_credit_balance_in_micro,
  );
  const adCreditActivated = useAppStore((state) => state.adCreditState.data?.is_account_activated);
  const hasCreditCard = usePaymentStore((state) => (state.paymentProfiles?.data || []).length > 0);
  const paymentFailure = useAppStore((state) => state.appData?.paymentFailure);
  const hasValidCreditCard = hasCreditCard && !paymentFailure;
  const isInternal = useAppStore((state) => state.adAccountIsInternalManaged());
  const isManaged = useAppStore((state) => state.adAccountIsExternalManaged());
  const { setRecommendation } = useCampaignBuilderStore();
  const {
    formState: { dirtyFields },
  } = useFormContext<FormType>();
  const universeFilter = useWatch<FormType, typeof FormField.EXPERIENCE>({
    name: FormField.EXPERIENCE,
  });
  const { universe_name: universeName } = universeFilter;
  const campaignName = useWatch<FormType, typeof FormField.CAMPAIGN_NAME>({
    name: FormField.CAMPAIGN_NAME,
  });
  const { timezoneDbName: rawTimezoneDbName } = useAppStore((state) =>
    GetTimezoneObjFromEnum(
      state.advertiserState?.data?.organization?.time_zone || defaultTimeZone.value,
    ),
  );
  const timezoneDbName = GetValidatedTimezoneDbName(rawTimezoneDbName);
  useCampaignNameGeneration({
    createMode,
    dirtyFields,
    setValue,
    timezoneDbName,
    universeName,
  });

  const isExtendToOffPlatformEnabled = useWatch<
    FormType,
    typeof FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED
  >({
    name: FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED,
  });
  const startTime = useWatch<FormType, typeof FormField.START_TIME>({
    name: FormField.START_TIME,
  });
  const shouldShowInvoice = isInternal || isManaged;
  const { universe_id: universeId } = universeFilter || {};
  const detailedTargetingMatchType = useWatch<
    FormType,
    typeof FormField.DETAILED_TARGETING_MATCH_TYPE
  >({
    name: FormField.DETAILED_TARGETING_MATCH_TYPE,
  });

  useEffect(() => {
    getEligibility(universeId);
  }, [getEligibility, universeId]);

  const { data: recommendation } = useQuery({
    enabled: !!universeId,
    queryFn: async () => {
      try {
        return await getCampaignRecommendation(universeId);
      } catch {
        return DEFAULT_RECOMMENDATION_RESPONSE;
      }
    },
    queryKey: ['campaignRecommendation', universeId],
    select: (data): GetRecommendationResponse => {
      if (data?.duration_options_in_days) {
        return {
          ...data,
          duration_options_in_days: data.duration_options_in_days.map((option) => {
            if (option.value === SERVER_CONTINUOUS_VALUE) {
              return { ...option, value: CONTINUOUS_VALUE };
            }
            return option;
          }),
        };
      }
      return data;
    },
  });

  // Stable wrapper so the goal-defaulting effect doesn't need to list every
  // applyObjectiveChange dependency in its own deps array.
  const callApplyObjectiveChange = useCallback(
    (nextObjective: ServerCampaignObjectiveType) => {
      applyObjectiveChange({
        detailedTargetingMatchType,
        hasPaymentProfile: hasCreditCard,
        isAdAccountAutoCreateEnabled,
        isSpendOffPlatformOnly,
        needsAccountSetup,
        nextObjective,
        offPlatformRequestMinimumDaysFromStartDate,
        offPlatformRequestMinimumDurationDays,
        offPlatformRequestMinimumLifetimeBudgetMicroUsd,
        recommendation,
        setValue,
        shouldShowCreditCard: hasValidCreditCard,
        shouldShowInvoice,
        startTime,
        trigger,
      });
    },
    [
      detailedTargetingMatchType,
      hasCreditCard,
      hasValidCreditCard,
      isAdAccountAutoCreateEnabled,
      isSpendOffPlatformOnly,
      needsAccountSetup,
      offPlatformRequestMinimumDaysFromStartDate,
      offPlatformRequestMinimumDurationDays,
      offPlatformRequestMinimumLifetimeBudgetMicroUsd,
      recommendation,
      setValue,
      shouldShowInvoice,
      startTime,
      trigger,
    ],
  );

  // Auto-default GOAL once per universe (guarded by `lastDefaultedGoalUniverseIdRef`) the
  // moment eligibility lands. Three cases:
  //   1. (create only) Consume prefilled objective on the very first run.
  //   2. (create + clone) Current goal is ineligible for the new universe → fall back.
  //      Create may auto-promote to EP if eligible; clone always falls back to Plays to
  //      preserve the user's cloned intent.
  //   3. (create only) Goal is the default (Plays) and EP is eligible → promote to EP.
  useEffect(() => {
    if (editMode) {
      return;
    }
    if (!universeId) {
      return;
    }
    const objectiveEligibility = SelectObjectiveEligibilityForUniverse(
      eligibilityContext,
      universeId,
    );
    if (!objectiveEligibility) {
      return;
    }
    if (lastDefaultedGoalUniverseIdRef.current === universeId) {
      return;
    }
    const isFirstDefaulting = lastDefaultedGoalUniverseIdRef.current === undefined;
    lastDefaultedGoalUniverseIdRef.current = universeId;

    const isEligible = (type: ServerCampaignObjectiveType) =>
      objectiveEligibility[type] !== EligibilityStatus.NOT_ELIGIBLE;
    const isEpEligible = isEligible(ServerCampaignObjectiveType.ENGAGED_PLAYS);

    if (createMode && isFirstDefaulting && prefilledCampaignFields?.objective) {
      setValue(FormField.GOAL, prefilledCampaignFields.objective);
      return;
    }

    const currentGoal = getValues(FormField.GOAL);
    const isCurrentGoalAvailable =
      isEligible(currentGoal) ||
      (currentGoal === ServerCampaignObjectiveType.SPEND && isGaasEnabled) ||
      (currentGoal === ServerCampaignObjectiveType.REACH && isMaxReachEnabled);

    if (!isCurrentGoalAvailable) {
      const newGoal =
        createMode && isEpEligible
          ? ServerCampaignObjectiveType.ENGAGED_PLAYS
          : DefaultServerCampaignObjectiveType;
      clearErrors(FormField.GOAL);
      setValue(FormField.GOAL, newGoal);
      // applyObjectiveChange re-runs ResetFormRecommendations with the new objective and
      // clears any REACH/SPEND-scoped form state left over from the prior selection,
      // matching the user-click path in ObjectiveSection.
      callApplyObjectiveChange(newGoal);
    } else if (createMode && currentGoal === DefaultServerCampaignObjectiveType && isEpEligible) {
      setValue(FormField.GOAL, ServerCampaignObjectiveType.ENGAGED_PLAYS);
      callApplyObjectiveChange(ServerCampaignObjectiveType.ENGAGED_PLAYS);
    }
  }, [
    callApplyObjectiveChange,
    clearErrors,
    createMode,
    editMode,
    eligibilityContext,
    getValues,
    isGaasEnabled,
    isMaxReachEnabled,
    prefilledCampaignFields?.objective,
    setValue,
    universeId,
  ]);

  const getCampaignNameTooltipText = () => {
    const editCampaignDisabledTooltip = GetEditCampaignDisabledTooltipText(
      flowType,
      campaignStatus,
    );
    if (editCampaignDisabledTooltip) {
      return translate(editCampaignDisabledTooltip);
    }
    return '';
  };

  useEffect(() => {
    if (!recommendation) {
      return;
    }
    logNativeImpressionEvent(EventName.RecommendationDataFetched, {
      budgetOptions: JSON.stringify(recommendation.budget_options_by_audience_in_micro_usd),
      durationOptions: JSON.stringify(recommendation.duration_options_in_days),
      flowType,
    });

    // Use audience-based budget options
    const budgetOptions: BudgetOptionType[] =
      recommendation?.budget_options_by_audience_in_micro_usd?.[detailedTargetingMatchType] || [];

    // Reset the default values for the form fields once user change universe
    if (createMode) {
      let prefillBudgetDuration: Partial<SimplifiedCampaignType> | undefined;
      if (!overridePrefill.current) {
        if (
          prefilledCampaignFields?.budget_in_micro_usd ||
          prefilledCampaignFields?.duration_in_days
        ) {
          prefillBudgetDuration = prefilledCampaignFields;
        }
        overridePrefill.current = true;
      }
      const { recommendedBudget, recommendedDuration } = ResetFormRecommendations({
        detailedTargetingMatchType,
        isAdAccountAutoCreateEnabled,
        isExtendToOffPlatformEnabled,
        objective: getValues(FormField.GOAL),
        prefillValues: prefillBudgetDuration,
        recommendation,
        setValue,
      });
      // Log an event if user has insufficient balance
      if (
        recommendedBudget &&
        recommendedDuration &&
        adCreditActivated &&
        adCreditBalance !== undefined &&
        adCreditBalance < recommendedBudget &&
        !isInternal &&
        !isManaged
      ) {
        if (hasValidCreditCard) {
          setValue(FormField.PAYMENT_TYPE, ServerPaymentType.PAYMENT_TYPE_CARD);
        }
        logNativeImpressionEvent(EventName.RecommendedInvalidBudget, {
          adCreditBalance: adCreditBalance.toString(),
          hasCreditCard: hasValidCreditCard.toString(),
          recommendedBudget: recommendedBudget.toString(),
          recommendedDuration: recommendedDuration.toString(),
        });
      }
    } else if (cloneMode) {
      // if in clone mode, check if recommendations match the budget/duration of
      // the original campaign
      const isBudgetRecommended = budgetOptions.find(
        ({ value }) => MicroUsdToUsd(value) === getValues(FormField.BUDGET),
      );
      const isDurationRecommended = recommendation.duration_options_in_days.find(
        ({ value }) => value === getValues(FormField.DURATION),
      );
      setValue(FormField.CUSTOM_BUDGET, !isBudgetRecommended);
      setValue(
        FormField.CUSTOM_DURATION,
        !isDurationRecommended && getValues(FormField.DURATION) !== CONTINUOUS_VALUE,
      );
    }
    setRecommendation(recommendation);
    setTimeout(() => trigger(), 10); // the timeout is to ensure the form is revalidated after setting the recommendation
    // eslint-disable-next-line react-hooks/exhaustive-deps -- adCreditActivated and adCreditBalance are just used for the log and shouldn't trigger this
  }, [
    recommendation,
    setValue,
    setRecommendation,
    createMode,
    trigger,
    flowType,
    cloneMode,
    getValues,
  ]);

  const placeIdOverride = useWatch<FormType, typeof FormField.PLACE_ID_OVERRIDE>({
    name: FormField.PLACE_ID_OVERRIDE,
  });
  const launchDataValue = useWatch<FormType, typeof FormField.LAUNCH_DATA>({
    name: FormField.LAUNCH_DATA,
  });
  const hasAdvancedJoinSettings = !!placeIdOverride || !!launchDataValue;
  const [isAdvancedJoinAlertDismissed, setIsAdvancedJoinAlertDismissed] = useState<boolean>(false);

  const {
    classes: { spacedWarning },
  } = useCampaignBuilderCommonStyles();
  const {
    classes: { inlineAction, inlineRow, inlineSelector, inlineSelectorContainer },
  } = useFormLayoutStyles();

  return (
    <FormAccordion
      banner={
        hasAdvancedJoinSettings &&
        !isAdvancedJoinAlertDismissed && (
          <Alert
            data-testid='advanced-join-enabled-alert'
            onClose={() => setIsAdvancedJoinAlertDismissed(true)}
            severity='info'
            sx={{ marginY: 2 }}
            variant='outlined'>
            {translate('Message.AdvancedJoinEnabled')}
          </Alert>
        )
      }
      description={
        campaignName
          ? `${universeFilter.universe_name} | ${campaignName}`
          : universeFilter.universe_name
      }
      hasError={universeFilter.universe_id === warningUniverseId}
      isOpen={isAccordionOpen}
      onChange={setIsAccordionOpen}
      title={translate('Heading.Experience')}>
      <div className={inlineSelectorContainer}>
        <div className={inlineSelector}>
          <ExperienceSelect advancedTargetingFormMethods={advancedTargetingFormMethods} />
        </div>
        <Button
          className={inlineAction}
          data-testid='advanced-join-options-button'
          onClick={() => setAdvancedJoinDrawerOpen(true)}
          size='Medium'
          variant='Utility'>
          {translate('Action.AdvancedOptions')}
        </Button>
      </div>
      <Controller
        control={control}
        name={FormField.CAMPAIGN_NAME}
        render={({ field, fieldState: { error } }) => (
          <Tooltip placement='top-start' title={getCampaignNameTooltipText()}>
            <div className={`text-body-large ${inlineRow}`}>
              <TextField
                data-testid='campaign-name-input'
                {...field}
                disabled={!!IsEditCampaignDisabled(flowType, campaignStatus)}
                error={!!error}
                FormHelperTextProps={FORM_HELPER_TEXT_PROPS}
                fullWidth
                helperText={error?.message}
                id='campaignName'
                InputLabelProps={INPUT_LABEL_PROPS}
                label={translate('Label.CampaignName')}
                size='medium'
              />
            </div>
          </Tooltip>
        )}
      />
      <AdvancedJoinOptionsDrawer />
      {!universes.length && (
        <span className={`text-body-medium content-system-warning ${spacedWarning}`}>
          {translate('Description.CreateEligibleExperience')}
        </span>
      )}
      {universes.length > 0 &&
        universeFilter.universe_id === warningUniverseId &&
        universeFilter.universe_name === translate(experienceNotFoundOption.universe_name) && (
          <span className={`text-body-medium content-system-warning ${spacedWarning}`}>
            {translate('Description.ExperienceNoLongerEligible')}
          </span>
        )}
    </FormAccordion>
  );
};

export default ExperienceSection;
