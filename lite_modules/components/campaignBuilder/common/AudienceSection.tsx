import { Badge, Button, Link, OptionSelector } from '@rbx/foundation-ui';
import { Alert, Tooltip } from '@rbx/ui';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Controller,
  FieldError,
  FormProvider,
  useFormContext,
  UseFormReturn,
  useWatch,
} from 'react-hook-form';

import useCampaignBuilderCommonStyles from '@components/campaignBuilder/common/CampaignBuilderCommon.styles';
import FormAccordion from '@components/campaignBuilder/common/FormAccordion';
import AdvancedTargetingAudienceEstimate from '@components/campaignBuilder/targeting/AdvancedTargetingAudienceEstimate';
import AdvancedTargetingDrawer from '@components/campaignBuilder/targeting/AdvancedTargetingDrawer';
import { FormField as AdvancedTargetingFormField } from '@constants/advancedTargeting';
import { ServerCampaignObjectiveType, ServerDetailedTargetingMatchType } from '@constants/campaign';
import { FlowTypes, FormField } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType as AdvancedTargetingFormType } from '@hooks/campaignBuilder/advancedTargetingFormSchema';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import {
  AwaitErrorsThenMaybeGetAudienceEstimate,
  HaveFormValuesChanged,
  ResetForm,
} from '@utils/advancedTargeting';
import {
  GetMinimumAudienceSize,
  GetWarningAudienceSize,
  IsAudienceSizeBelowThreshold,
} from '@utils/audienceEstimate';
import { ResetFormRecommendations } from '@utils/campaignBuilder';
import { GetAudienceLabelKey } from '@utils/campaignDetails';
import { CaptureException } from '@utils/error';

const audienceOptions: ServerDetailedTargetingMatchType[] = [
  ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_UNSPECIFIED,
  ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_ACQUIRE_NEW_USERS,
  ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_RETENTION,
  ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_REACTIVATION,
];

const getAudienceDescriptionKey = (type: ServerDetailedTargetingMatchType) => {
  switch (type) {
    case ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_UNSPECIFIED:
      return 'Description.AllPlayersAudience';
    case ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_REACTIVATION:
      return 'Description.LapsedPlayersAudience';
    case ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_RETENTION:
      return 'Description.RecentPlayersAudience';
    case ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_ACQUIRE_NEW_USERS:
      return 'Description.NewPlayersAudience';
    default:
      CaptureException(new Error(`invalid ServerDetailTargetingMatchType provided: ${type}`));
      return '';
  }
};

const AUDIENCE_TARGETING_POLICY_URL =
  'https://en.help.roblox.com/hc/en-us/articles/13722260778260-Advertising-Standards';

interface AudienceSectionProps {
  advancedTargetingFormMethods: UseFormReturn<AdvancedTargetingFormType>;
}

const AudienceSection = ({ advancedTargetingFormMethods }: AudienceSectionProps) => {
  const { translate, translateHTML } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { clearErrors, control, setError, setValue } = useFormContext<FormType>();
  const {
    classes: {
      advancedTargetingContainer,
      cardBanner,
      resetFilterButton,
      rightContentContainer,
      rightContentSubContainer,
      sectionCardBanner,
    },
  } = useCampaignBuilderCommonStyles();

  const getAudienceSubDescription = (type: ServerDetailedTargetingMatchType): ReactNode => {
    switch (type) {
      case ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_ACQUIRE_NEW_USERS:
      case ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_RETENTION:
      case ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_REACTIVATION:
        return translateHTML('Description.AudienceTargetingPolicy', [
          {
            closing: 'linkEnd',
            content: (chunks) => (
              <Link
                href={AUDIENCE_TARGETING_POLICY_URL}
                isExternal={false}
                rel='noopener noreferrer'
                target='_blank'>
                {chunks}
              </Link>
            ),
            opening: 'linkStart',
          },
        ]);
      default:
        return '';
    }
  };

  const flowType = useCampaignBuilderStore((state) => state.flowType);
  const recommendation = useCampaignBuilderStore((state) => state.recommendation);
  const createMode = flowType === FlowTypes.CREATE;
  const editMode = flowType === FlowTypes.EDIT;
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(createMode);
  const isResettingRef = useRef<boolean>(false);

  const handleAccordionChange = useCallback((isOpen: boolean) => {
    if (!isResettingRef.current) {
      setIsAccordionOpen(isOpen);
    }
  }, []);

  const setAdvancedTargetingDrawerOpen = useCampaignBuilderStore(
    (state) => state.setAdvancedTargetingDrawerOpen,
  );
  const setDetailedTargetingMatchType = useCampaignBuilderStore(
    (state) => state.setDetailedTargetingMatchType,
  );
  const detailedTargetingMatchType = useWatch<FormType>({
    name: FormField.DETAILED_TARGETING_MATCH_TYPE,
  });
  const goal = useWatch<FormType, typeof FormField.GOAL>({
    name: FormField.GOAL,
  });
  const isExtendToOffPlatformEnabled = useWatch<
    FormType,
    typeof FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED
  >({
    name: FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED,
  });
  const advancedTargetingErrors = advancedTargetingFormMethods.formState.errors;

  const audienceEstimationContext = useCampaignBuilderStore(
    (state) => state.audienceEstimationContext,
  );
  const { getAudienceEstimate } = useCampaignBuilderStore();

  const {
    reactivationObjectiveMinimumAudienceSize,
    reactivationObjectiveWarningAudienceSize,
    retargetingObjectiveMinimumAudienceSize,
    retargetingObjectiveWarningAudienceSize,
    retentionObjectiveMinimumAudienceSize,
    retentionObjectiveWarningAudienceSize,
  } = useAppStore((state) => ({
    reactivationObjectiveMinimumAudienceSize:
      state.appMetadataState?.data?.reactivationObjectiveMinimumAudienceSize,
    reactivationObjectiveWarningAudienceSize:
      state.appMetadataState?.data?.reactivationObjectiveWarningAudienceSize,
    retargetingObjectiveMinimumAudienceSize:
      state.appMetadataState?.data?.retargetingObjectiveMinimumAudienceSize,
    retargetingObjectiveWarningAudienceSize:
      state.appMetadataState?.data?.retargetingObjectiveWarningAudienceSize,
    retentionObjectiveMinimumAudienceSize:
      state.appMetadataState?.data?.retentionObjectiveMinimumAudienceSize,
    retentionObjectiveWarningAudienceSize:
      state.appMetadataState?.data?.retentionObjectiveWarningAudienceSize,
  }));

  const isAdAccountAutoCreateEnabled = useAppStore(
    (state) => state.appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false,
  );

  const audienceSizeConfig = useMemo(
    () => ({
      reactivationObjectiveMinimumAudienceSize,
      reactivationObjectiveWarningAudienceSize,
      retargetingObjectiveMinimumAudienceSize,
      retargetingObjectiveWarningAudienceSize,
      retentionObjectiveMinimumAudienceSize,
      retentionObjectiveWarningAudienceSize,
    }),
    [
      reactivationObjectiveMinimumAudienceSize,
      retentionObjectiveMinimumAudienceSize,
      retargetingObjectiveMinimumAudienceSize,
      reactivationObjectiveWarningAudienceSize,
      retentionObjectiveWarningAudienceSize,
      retargetingObjectiveWarningAudienceSize,
    ],
  );

  const getMinimumAudienceSize = useCallback(
    (audience: ServerDetailedTargetingMatchType) =>
      GetMinimumAudienceSize(audience, audienceSizeConfig),
    [audienceSizeConfig],
  );

  const getWarningAudienceSize = useCallback(
    (audience: ServerDetailedTargetingMatchType) =>
      GetWarningAudienceSize(audience, audienceSizeConfig),
    [audienceSizeConfig],
  );

  const {
    getValues: advancedTargetingGetValues,
    reset: advancedTargetingReset,
    setValue: advancedTargetingSetValue,
    trigger: advancedTargetingTrigger,
  } = advancedTargetingFormMethods;

  const showAdvancedTargetingWarning = editMode
    ? false
    : HaveFormValuesChanged(advancedTargetingGetValues);

  const showAdvancedTargetingError = useMemo(() => {
    if (editMode) {
      return false;
    }
    return Object.keys(advancedTargetingErrors).length > 0;
  }, [editMode, advancedTargetingErrors]);

  const showAudienceWarning = useMemo(() => {
    if (editMode) {
      return false;
    }
    const estimates = audienceEstimationContext?.estimates;
    const currentEstimate = estimates ? estimates[detailedTargetingMatchType] : undefined;
    const warningAudienceSize = getWarningAudienceSize(detailedTargetingMatchType);
    return IsAudienceSizeBelowThreshold({
      detailedTargetingMatchType,
      estimate: currentEstimate,
      lowerBound: warningAudienceSize,
    });
  }, [editMode, audienceEstimationContext, detailedTargetingMatchType, getWarningAudienceSize]);

  const isEngagedPlays = goal === ServerCampaignObjectiveType.ENGAGED_PLAYS;

  const isAudienceDisabled = useCallback(
    (option: ServerDetailedTargetingMatchType) => {
      const estimates = audienceEstimationContext?.estimates;
      const optionEstimate = estimates ? estimates[option] : undefined;
      if (editMode) {
        return true;
      }
      if (isExtendToOffPlatformEnabled || isEngagedPlays) {
        return (
          option !== ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_UNSPECIFIED
        );
      }
      return IsAudienceSizeBelowThreshold({
        detailedTargetingMatchType: option,
        estimate: optionEstimate,
        lowerBound: getMinimumAudienceSize(option),
      });
    },
    [
      editMode,
      isExtendToOffPlatformEnabled,
      isEngagedPlays,
      getMinimumAudienceSize,
      audienceEstimationContext,
    ],
  );

  const advancedTargetingErrorBanner = useMemo(() => {
    const errorKeys = Object.keys(advancedTargetingErrors);
    const firstErrorKey = errorKeys[0] as keyof AdvancedTargetingFormType;
    const errorObject = advancedTargetingErrors[firstErrorKey] as FieldError | undefined;
    if (errorObject?.message) {
      return (
        <Alert className={sectionCardBanner} severity='error'>
          {errorObject.message}
        </Alert>
      );
    }
    return undefined;
  }, [advancedTargetingErrors, sectionCardBanner]);

  const advancedTargetingWarningBanner = useMemo(
    () => (
      <Alert
        className={cardBanner}
        data-testid='advanced-targeting-warning-banner'
        severity='warning'
        variant='outlined'>
        <span className='text-body-medium'>{translate('Description.ManualTargetingWarning')}</span>
        <Button
          className={resetFilterButton}
          data-testid='reset-filter-button'
          onClick={() => {
            isResettingRef.current = true;
            ResetForm({
              getAudienceEstimate,
              getValues: advancedTargetingGetValues,
              reset: advancedTargetingReset,
              setValue: advancedTargetingSetValue,
              trigger: advancedTargetingTrigger,
            }).finally(() => {
              isResettingRef.current = false;
            });
          }}
          size='Small'
          variant='Link'>
          {translate('Action.ResetFilter')}
        </Button>
      </Alert>
    ),
    [
      cardBanner,
      resetFilterButton,
      getAudienceEstimate,
      advancedTargetingGetValues,
      advancedTargetingReset,
      advancedTargetingSetValue,
      advancedTargetingTrigger,
      translate,
    ],
  );

  const audienceWarningBanner = useCallback(
    (audience: ServerDetailedTargetingMatchType) => (
      <Alert className={cardBanner} data-testid='audience-warning-banner' severity='warning'>
        {translate('Description.AudiencePerformanceWarning', {
          userCount: getWarningAudienceSize(audience).toString(),
        })}
      </Alert>
    ),
    [cardBanner, getWarningAudienceSize, translate],
  );

  const banner = useMemo(() => {
    if (showAdvancedTargetingError) {
      return advancedTargetingErrorBanner;
    }

    if (showAdvancedTargetingWarning) {
      return advancedTargetingWarningBanner;
    }

    if (showAudienceWarning) {
      return audienceWarningBanner(detailedTargetingMatchType);
    }
    return undefined;
  }, [
    showAdvancedTargetingError,
    showAdvancedTargetingWarning,
    showAudienceWarning,
    advancedTargetingErrorBanner,
    advancedTargetingWarningBanner,
    audienceWarningBanner,
    detailedTargetingMatchType,
  ]);

  const getAudienceDisabledTooltipText = (audience: ServerDetailedTargetingMatchType) => {
    if (isEngagedPlays) {
      return translate('Description.EngagedPlaysAllPlayers');
    }
    return isExtendToOffPlatformEnabled
      ? translate('Description.OffPlatformAllPlayers')
      : translate('Description.AudienceAvailableMinUsers', {
          minUsers: (getMinimumAudienceSize(audience) ?? 0).toString(),
        });
  };

  useEffect(() => {
    if (
      (goal === ServerCampaignObjectiveType.SPEND && isExtendToOffPlatformEnabled) ||
      isEngagedPlays
    ) {
      setValue(
        FormField.DETAILED_TARGETING_MATCH_TYPE,
        ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_UNSPECIFIED,
      );
      setDetailedTargetingMatchType(
        ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_UNSPECIFIED,
      );
      ResetForm({
        getAudienceEstimate,
        getValues: advancedTargetingGetValues,
        reset: advancedTargetingReset,
        setValue: advancedTargetingSetValue,
        trigger: advancedTargetingTrigger,
      });
    }
  }, [
    goal,
    setValue,
    setDetailedTargetingMatchType,
    getAudienceEstimate,
    isExtendToOffPlatformEnabled,
    isEngagedPlays,
    advancedTargetingGetValues,
    advancedTargetingReset,
    advancedTargetingSetValue,
    advancedTargetingTrigger,
  ]);

  useEffect(() => {
    if (editMode || isEngagedPlays) {
      return;
    }
    const estimates = audienceEstimationContext?.estimates;
    const currentEstimate = estimates ? estimates[detailedTargetingMatchType] : undefined;
    const minimumAudienceSize = getMinimumAudienceSize(detailedTargetingMatchType);
    const belowMinimum = IsAudienceSizeBelowThreshold({
      detailedTargetingMatchType,
      estimate: currentEstimate,
      lowerBound: minimumAudienceSize,
    });
    if (belowMinimum) {
      setError(FormField.DETAILED_TARGETING_MATCH_TYPE, {
        message: translate('Description.AudienceRequiresMinUsers', {
          minUsers: minimumAudienceSize.toString(),
        }),
        type: 'manual',
      });
    } else {
      clearErrors(FormField.DETAILED_TARGETING_MATCH_TYPE);
    }
  }, [
    audienceEstimationContext,
    editMode,
    isEngagedPlays,
    detailedTargetingMatchType,
    clearErrors,
    setError,
    getMinimumAudienceSize,
    getWarningAudienceSize,
    translate,
  ]);

  return (
    <Controller
      control={control}
      name={FormField.DETAILED_TARGETING_MATCH_TYPE}
      render={({ field: { onChange, value } }) => (
        <FormAccordion
          banner={banner}
          description={translate(GetAudienceLabelKey(value))}
          isOpen={isAccordionOpen}
          onChange={handleAccordionChange}
          rightContent={
            editMode ? undefined : (
              <div className={rightContentContainer}>
                <div className={rightContentSubContainer}>
                  <span className='text-heading-small'>
                    {translate(GetAudienceLabelKey(value))}
                  </span>
                  <FormProvider {...advancedTargetingFormMethods}>
                    <AdvancedTargetingAudienceEstimate isEstimateAvailable={!isEngagedPlays} />
                  </FormProvider>
                  <span className='text-body-large'>
                    {translate(getAudienceDescriptionKey(value))}
                  </span>
                </div>
                <div className={rightContentSubContainer}>
                  <span className='text-body-medium'>{getAudienceSubDescription(value)}</span>
                </div>
              </div>
            )
          }
          title={translate('Heading.Audience')}>
          <div className='flex flex-col gap-medium width-full'>
            {audienceOptions.map((option) => {
              const tooltipText = getAudienceDisabledTooltipText(option);
              const isRecommended =
                option ===
                ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_UNSPECIFIED;
              const optionSelector = (
                <OptionSelector
                  isDisabled={isAudienceDisabled(option)}
                  isSelected={value === option}
                  label={
                    <span className='inline-flex items-center gap-small text-title-medium'>
                      {translate(GetAudienceLabelKey(option))}
                      {isRecommended && <Badge label={translate('Label.Recommended')} />}
                    </span>
                  }
                  layout='Horizontal'
                  onSelect={() => {
                    onChange(option);
                    setDetailedTargetingMatchType(option);
                    AwaitErrorsThenMaybeGetAudienceEstimate({
                      formField: AdvancedTargetingFormField.UNIVERSE,
                      getAudienceEstimate,
                      getValues: advancedTargetingFormMethods.getValues,
                      trigger: advancedTargetingFormMethods.trigger,
                    });
                    ResetFormRecommendations({
                      detailedTargetingMatchType: option,
                      isAdAccountAutoCreateEnabled,
                      isExtendToOffPlatformEnabled: isExtendToOffPlatformEnabled ?? false,
                      objective: goal ?? ServerCampaignObjectiveType.VISITS,
                      recommendation,
                      setValue,
                    });
                  }}
                  size='Small'
                  type='Checkmark'
                />
              );

              return (
                <div data-testid={`audience-option-${option}`} key={option}>
                  {isAudienceDisabled(option) && tooltipText ? (
                    <Tooltip placement='top-start' title={tooltipText}>
                      <span>{optionSelector}</span>
                    </Tooltip>
                  ) : (
                    optionSelector
                  )}
                </div>
              );
            })}
          </div>
          <div className={advancedTargetingContainer}>
            <span className='text-body-large content-default'>
              {translate('Label.AdvancedTargetingOptional')}
            </span>
            <Button
              isDisabled={isExtendToOffPlatformEnabled || isEngagedPlays}
              onClick={() => setAdvancedTargetingDrawerOpen(true)}
              size='Medium'
              variant='Utility'>
              {translateMisc('Action.Edit')}
            </Button>
            <FormProvider {...advancedTargetingFormMethods}>
              <AdvancedTargetingDrawer />
            </FormProvider>
          </div>
        </FormAccordion>
      )}
    />
  );
};

export default AudienceSection;
