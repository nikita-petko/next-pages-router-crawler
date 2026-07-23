import { Badge, Icon, Link, OptionSelector } from '@rbx/foundation-ui';
import { Alert, AlertTitle, Tooltip } from '@rbx/ui';
import { Fragment, useCallback, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import useCampaignBuilderCommonStyles from '@components/campaignBuilder/common/CampaignBuilderCommon.styles';
import FormAccordion from '@components/campaignBuilder/common/FormAccordion';
import { applyObjectiveChange } from '@components/campaignBuilder/common/objectiveHelpers';
import useObjectiveSectionStyles from '@components/campaignBuilder/common/ObjectiveSection.styles';
import SpendObjectivePlatformToggle from '@components/campaignBuilder/common/SpendObjectivePlatformToggle';
import { AdAccountType } from '@constants/app';
import { ServerCampaignObjectiveType } from '@constants/campaign';
import { FlowTypes, FormField } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNeedsPaymentSetup from '@hooks/campaignBuilder/useNeedsPaymentSetup';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { usePaymentStore } from '@stores/paymentStoreProvider';
import { EligibilityStatus } from '@type/eligibility';
import { GetEditCampaignDisabledTooltipText } from '@utils/campaignBuilder';
import { SelectObjectiveEligibilityForUniverse } from '@utils/eligibility';
import { CaptureException } from '@utils/error';

const ENGAGED_PLAYS_LEARN_MORE_URL =
  'https://create.roblox.com/docs/production/promotion/ads-manager#ad-campaign-components';

const getGoalIconName = (goal: ServerCampaignObjectiveType) => {
  switch (goal) {
    case ServerCampaignObjectiveType.VISITS:
      return 'icon-filled-chart-scatter-plot';
    case ServerCampaignObjectiveType.REACH:
      return 'icon-regular-megaphone';
    case ServerCampaignObjectiveType.SPEND:
      return 'icon-regular-wallet';
    case ServerCampaignObjectiveType.ENGAGED_PLAYS:
      return 'icon-regular-circle-star';
    default:
      CaptureException(`campaign objective ${goal} not recognized, returning default goal icon`);
      return 'icon-filled-chart-scatter-plot';
  }
};

const getGoalIcon = (goal: ServerCampaignObjectiveType, iconClassName: string) => (
  <Icon className={iconClassName} name={getGoalIconName(goal)} size='Large' />
);

const ObjectiveSection = () => {
  const { translate, translateHTML } = useNamespacedTranslation(TranslationNamespace.Campaign);

  const getGoalName = (goal: ServerCampaignObjectiveType) => {
    switch (goal) {
      case ServerCampaignObjectiveType.VISITS:
        return translate('Label.Plays');
      case ServerCampaignObjectiveType.REACH:
        return translate('Label.Reach');
      case ServerCampaignObjectiveType.SPEND:
        return translate('Label.Earnings');
      case ServerCampaignObjectiveType.ENGAGED_PLAYS:
        return translate('Label.EngagedPlays');
      default:
        CaptureException(`campaign objective ${goal} not recognized, returning default goal name`);
        return translate('Label.Plays');
    }
  };

  const getGoalDescription = (goal: ServerCampaignObjectiveType) => {
    switch (goal) {
      case ServerCampaignObjectiveType.VISITS:
        return translate('Description.PlaysObjective');
      case ServerCampaignObjectiveType.REACH:
        return translate('Description.ReachObjective');
      case ServerCampaignObjectiveType.SPEND:
        return translate('Description.EarningsObjective');
      case ServerCampaignObjectiveType.ENGAGED_PLAYS:
        return translate('Description.EngagedPlaysObjective');
      default:
        CaptureException(`campaign objective ${goal} not recognized, returning default goal name`);
        return '';
    }
  };

  const { clearErrors, control, setValue, trigger } = useFormContext<FormType>();
  const objective = useWatch<FormType, typeof FormField.GOAL>({
    name: FormField.GOAL,
  });
  const experience = useWatch<FormType, typeof FormField.EXPERIENCE>({
    name: FormField.EXPERIENCE,
  });
  const detailedTargetingMatchType = useWatch<
    FormType,
    typeof FormField.DETAILED_TARGETING_MATCH_TYPE
  >({
    name: FormField.DETAILED_TARGETING_MATCH_TYPE,
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
  const flowType = useCampaignBuilderStore((state) => state.flowType);
  const editMode = flowType === FlowTypes.EDIT;

  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(true);
  const campaignStatus = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.display_status,
  );
  const {
    isGaasEnabled,
    isMaxReachEnabled,
    isSpendObjectiveEnabled,
    offPlatformRequestMinimumDaysFromStartDate,
    offPlatformRequestMinimumDurationDays,
    offPlatformRequestMinimumLifetimeBudgetMicroUsd,
  } = useAppStore((state) => state.appMetadataState.data);

  const recommendation = useCampaignBuilderStore((state) => state.recommendation);

  const eligibilityContext = useCampaignBuilderStore((state) => state.eligibilityContext);
  const selectedUniverseId = experience?.universe_id;
  const objectiveEligibility = SelectObjectiveEligibilityForUniverse(
    eligibilityContext,
    selectedUniverseId,
  );

  // Treat unknown/missing eligibility as eligible; only an explicit NOT_ELIGIBLE blocks the objective.
  const isObjectiveEligible = (type: ServerCampaignObjectiveType) =>
    !objectiveEligibility || objectiveEligibility[type] !== EligibilityStatus.NOT_ELIGIBLE;

  const isEngagedPlaysObjectiveAvailable = isObjectiveEligible(
    ServerCampaignObjectiveType.ENGAGED_PLAYS,
  );

  // SPEND stays available via off-platform (GAAS) even when on-platform eligibility says no.
  const isSpendObjectiveAvailable =
    isGaasEnabled ||
    (isSpendObjectiveEnabled && isObjectiveEligible(ServerCampaignObjectiveType.SPEND));
  const isSpendOffPlatformOnly = isGaasEnabled && !isSpendObjectiveEnabled;

  const shouldShowPlatformToggle =
    isSpendObjectiveEnabled &&
    isGaasEnabled &&
    objective === ServerCampaignObjectiveType.SPEND &&
    !editMode;

  const {
    classes: { cardBanner, inlineAlertTitle, rightContentSubContainer },
  } = useCampaignBuilderCommonStyles();
  const {
    classes: { iconContainer, largeIconProperties },
  } = useObjectiveSectionStyles();

  // When Engaged Plays is eligible for the selected universe, surface it as the first option;
  // otherwise keep it visible after VISITS so users can still see (and learn about) it.
  const objectives = [
    ...(isEngagedPlaysObjectiveAvailable ? [ServerCampaignObjectiveType.ENGAGED_PLAYS] : []),
    ServerCampaignObjectiveType.VISITS,
    ...(!isEngagedPlaysObjectiveAvailable ? [ServerCampaignObjectiveType.ENGAGED_PLAYS] : []),
    ServerCampaignObjectiveType.SPEND,
    ...(isMaxReachEnabled ? [ServerCampaignObjectiveType.REACH] : []),
  ];

  const getObjectiveCardsTooltipText = () => {
    const editCampaignDisabledTooltip = GetEditCampaignDisabledTooltipText(
      flowType,
      campaignStatus,
    );
    if (editCampaignDisabledTooltip) {
      return translate(editCampaignDisabledTooltip);
    }
    return editMode ? translate('Description.EditDisabledPublished') : '';
  };

  const getBanner = () => {
    if (isExtendToOffPlatformEnabled && isSpendOffPlatformOnly) {
      return (
        <Alert className={cardBanner} data-testid='info-banner' severity='info'>
          {translate('Description.EarningsOffPlatformOnly')}
        </Alert>
      );
    }
    if (objective === ServerCampaignObjectiveType.ENGAGED_PLAYS) {
      return (
        <Alert
          className={cardBanner}
          data-testid='engaged-plays-info-banner'
          severity='info'
          variant='outlined'>
          <AlertTitle className={inlineAlertTitle}>
            {translate('Heading.EngagedPlaysBanner')}
          </AlertTitle>
          <div className='text-body-medium'>
            {translateHTML('Description.EngagedPlaysBanner', [
              {
                closing: 'linkEnd',
                content: (chunks) => (
                  <Link
                    href={ENGAGED_PLAYS_LEARN_MORE_URL}
                    isExternal={false}
                    rel='noopener noreferrer'
                    target='_blank'>
                    {chunks}
                  </Link>
                ),
                opening: 'linkStart',
              },
            ])}
          </div>
        </Alert>
      );
    }
    return undefined;
  };

  const getEngagedPlaysDisabledTooltipContent = () =>
    translateHTML('Description.EngagedPlaysDisabledTooltip', [
      {
        closing: 'linkEnd',
        content: (chunks) => (
          <Link
            href={ENGAGED_PLAYS_LEARN_MORE_URL}
            isExternal={false}
            rel='noopener noreferrer'
            target='_blank'>
            {chunks}
          </Link>
        ),
        opening: 'linkStart',
      },
    ]);

  const isObjectiveDisabled = (option: ServerCampaignObjectiveType) => {
    if (editMode) {
      return true;
    }
    if (option === ServerCampaignObjectiveType.REACH) {
      return !isMaxReachEnabled;
    }
    if (option === ServerCampaignObjectiveType.SPEND) {
      return !isSpendObjectiveAvailable;
    }
    if (option === ServerCampaignObjectiveType.ENGAGED_PLAYS) {
      return !isEngagedPlaysObjectiveAvailable;
    }
    return false;
  };

  const getOptionSubtext = (option: ServerCampaignObjectiveType) => {
    if (editMode) {
      return '';
    }
    if (option === ServerCampaignObjectiveType.ENGAGED_PLAYS) {
      return translate('Label.Beta');
    }
    if (isObjectiveDisabled(option)) {
      return translate('Label.ComingSoon');
    }
    if (
      option === ServerCampaignObjectiveType.SPEND ||
      option === ServerCampaignObjectiveType.REACH
    ) {
      return translate('Label.Beta');
    }
    return '';
  };

  const shouldShowSubtext = (option: ServerCampaignObjectiveType) =>
    isObjectiveDisabled(option) ||
    (option === ServerCampaignObjectiveType.SPEND && isGaasEnabled) ||
    option === ServerCampaignObjectiveType.ENGAGED_PLAYS;

  const isAdAccountAutoCreateEnabled = useAppStore(
    (state) => state.appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false,
  );
  const hasPaymentProfile = usePaymentStore((state) => state.paymentProfiles?.data?.length > 0);

  const paymentFailure = useAppStore((state) => state.appData?.paymentFailure);
  const shouldShowCreditCard = hasPaymentProfile && !paymentFailure;

  const shouldShowInvoice = useAppStore((state) =>
    [AdAccountType.AD_ACCOUNT_TYPE_INTERNAL, AdAccountType.AD_ACCOUNT_TYPE_MANAGED].includes(
      state.advertiserState.data?.ad_account?.type ?? AdAccountType.AD_ACCOUNT_TYPE_SELF_SERVICE,
    ),
  );
  const needsPaymentSetup = useNeedsPaymentSetup();

  // Thin closure over the shared `applyObjectiveChange` util so the user-click handler below
  // can call it without re-listing every dependency at the call site.
  const handleObjectiveChange = useCallback(
    (nextObjective: ServerCampaignObjectiveType) => {
      applyObjectiveChange({
        detailedTargetingMatchType,
        hasPaymentProfile,
        isAdAccountAutoCreateEnabled,
        isSpendOffPlatformOnly,
        needsAccountSetup: needsPaymentSetup,
        nextObjective,
        offPlatformRequestMinimumDaysFromStartDate,
        offPlatformRequestMinimumDurationDays,
        offPlatformRequestMinimumLifetimeBudgetMicroUsd,
        recommendation,
        setValue,
        shouldShowCreditCard,
        shouldShowInvoice,
        startTime,
        trigger,
      });
    },
    [
      detailedTargetingMatchType,
      hasPaymentProfile,
      isAdAccountAutoCreateEnabled,
      isSpendOffPlatformOnly,
      needsPaymentSetup,
      offPlatformRequestMinimumDaysFromStartDate,
      offPlatformRequestMinimumDurationDays,
      offPlatformRequestMinimumLifetimeBudgetMicroUsd,
      recommendation,
      setValue,
      shouldShowCreditCard,
      shouldShowInvoice,
      trigger,
      startTime,
    ],
  );

  return (
    <Controller
      control={control}
      name={FormField.DETAILED_TARGETING_MATCH_TYPE}
      render={({ fieldState: { error } }) => (
        <FormAccordion
          banner={getBanner()}
          description={`${getGoalName(objective)}`}
          hasError={!!error}
          isOpen={isAccordionOpen}
          onChange={setIsAccordionOpen}
          rightContent={
            editMode ? undefined : (
              <div className={rightContentSubContainer}>
                <div className={iconContainer}>{getGoalIcon(objective, largeIconProperties)}</div>
                <span className='text-heading-small'>{getGoalName(objective)}</span>
                <span className='text-body-large'>{getGoalDescription(objective)}</span>
              </div>
            )
          }
          title={translate('Heading.Goal')}>
          <Tooltip placement='top-start' title={getObjectiveCardsTooltipText()}>
            {/* Need to wrap the option selectors in a div for the tooltip to appear */}
            <div className='flex flex-col gap-medium width-full'>
              {objectives.map((option, index) => {
                const optionSelector = (
                  <OptionSelector
                    icon={getGoalIconName(option)}
                    isDisabled={isObjectiveDisabled(option)}
                    isSelected={option === objective}
                    label={
                      <span className='inline-flex items-center gap-small text-title-medium'>
                        {getGoalName(option)}
                        {shouldShowSubtext(option) && <Badge label={getOptionSubtext(option)} />}
                      </span>
                    }
                    layout='Horizontal'
                    onSelect={() => {
                      logNativeClickEvent(EventName.CampaignBuilderGoalSelected, {
                        goal: option.toString(),
                        options: objectives.join(','),
                      });
                      clearErrors(FormField.GOAL);

                      // Set server objective
                      setValue(FormField.GOAL, option);

                      // Apply objective-specific changes
                      handleObjectiveChange(option);
                    }}
                    size='Small'
                    type='Checkmark'
                  />
                );
                const showEngagedPlaysDisabledTooltip =
                  option === ServerCampaignObjectiveType.ENGAGED_PLAYS &&
                  isObjectiveDisabled(option) &&
                  !editMode;
                return (
                  <Fragment key={option}>
                    <div
                      data-testid={`campaign-objective-option-${option.toString().toLowerCase()}-${index}`}>
                      {showEngagedPlaysDisabledTooltip ? (
                        <Tooltip
                          placement='top-start'
                          title={getEngagedPlaysDisabledTooltipContent()}>
                          <span>{optionSelector}</span>
                        </Tooltip>
                      ) : (
                        optionSelector
                      )}
                    </div>
                    {option === ServerCampaignObjectiveType.SPEND && shouldShowPlatformToggle && (
                      <SpendObjectivePlatformToggle
                        detailedTargetingMatchType={detailedTargetingMatchType}
                        hasPaymentProfile={hasPaymentProfile}
                        isAdAccountAutoCreateEnabled={isAdAccountAutoCreateEnabled}
                        isExtendToOffPlatformEnabled={isExtendToOffPlatformEnabled}
                        offPlatformRequestMinimumDaysFromStartDate={
                          offPlatformRequestMinimumDaysFromStartDate
                        }
                        offPlatformRequestMinimumDurationDays={
                          offPlatformRequestMinimumDurationDays
                        }
                        offPlatformRequestMinimumLifetimeBudgetMicroUsd={
                          offPlatformRequestMinimumLifetimeBudgetMicroUsd
                        }
                        recommendation={recommendation}
                        setValue={setValue}
                        shouldShowCreditCard={shouldShowCreditCard}
                        shouldShowInvoice={shouldShowInvoice}
                        trigger={trigger}
                      />
                    )}
                  </Fragment>
                );
              })}
            </div>
          </Tooltip>
        </FormAccordion>
      )}
    />
  );
};

export default ObjectiveSection;
