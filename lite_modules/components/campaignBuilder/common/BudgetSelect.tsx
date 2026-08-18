import { Badge, Dropdown, Menu, MenuItem, MenuSection, TextInput } from '@rbx/foundation-ui';
import { useMemo } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import useFormLayoutStyles from '@components/campaignBuilder/common/FormLayout.styles';
import AppTooltip from '@components/common/AppTooltip';
import FieldUnitAdornment from '@components/common/form/FieldUnitAdornment';
import { ServerBudgetType } from '@constants/campaign';
import { FlowTypes, FormField } from '@constants/campaignBuilder';
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
        <AppTooltip title={getTooltipTitle()}>
          <div className={`text-body-large ${cx(formRow, fullWidth)}`}>
            {editMode ? null : (
              <div className={cx({ [halfWidth]: isCustom })} data-testid='budget-select'>
                <Dropdown
                  label={selectedLabel}
                  onValueChange={(newValue) => {
                    logNativeClickEvent(EventName.BudgetSelectChanged, {
                      flowType,
                      previousValue: value.toString(),
                      value: newValue,
                    });
                    if (newValue === CUSTOM_VALUE) {
                      setValue(FormField.CUSTOM_BUDGET, true);
                    } else {
                      onChange(Number(newValue));
                      setValue(FormField.CUSTOM_BUDGET, false);
                    }
                  }}
                  placeholder={selectedLabel}
                  size='Medium'
                  value={isCustom ? CUSTOM_VALUE : String(value)}>
                  <Menu>
                    <MenuSection>
                      {options.map(({ isRecommended, label, value: optionValue }) => (
                        <MenuItem
                          key={optionValue}
                          title={label}
                          trailing={
                            isRecommended ? (
                              <Badge label={translate('Label.Recommended')} />
                            ) : undefined
                          }
                          value={String(optionValue)}
                        />
                      ))}
                    </MenuSection>
                  </Menu>
                </Dropdown>
              </div>
            )}
            {(isCustom || editMode) && (
              <div className={halfWidth}>
                <NumericFormat
                  allowNegative={false}
                  className='width-full'
                  customInput={TextInput}
                  data-test-id='custom-budget-input'
                  decimalScale={2}
                  error={error?.message}
                  fixedDecimalScale
                  helperText={
                    (isPendingDecrease &&
                      campaignIsLive &&
                      translate('Description.BudgetDecreasesNextDay')) ||
                    (!editMode &&
                      !isExtendToOffPlatformEnabled &&
                      translate('Description.CustomBudgetWarning')) ||
                    undefined
                  }
                  id='custom-budget'
                  isDisabled={!!IsEditCampaignDisabled(flowType, campaignStatus)}
                  label={editMode ? translate('Label.Budget') : translate('Label.CustomBudget')}
                  onBlur={onBlur}
                  onValueChange={({ floatValue = NaN }) => {
                    onChange(floatValue);
                  }}
                  size='Medium'
                  thousandSeparator=','
                  thousandsGroupStyle='thousand'
                  trailingIconNode={<FieldUnitAdornment>{unit}</FieldUnitAdornment>}
                  value={value}
                />
              </div>
            )}
          </div>
        </AppTooltip>
      )}
    />
  );
};

export default BudgetSelect;
