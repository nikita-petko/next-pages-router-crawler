import { Checkbox, Icon, IconButton, Radio, RadioGroup } from '@rbx/foundation-ui';
import { Alert, InputAdornment, MenuItem, Select, TextField, Tooltip, Typography } from '@rbx/ui';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import BudgetSelect from '@components/campaignBuilder/common/BudgetSelect';
import useCampaignBuilderCommonStyles from '@components/campaignBuilder/common/CampaignBuilderCommon.styles';
import DurationSelect from '@components/campaignBuilder/common/DurationSelect';
import EndTimePicker from '@components/campaignBuilder/common/EndTimePicker';
import FormAccordion from '@components/campaignBuilder/common/FormAccordion';
import useFormLayoutStyles from '@components/campaignBuilder/common/FormLayout.styles';
import PaymentMethodDrawer from '@components/campaignBuilder/common/PaymentMethodDrawer';
import PaymentSelect from '@components/campaignBuilder/common/PaymentSelect';
import StartTimePicker from '@components/campaignBuilder/common/StartTimePicker';
import Collapse from '@components/common/Collapse';
import {
  isAdCreditPaymentType,
  ServerBudgetType,
  ServerCampaignObjectiveType,
} from '@constants/campaign';
import {
  CONTINUOUS_VALUE,
  DefaultBudget,
  DefaultDuration,
  FlowTypes,
  FORM_HELPER_TEXT_PROPS,
  FormField,
  HIGH_BUDGET_WARNING_TEXT,
  INPUT_LABEL_PROPS,
  REACH_BID_TYPE_OPTIONS_BY_FORMAT,
  ReachAdFormat,
} from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import { PaymentUnit } from '@constants/payment';
import { AUTO_RELOAD_AD_CREDIT_CUE_MIGRATION } from '@cueMigrations/autoReloadAdCredit/config';
import CueMigrationWrapper from '@cueMigrations/CueMigrationWrapper';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { ServerAdSetBidType } from '@type/adSet';
import { BudgetOptionType } from '@type/campaignBuilder';
import {
  getCalendarDayEndTimestampMs,
  GetEditCampaignDisabledTooltipText,
  getScheduledBudgetDecreaseInfo,
  IsEditCampaignDisabled,
  RequiresMinimumAudienceSize,
} from '@utils/campaignBuilder';
import { MICRO_USD_IN_USD, MicroUsdToUsd } from '@utils/currency';
import { RoundToTwoDecimals } from '@utils/math';

const BudgetNameKey: Record<number, string> = {
  [ServerBudgetType.BUDGET_TYPE_DAILY]: 'Label.DailyBudget',
  [ServerBudgetType.BUDGET_TYPE_LIFETIME]: 'Label.LifetimeBudget',
};

const BudgetTypeRadioList = [
  {
    tooltipKey: 'Description.DailyBudgetTooltip',
    value: ServerBudgetType.BUDGET_TYPE_DAILY,
  },
  {
    tooltipKey: 'Description.LifetimeBudgetTooltip',
    value: ServerBudgetType.BUDGET_TYPE_LIFETIME,
  },
];

const ReachBidTypeShortLabelKey: Partial<Record<ServerAdSetBidType, string>> = {
  [ServerAdSetBidType.CPM_CHARGE]: 'Label.CPM',
  [ServerAdSetBidType.CPV2]: 'Label.CPV2',
};
const ReachBidPriceLabelKey: Partial<Record<ServerAdSetBidType, string>> = {
  [ServerAdSetBidType.CPM_CHARGE]: 'Label.CpmPrice',
  [ServerAdSetBidType.CPV2]: 'Label.CpvPrice',
};

const BudgetSection = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const { control, formState, getValues, setValue, trigger } = useFormContext<FormType>();
  const budgetType = useWatch<FormType, typeof FormField.BUDGET_TYPE>({
    control,
    name: FormField.BUDGET_TYPE,
  });
  const budget = useWatch<FormType, typeof FormField.BUDGET>({
    control,
    name: FormField.BUDGET,
  });
  const paymentType = useWatch<FormType, typeof FormField.PAYMENT_TYPE>({
    control,
    name: FormField.PAYMENT_TYPE,
  });
  const duration = useWatch<FormType, typeof FormField.DURATION>({
    control,
    name: FormField.DURATION,
  });
  const startTime = useWatch<FormType, typeof FormField.START_TIME>({
    control,
    name: FormField.START_TIME,
  });
  const startDate = useWatch<FormType, typeof FormField.START_DATE>({
    control,
    name: FormField.START_DATE,
  });
  const objective = useWatch<FormType, typeof FormField.GOAL>({
    control,
    name: FormField.GOAL,
  });
  const creativeFormat = useWatch<FormType, typeof FormField.CREATIVE_FORMAT>({
    control,
    name: FormField.CREATIVE_FORMAT,
  });
  const bidType = useWatch<FormType, typeof FormField.BID_TYPE>({
    control,
    name: FormField.BID_TYPE,
  });
  const isExtendToOffPlatformEnabled = useWatch<
    FormType,
    typeof FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED
  >({
    control,
    name: FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED,
  });
  const flowType = useCampaignBuilderStore((state) => state.flowType);
  const editMode = flowType === FlowTypes.EDIT;

  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(true);
  const campaignStatus = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.display_status,
  );
  const isCampaignUsingFullDays = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.is_full_days,
  );
  const isOffPlatformCampaign = useCampaignBuilderStore(
    (state) => !!state.simplifiedCampaign?.data?.off_platform_request_id,
  );
  const isFullDaysEnabled = useAppStore((state) => state.appMetadataState.data?.isFullDaysEnabled);
  const recommendation = useCampaignBuilderStore((state) => state.recommendation);
  const adCreditBalance = useAppStore(
    (state) => state.adCreditState.data?.ad_credit_balance_in_micro || 0,
  );
  const initialBudget = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.budget_in_micro_usd,
  );
  const isDecreaseBudgetEnabled = useAppStore(
    (state) => state.appMetadataState.data?.isDecreaseBudgetEnabled ?? false,
  );

  const campaignEndTimestampMs = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.end_timestamp_ms,
  );
  const campaignDurationInDays = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.duration_in_days,
  );
  const savedScheduledBudgetMicroUsd = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.scheduled_budget_micro_usd,
  );
  const campaignStartTimestampMs = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.start_timestamp_ms,
  );
  const advertiserTimezoneEnum = useAppStore(
    (state) => state.advertiserState?.data?.organization?.time_zone,
  );
  // Derive the effective end timestamp for isLastDayOfCampaign using calendar-day
  // arithmetic in the advertiser's timezone (matching the backend's
  // calculateEndtimestampWithDuration). Falls back to campaignEndTimestampMs if
  // already provided by the API, otherwise computes from start + duration.
  const formDuration = Number(duration);
  const durationForEndCalc =
    budgetType === ServerBudgetType.BUDGET_TYPE_LIFETIME && formDuration > 0
      ? formDuration
      : campaignDurationInDays;
  const effectiveCampaignEndTimestampMs =
    campaignEndTimestampMs ||
    (campaignStartTimestampMs && durationForEndCalc
      ? getCalendarDayEndTimestampMs(
          campaignStartTimestampMs,
          durationForEndCalc,
          advertiserTimezoneEnum,
        )
      : undefined);

  const campaignIsLive = !!campaignStartTimestampMs && Date.now() >= campaignStartTimestampMs;

  // True while the user is typing a value lower than the saved budget — drives helper text
  const isPendingDecrease =
    editMode &&
    isDecreaseBudgetEnabled &&
    !!initialBudget &&
    !!budget &&
    budget < MicroUsdToUsd(initialBudget);

  const { budgetDecreaseHelperText, isLastDayOfCampaign } = useMemo(() => {
    if (!isPendingDecrease || !campaignIsLive || !effectiveCampaignEndTimestampMs) {
      return { budgetDecreaseHelperText: null, isLastDayOfCampaign: false };
    }
    const {
      isLastDayOfCampaign: lastDay,
      messageKey,
      messageParams,
    } = getScheduledBudgetDecreaseInfo(advertiserTimezoneEnum, effectiveCampaignEndTimestampMs);
    return {
      budgetDecreaseHelperText: translate(messageKey, messageParams ?? {}),
      isLastDayOfCampaign: lastDay,
    };
  }, [
    isPendingDecrease,
    campaignIsLive,
    effectiveCampaignEndTimestampMs,
    advertiserTimezoneEnum,
    translate,
  ]);

  const [showWarningBanner, setShowWarningBanner] = useState<boolean>(false);
  const [isPendingDecreaseBannerDismissed, setIsPendingDecreaseBannerDismissed] =
    useState<boolean>(false);
  const offPlatformRequestMinimumDailyBudgetMicroUsd = useAppStore(
    (state) => state.appMetadataState.data?.offPlatformRequestMinimumDailyBudgetMicroUsd || 0,
  );
  const offPlatformRequestMinimumLifetimeBudgetMicroUsd = useAppStore(
    (state) => state.appMetadataState.data?.offPlatformRequestMinimumLifetimeBudgetMicroUsd || 0,
  );

  // Helper to determine if budget/duration fields should be disabled
  const isBudgetDurationDisabled =
    !!IsEditCampaignDisabled(flowType, campaignStatus) || (editMode && isOffPlatformCampaign);

  useEffect(() => {
    // Trigger payment type and budget validation when the budget type/duration/budget changes
    trigger([FormField.PAYMENT_TYPE, FormField.BUDGET, FormField.DURATION]);
  }, [budgetType, trigger, budget, duration, paymentType, adCreditBalance]);

  const {
    classes: { cardBanner, mt3, rightContentContainer, rightContentSubContainer },
  } = useCampaignBuilderCommonStyles();
  const {
    classes: { formRow, fullWidth, halfWidth },
    cx,
  } = useFormLayoutStyles();
  const unit = PaymentUnit[paymentType];

  const [doubleTooltip, setDoubleTooltip] = useState<boolean>(false);

  const getCustomInputTooltipTitle = () => {
    if (!editMode) {
      return '';
    }
    if (isOffPlatformCampaign) {
      return translate('Description.OffPlatformBudgetDisabled');
    }
    const editCampaignDisabledTooltip = GetEditCampaignDisabledTooltipText(
      flowType,
      campaignStatus,
    );
    if (editCampaignDisabledTooltip) {
      return translate(editCampaignDisabledTooltip);
    }
    return '';
  };

  const getRadioButtonsTooltipTitle = () => {
    if (doubleTooltip) {
      return '';
    }
    if (!editMode) {
      return '';
    }
    const editCampaignDisabledTooltip = GetEditCampaignDisabledTooltipText(
      flowType,
      campaignStatus,
    );
    if (editCampaignDisabledTooltip) {
      return translate(editCampaignDisabledTooltip);
    }
    return translate('Description.EditDisabledPublished');
  };

  const durationDescription =
    duration === CONTINUOUS_VALUE
      ? translate('Label.RunContinuously')
      : translate('Description.DurationDays', { duration: String(duration ?? '') });

  useEffect(() => {
    const detailedTargetingMatchType = getValues(FormField.DETAILED_TARGETING_MATCH_TYPE);

    // Use audience-based budget options
    const budgetOptions =
      recommendation?.budget_options_by_audience_in_micro_usd?.[detailedTargetingMatchType] ?? [];

    const highBudgetRecommendation = Math.max(
      ...(budgetOptions.length > 0 ? budgetOptions : ([{ value: 0 }] as BudgetOptionType[])).map(
        (option) => option.value,
      ),
    );
    const budgetOverThreshold =
      (budgetType === ServerBudgetType.BUDGET_TYPE_DAILY &&
        budget > highBudgetRecommendation / MICRO_USD_IN_USD) ||
      (budgetType === ServerBudgetType.BUDGET_TYPE_LIFETIME &&
        budget >
          (highBudgetRecommendation * (duration === CONTINUOUS_VALUE ? 1 : duration)) /
            MICRO_USD_IN_USD);
    setShowWarningBanner(
      RequiresMinimumAudienceSize(detailedTargetingMatchType) && !editMode && budgetOverThreshold,
    );
  }, [
    duration,
    editMode,
    budget,
    budgetType,
    recommendation?.budget_options_by_audience_in_micro_usd,
    getValues,
  ]);

  const daysLabel =
    isFullDaysEnabled && (!editMode || isCampaignUsingFullDays)
      ? translate('Label.FullDays')
      : translate('Label.CalendarDays');

  const hasSavedPendingDecrease = editMode && !!savedScheduledBudgetMicroUsd;

  const banner = useMemo<ReactNode>(
    () => (
      <>
        <Collapse in={hasSavedPendingDecrease && !isPendingDecreaseBannerDismissed} unmountOnExit>
          <Alert
            action={
              <IconButton
                ariaLabel={translateMisc('Action.Close')}
                icon='icon-regular-x'
                onClick={() => setIsPendingDecreaseBannerDismissed(true)}
                size='Small'
                variant='Utility'
              />
            }
            className={cardBanner}
            data-testid='scheduled-budget-decrease-banner'
            severity='warning'
            variant='outlined'>
            {translate('Message.BudgetDecreasePending')}
          </Alert>
        </Collapse>
        {showWarningBanner && (
          <Alert className={cardBanner} data-testid='warning-banner' severity='warning'>
            {translate(HIGH_BUDGET_WARNING_TEXT)}
          </Alert>
        )}
      </>
    ),
    [
      hasSavedPendingDecrease,
      isPendingDecreaseBannerDismissed,
      showWarningBanner,
      cardBanner,
      translate,
      translateMisc,
    ],
  );

  const maybeRenderDurationSection = () => {
    if (objective === ServerCampaignObjectiveType.REACH) {
      return undefined;
    }
    if (budgetType === ServerBudgetType.BUDGET_TYPE_DAILY) {
      return <DurationSelect />;
    }
    return (
      <Tooltip placement='top-start' title={getCustomInputTooltipTitle()}>
        <Typography className={halfWidth} component='div'>
          <Controller
            control={control}
            key={ServerBudgetType.BUDGET_TYPE_LIFETIME}
            name={FormField.DURATION}
            render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
              <NumericFormat
                allowNegative={false}
                color='primary'
                customInput={TextField}
                decimalScale={0}
                disabled={isBudgetDurationDisabled}
                error={!!error}
                fixedDecimalScale
                FormHelperTextProps={FORM_HELPER_TEXT_PROPS}
                fullWidth
                helperText={error?.message}
                id='duration'
                InputLabelProps={INPUT_LABEL_PROPS}
                InputProps={{
                  endAdornment: <InputAdornment position='end'>{daysLabel}</InputAdornment>,
                }}
                isAllowed={({ floatValue }) => {
                  if (floatValue === undefined) {
                    return true;
                  }
                  return floatValue <= 999999;
                }}
                label={editMode ? translate('Label.Duration') : translate('Label.CustomDuration')}
                margin='none'
                onBlur={onBlur}
                onValueChange={({ floatValue = NaN }) => {
                  onChange(floatValue);
                }}
                size='medium'
                thousandSeparator=','
                thousandsGroupStyle='thousand'
                value={value}
              />
            )}
          />
        </Typography>
      </Tooltip>
    );
  };

  return (
    <FormAccordion
      banner={banner}
      description={translate('Description.AccordionBudgetSummary', {
        budget: String(budget ?? ''),
        budgetType: translate(BudgetNameKey[budgetType] ?? ''),
        duration: durationDescription,
        startDate: `${startDate ?? ''} ${startTime ?? ''}`,
        unit: unit ?? '',
      })}
      hasError={Boolean(
        formState.errors[FormField.BUDGET_TYPE] ||
        formState.errors[FormField.BUDGET] ||
        formState.errors[FormField.DURATION] ||
        formState.errors[FormField.PAYMENT_TYPE] ||
        formState.errors[FormField.START_TIME] ||
        formState.errors[FormField.START_DATE],
      )}
      isOpen={isAccordionOpen}
      onChange={setIsAccordionOpen}
      rightContent={
        editMode ? undefined : (
          <div className={rightContentContainer}>
            <div className={rightContentSubContainer}>
              <Typography variant='h5'>{translate('Heading.HowItWorks')}</Typography>
              <Typography variant='body1'>{translate('Description.BudgetOptimization')}</Typography>
            </div>
            <div className={rightContentSubContainer}>
              <Typography variant='body2'>{translate('Description.RecommendedBudget')}</Typography>
            </div>
          </div>
        )
      }
      title={translate('Heading.BudgetAndSchedule')}>
      <Controller
        control={control}
        name={FormField.BUDGET_TYPE}
        render={({ field: { onBlur, onChange, ref, value } }) => (
          <RadioGroup
            onBlur={onBlur}
            onValueChange={(v) => {
              const newBudgetType = parseInt(v, 10);
              logNativeClickEvent(EventName.BudgetTypeChanged, {
                previousValue: value.toString(),
                value: newBudgetType.toString(),
              });
              onChange(newBudgetType);

              // reset duration to recommended if changing to lifetime and duration is continuous
              // if recommended duration is continuous, set to default duration
              const recommendedDuration =
                recommendation?.duration_options_in_days?.find(
                  ({ is_recommended }) => is_recommended,
                )?.value || DefaultDuration;
              const fallbackDuration =
                recommendedDuration === CONTINUOUS_VALUE ? DefaultDuration : recommendedDuration;

              const detailedTargetingMatchType = getValues(FormField.DETAILED_TARGETING_MATCH_TYPE);
              // Use audience-based budget options
              const budgetOptions: BudgetOptionType[] =
                recommendation?.budget_options_by_audience_in_micro_usd?.[
                  detailedTargetingMatchType
                ] ?? [];
              const recommendedBudget =
                (budgetOptions.find(({ is_recommended }) => is_recommended)?.value ||
                  DefaultBudget) / MICRO_USD_IN_USD;

              // if changing from lifetime to daily, reset to recommended
              if (newBudgetType === ServerBudgetType.BUDGET_TYPE_DAILY) {
                // For off-platform campaigns (spenders), set to minimum daily budget
                if (isExtendToOffPlatformEnabled) {
                  setValue(FormField.CUSTOM_DURATION, true);
                  setValue(
                    FormField.BUDGET,
                    MicroUsdToUsd(offPlatformRequestMinimumDailyBudgetMicroUsd),
                  );
                  setValue(FormField.CUSTOM_BUDGET, true);
                } else {
                  setValue(FormField.DURATION, recommendedDuration);
                  setValue(FormField.CUSTOM_DURATION, false);
                  setValue(FormField.BUDGET, recommendedBudget);
                  setValue(FormField.CUSTOM_BUDGET, false);
                }
                setValue(FormField.IS_AUTO_RELOAD_ENABLED, true);
              } else {
                // if changing from daily to lifetime, keep duration if possible and convert budget
                if (
                  duration === CONTINUOUS_VALUE &&
                  newBudgetType === ServerBudgetType.BUDGET_TYPE_LIFETIME
                ) {
                  setValue(FormField.DURATION, fallbackDuration);
                  // For off-platform campaigns (spenders), keep custom duration mode
                  setValue(FormField.CUSTOM_DURATION, !!isExtendToOffPlatformEnabled);
                }
                const effectiveDuration =
                  duration === CONTINUOUS_VALUE ? fallbackDuration : duration;
                // For off-platform campaigns, use the fixed minimum lifetime budget instead of calculation
                const convertedBudget = isExtendToOffPlatformEnabled
                  ? MicroUsdToUsd(offPlatformRequestMinimumLifetimeBudgetMicroUsd)
                  : RoundToTwoDecimals(getValues(FormField.BUDGET) * effectiveDuration);
                setValue(FormField.BUDGET, convertedBudget);
                setValue(FormField.CUSTOM_BUDGET, true);
                setValue(FormField.IS_AUTO_RELOAD_ENABLED, false);
              }
            }}
            ref={ref}
            size='Small'
            value={String(value)}>
            <div className='flex flex-row gap-large'>
              {BudgetTypeRadioList.map(({ tooltipKey, value: radioValue }) => (
                <Tooltip
                  key={radioValue}
                  placement='top-start'
                  title={getRadioButtonsTooltipTitle()}>
                  <div
                    className='flex flex-row items-center gap-small'
                    data-testid={`budget-radio-button-${radioValue}`}>
                    <Radio
                      aria-label={translate(BudgetNameKey[radioValue])}
                      isDisabled={
                        editMode ||
                        (objective === ServerCampaignObjectiveType.REACH &&
                          radioValue === ServerBudgetType.BUDGET_TYPE_DAILY)
                      }
                      label={translate(BudgetNameKey[radioValue])}
                      value={String(radioValue)}
                    />
                    <Tooltip
                      arrow
                      onMouseEnter={() => {
                        if (editMode) {
                          setDoubleTooltip(true);
                        }
                      }}
                      onMouseLeave={() => {
                        if (editMode) {
                          setDoubleTooltip(false);
                        }
                      }}
                      placement='bottom'
                      title={translate(tooltipKey)}>
                      <Icon className='content-muted' name='icon-regular-circle-i' size='Small' />
                    </Tooltip>
                  </div>
                </Tooltip>
              ))}
            </div>
          </RadioGroup>
        )}
      />
      <Typography className={cx(mt3, formRow)} component='div'>
        {budgetType === ServerBudgetType.BUDGET_TYPE_DAILY && !isExtendToOffPlatformEnabled ? (
          <BudgetSelect selectedLabel={translate(BudgetNameKey[budgetType])} unit={unit} />
        ) : (
          <Tooltip placement='top-start' title={getCustomInputTooltipTitle()}>
            <Typography className={fullWidth} component='div'>
              <Controller
                control={control}
                key={ServerBudgetType.BUDGET_TYPE_LIFETIME}
                name={FormField.BUDGET}
                render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                  <NumericFormat
                    allowNegative={false}
                    color='primary'
                    customInput={TextField}
                    decimalScale={2}
                    disabled={isBudgetDurationDisabled}
                    error={!!error || isLastDayOfCampaign}
                    fixedDecimalScale
                    FormHelperTextProps={FORM_HELPER_TEXT_PROPS}
                    fullWidth
                    helperText={
                      error?.message ||
                      (isLastDayOfCampaign && translate('Description.BudgetLastDayWarning')) ||
                      budgetDecreaseHelperText
                    }
                    id='budget'
                    InputLabelProps={INPUT_LABEL_PROPS}
                    InputProps={{
                      endAdornment: <InputAdornment position='end'>{unit}</InputAdornment>,
                    }}
                    label={translate(BudgetNameKey[budgetType])}
                    margin='none'
                    onBlur={onBlur}
                    onValueChange={({ floatValue = NaN }) => {
                      onChange(floatValue);
                    }}
                    size='medium'
                    thousandSeparator=','
                    thousandsGroupStyle='thousand'
                    value={value}
                    variant='outlined'
                  />
                )}
              />
            </Typography>
          </Tooltip>
        )}
        <PaymentSelect />
      </Typography>
      {objective === ServerCampaignObjectiveType.REACH && (
        <Typography className={cx(mt3, formRow)} component='div'>
          <Controller
            control={control}
            name={FormField.BID_TYPE}
            render={({ field: { onBlur, onChange, value } }) => {
              const bidTypeOptions =
                REACH_BID_TYPE_OPTIONS_BY_FORMAT[creativeFormat ?? ReachAdFormat.HORIZONTAL_2X1];
              return (
                <Select
                  className={halfWidth}
                  data-testid='reach-bid-type-select'
                  disabled={editMode}
                  fullWidth
                  InputLabelProps={INPUT_LABEL_PROPS}
                  label={translate('Label.BidType')}
                  onBlur={onBlur}
                  onChange={onChange}
                  size='medium'
                  value={value ?? ServerAdSetBidType.CPM_CHARGE}
                  variant='outlined'>
                  {bidTypeOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {translate(ReachBidTypeShortLabelKey[option] ?? 'Label.CPM')}
                    </MenuItem>
                  ))}
                </Select>
              );
            }}
          />
          <Controller
            control={control}
            name={FormField.BID_VALUE}
            render={({ field: { onChange, value }, fieldState: { error, isTouched } }) => {
              const shouldShowError = !!error && isTouched;
              const effectiveBidType = bidType ?? ServerAdSetBidType.CPM_CHARGE;
              return (
                <NumericFormat
                  allowNegative={false}
                  className={halfWidth}
                  color='primary'
                  customInput={TextField}
                  decimalScale={2}
                  disabled={editMode}
                  error={shouldShowError}
                  fixedDecimalScale
                  FormHelperTextProps={FORM_HELPER_TEXT_PROPS}
                  helperText={shouldShowError ? error?.message : ''}
                  id='cpm'
                  InputLabelProps={INPUT_LABEL_PROPS}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        {translate(ReachBidTypeShortLabelKey[effectiveBidType] ?? 'Label.CPM')}
                      </InputAdornment>
                    ),
                    startAdornment: (
                      <InputAdornment position='start'>
                        {translateReport('Label.CurrencyPrefix')}
                      </InputAdornment>
                    ),
                  }}
                  label={translate(ReachBidPriceLabelKey[effectiveBidType] ?? 'Label.CpmPrice')}
                  onValueChange={({ floatValue = NaN }) => {
                    onChange(floatValue);
                  }}
                  size='medium'
                  value={value}
                />
              );
            }}
          />
          <Controller
            control={control}
            name={FormField.DISCOUNT}
            render={({ field: { onChange, value }, fieldState: { error, isTouched } }) => {
              const shouldShowError = !!error && isTouched;
              return (
                <NumericFormat
                  allowNegative={false}
                  className={halfWidth}
                  color='primary'
                  customInput={TextField}
                  decimalScale={2}
                  disabled={editMode}
                  error={shouldShowError}
                  fixedDecimalScale
                  FormHelperTextProps={FORM_HELPER_TEXT_PROPS}
                  helperText={shouldShowError ? error?.message : ''}
                  id='discount'
                  InputLabelProps={INPUT_LABEL_PROPS}
                  InputProps={{
                    endAdornment: <InputAdornment position='end'>%</InputAdornment>,
                  }}
                  isAllowed={({ floatValue }) => {
                    if (floatValue === undefined) {
                      return true;
                    }
                    return floatValue >= 0 && floatValue <= 100;
                  }}
                  label={translate('Label.Discount')}
                  onValueChange={({ floatValue = NaN }) => {
                    onChange(floatValue);
                  }}
                  size='medium'
                  value={value}
                />
              );
            }}
          />
        </Typography>
      )}
      <Typography className={cx(mt3, formRow)} component='div'>
        <StartTimePicker />
        {objective === ServerCampaignObjectiveType.REACH && <EndTimePicker />}
        {maybeRenderDurationSection()}
      </Typography>
      {isAdCreditPaymentType(paymentType) && (
        <Typography className={formRow} component='div'>
          <Controller
            control={control}
            name={FormField.IS_AUTO_RELOAD_ENABLED}
            render={({ field: { onChange, value } }) => (
              <Tooltip placement='top-start' title={getCustomInputTooltipTitle()}>
                <div className='flex items-center gap-small padding-top-medium'>
                  <Checkbox
                    data-testid='auto-reload-checkbox'
                    isChecked={value}
                    isDisabled={isBudgetDurationDisabled}
                    label={translate('Label.AutoReloadAdCredit')}
                    onCheckedChange={(checked) => {
                      onChange(checked === true);
                    }}
                    placement='Start'
                    size='Small'
                  />
                  {isAccordionOpen && (
                    <CueMigrationWrapper
                      anchorElement={
                        <Tooltip
                          arrow
                          placement='bottom'
                          title={translate('Description.AutoReloadEnabled')}>
                          <Icon
                            className='content-muted'
                            name='icon-regular-circle-i'
                            size='Small'
                          />
                        </Tooltip>
                      }
                      migration={AUTO_RELOAD_AD_CREDIT_CUE_MIGRATION}
                    />
                  )}
                </div>
              </Tooltip>
            )}
          />
        </Typography>
      )}
      <PaymentMethodDrawer />
    </FormAccordion>
  );
};

export default BudgetSection;
