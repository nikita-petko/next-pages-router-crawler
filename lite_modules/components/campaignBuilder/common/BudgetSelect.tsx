import { Badge } from '@rbx/foundation-ui';
import { InputAdornment, MenuItem, Select, TextField, Tooltip, Typography } from '@rbx/ui';
import { useMemo } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import useFormLayoutStyles from '@components/campaignBuilder/common/FormLayout.styles';
import { ServerBudgetType } from '@constants/campaign';
import {
  FlowTypes,
  FORM_HELPER_TEXT_PROPS,
  FormField,
  INPUT_LABEL_PROPS,
} from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { GetEditCampaignDisabledTooltipText, IsEditCampaignDisabled } from '@utils/campaignBuilder';
import { MicroUsdToUsd } from '@utils/currency';

const CUSTOM_VALUE = 'custom';

interface BudgetSelectProps {
  selectedLabel: string;
  unit: string;
}

const BudgetSelect = ({ selectedLabel, unit }: BudgetSelectProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { control, setValue } = useFormContext<FormType>();
  const budgetType = useWatch<FormType, typeof FormField.BUDGET_TYPE>({
    control,
    name: FormField.BUDGET_TYPE,
  });
  const isCustom = useWatch<FormType, typeof FormField.CUSTOM_BUDGET>({
    control,
    name: FormField.CUSTOM_BUDGET,
  });
  const detailedTargetingMatchType = useWatch<
    FormType,
    typeof FormField.DETAILED_TARGETING_MATCH_TYPE
  >({
    control,
    name: FormField.DETAILED_TARGETING_MATCH_TYPE,
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
  const campaignStatus = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.display_status,
  );
  const initialBudget = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.budget_in_micro_usd,
  );
  const campaignStartTimestampMs = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.start_timestamp_ms,
  );
  const isDecreaseBudgetEnabled = useAppStore(
    (state) => state.appMetadataState.data?.isDecreaseBudgetEnabled ?? false,
  );
  const currentBudget = useWatch<FormType, typeof FormField.BUDGET>({
    control,
    name: FormField.BUDGET,
  });
  const campaignIsLive = !!campaignStartTimestampMs && Date.now() >= campaignStartTimestampMs;
  const isPendingDecrease =
    editMode &&
    isDecreaseBudgetEnabled &&
    !!initialBudget &&
    !!currentBudget &&
    currentBudget < MicroUsdToUsd(initialBudget);
  const budgetOptionsByAudience = useCampaignBuilderStore(
    (state) => state.recommendation?.budget_options_by_audience_in_micro_usd,
  );

  // Generate options for select
  const options = useMemo<
    { isRecommended: boolean; label: string; value: number | string }[]
  >(() => {
    // Use audience-based budget options
    const budgetOptions = budgetOptionsByAudience?.[detailedTargetingMatchType] ?? [];

    return [
      ...budgetOptions.map(({ is_recommended: isRecommended, value }) => ({
        isRecommended,
        label: `${MicroUsdToUsd(value)} ${unit}`,
        value: MicroUsdToUsd(value),
      })),
      {
        isRecommended: false,
        label:
          budgetType === ServerBudgetType.BUDGET_TYPE_LIFETIME
            ? translate('Label.CustomLifetimeBudget')
            : translate('Label.CustomDailyBudget'),
        value: CUSTOM_VALUE,
      },
    ];
  }, [budgetOptionsByAudience, unit, budgetType, detailedTargetingMatchType, translate]);

  const {
    classes: { formRow, fullWidth, halfWidth },
    cx,
  } = useFormLayoutStyles();

  const getTooltipTitle = () => {
    const editCampaignDisabledTooltip = GetEditCampaignDisabledTooltipText(
      flowType,
      campaignStatus,
    );
    if (editCampaignDisabledTooltip) {
      return editCampaignDisabledTooltip;
    }
    return '';
  };

  return (
    <Controller
      control={control}
      key={ServerBudgetType.BUDGET_TYPE_DAILY}
      name={FormField.BUDGET}
      render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
        <Tooltip placement='top-start' title={getTooltipTitle()}>
          <Typography className={cx(formRow, fullWidth)} component='div'>
            {editMode ? null : (
              <Select
                className={cx({ [halfWidth]: isCustom })}
                data-testid='budget-select'
                fullWidth
                InputLabelProps={INPUT_LABEL_PROPS}
                label={selectedLabel}
                onChange={(e) => {
                  logNativeClickEvent(EventName.BudgetSelectChanged, {
                    flowType,
                    previousValue: value.toString(),
                    value: e.target.value,
                  });
                  if (e.target.value === CUSTOM_VALUE) {
                    setValue(FormField.CUSTOM_BUDGET, true);
                  } else {
                    onChange(e);
                    setValue(FormField.CUSTOM_BUDGET, false);
                  }
                }}
                size='medium'
                value={isCustom ? CUSTOM_VALUE : value}
                variant='outlined'>
                {options.map(({ isRecommended, label, value: optionValue }) => (
                  <MenuItem key={optionValue} value={optionValue}>
                    <span className='inline-flex items-center gap-small'>
                      {label}
                      {isRecommended && <Badge label={translate('Label.Recommended')} />}
                    </span>
                  </MenuItem>
                ))}
              </Select>
            )}
            {(isCustom || editMode) && (
              <NumericFormat
                allowNegative={false}
                className={halfWidth}
                color='primary'
                customInput={TextField}
                data-test-id='custom-budget-input'
                decimalScale={2}
                disabled={!!IsEditCampaignDisabled(flowType, campaignStatus)}
                error={!!error}
                fixedDecimalScale
                FormHelperTextProps={FORM_HELPER_TEXT_PROPS}
                fullWidth
                helperText={
                  error?.message ||
                  (isPendingDecrease &&
                    campaignIsLive &&
                    translate('Description.BudgetDecreasesNextDay')) ||
                  (!editMode &&
                    !isExtendToOffPlatformEnabled &&
                    translate('Description.CustomBudgetWarning'))
                }
                id='custom-budget'
                InputLabelProps={INPUT_LABEL_PROPS}
                InputProps={{
                  endAdornment: <InputAdornment position='end'>{unit}</InputAdornment>,
                }}
                label={editMode ? translate('Label.Budget') : translate('Label.CustomBudget')}
                margin='none'
                onBlur={onBlur}
                onValueChange={({ floatValue = NaN }) => {
                  onChange(floatValue);
                }}
                thousandSeparator=','
                thousandsGroupStyle='thousand'
                value={value}
              />
            )}
          </Typography>
        </Tooltip>
      )}
    />
  );
};

export default BudgetSelect;
