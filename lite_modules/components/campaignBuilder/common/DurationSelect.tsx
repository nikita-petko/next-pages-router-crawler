import { Badge, Dropdown, Menu, MenuItem, MenuSection, TextInput } from '@rbx/foundation-ui';
import { useMemo } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import useFormLayoutStyles from '@components/campaignBuilder/common/FormLayout.styles';
import AppTooltip from '@components/common/AppTooltip';
import FieldUnitAdornment from '@components/common/form/FieldUnitAdornment';
import { ServerBudgetType } from '@constants/campaign';
import {
  CONTINUOUS_VALUE,
  DefaultDuration,
  FlowTypes,
  FormField,
} from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { GetEditCampaignDisabledTooltipText, IsEditCampaignDisabled } from '@utils/campaignBuilder';

const CUSTOM_VALUE = 'custom';

const DurationSelect = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { control, setValue } = useFormContext<FormType>();
  const flowType = useCampaignBuilderStore((state) => state.flowType);
  const editMode = flowType === FlowTypes.EDIT;
  const campaignStatus = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.display_status,
  );
  const isOffPlatformCampaign = useCampaignBuilderStore(
    (state) => !!state.simplifiedCampaign?.data?.off_platform_request_id,
  );
  const budgetType = useWatch<FormType, typeof FormField.BUDGET_TYPE>({
    control,
    name: FormField.BUDGET_TYPE,
  });
  const isCustom = useWatch<FormType, typeof FormField.CUSTOM_DURATION>({
    control,
    name: FormField.CUSTOM_DURATION,
  });
  const isExtendToOffPlatformEnabled = useWatch<
    FormType,
    typeof FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED
  >({
    control,
    name: FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED,
  });

  // Fetch duration options from store
  const durations = useCampaignBuilderStore(
    (state) => state.recommendation?.duration_options_in_days || [],
  );

  const isFullDaysEnabled = useAppStore((state) => state.appMetadataState.data?.isFullDaysEnabled);
  const isCampaignUsingFullDays = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.is_full_days,
  );
  const simplifiedCampaignStartTime = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.start_timestamp_ms,
  );

  const daysLabel =
    isFullDaysEnabled && (!editMode || isCampaignUsingFullDays)
      ? translate('Label.FullDays')
      : translate('Label.CalendarDays');

  // Generate options for select
  const options = useMemo<{ isRecommended: boolean; label: string; value: string | number }[]>(
    () => [
      // show continuous option only for edit mode. in create mode,
      // continuous option is received from the server
      ...(budgetType === ServerBudgetType.BUDGET_TYPE_DAILY && editMode
        ? [
            {
              isRecommended: false,
              label: translate('Label.RunContinuously'),
              value: CONTINUOUS_VALUE,
            },
          ]
        : []),
      ...(!editMode
        ? durations
            .filter(({ value }) => !(isExtendToOffPlatformEnabled && value === CONTINUOUS_VALUE))
            .map(({ is_recommended: isRecommended, value }) => ({
              isRecommended,
              label:
                value === CONTINUOUS_VALUE
                  ? translate('Label.RunContinuously')
                  : `${value} ${daysLabel}`,
              value,
            }))
        : []),
      {
        isRecommended: false,
        label: translate('Label.CustomDuration'),
        value: CUSTOM_VALUE,
      },
    ],
    [durations, budgetType, editMode, daysLabel, isExtendToOffPlatformEnabled, translate],
  );

  const {
    classes: { formRow, halfWidth },
    cx,
  } = useFormLayoutStyles();

  const isEditingStartedCampaign = Boolean(
    editMode && simplifiedCampaignStartTime && simplifiedCampaignStartTime < Date.now(),
  );

  const GetTooltipText = () => {
    if (editMode && isOffPlatformCampaign) {
      return translate('Description.OffPlatformBudgetDisabled');
    }
    const editCampaignDisabledTooltip = GetEditCampaignDisabledTooltipText(
      flowType,
      campaignStatus,
    );
    if (editCampaignDisabledTooltip) {
      return translate(editCampaignDisabledTooltip);
    }
    if (isEditingStartedCampaign) {
      return translate('Description.EditDisabledStarted');
    }
    return '';
  };

  const isEditDisabled =
    isEditingStartedCampaign ||
    IsEditCampaignDisabled(flowType, campaignStatus) ||
    (editMode && isOffPlatformCampaign);

  const showSelect =
    (!editMode || options.length > 1) && !(isCustom && isExtendToOffPlatformEnabled);

  return (
    <Controller
      control={control}
      name={FormField.DURATION}
      render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
        <AppTooltip title={GetTooltipText()}>
          <div className={`text-body-large ${cx(formRow, halfWidth)}`}>
            {showSelect && (
              <div className={cx({ [halfWidth]: isCustom })} data-testid='duration-select'>
                <Dropdown
                  isDisabled={isEditDisabled}
                  label={translate('Label.Duration')}
                  onValueChange={(newValue) => {
                    logNativeClickEvent(EventName.DurationSelectChanged, {
                      flowType,
                      previousValue: value.toString(),
                      value: newValue,
                    });
                    if (newValue === CUSTOM_VALUE) {
                      setValue(FormField.CUSTOM_DURATION, true);
                      // if changing from continuous to custom, set value to default duration
                      const recommendedDuration =
                        options.find(({ isRecommended }) => isRecommended)?.value ||
                        DefaultDuration;
                      if (value === CONTINUOUS_VALUE) {
                        onChange(
                          recommendedDuration === CONTINUOUS_VALUE
                            ? DefaultDuration
                            : recommendedDuration,
                        );
                      }
                    } else {
                      onChange(newValue === CONTINUOUS_VALUE ? CONTINUOUS_VALUE : Number(newValue));
                      setValue(FormField.CUSTOM_DURATION, false);
                    }
                  }}
                  placeholder={translate('Label.Duration')}
                  size='Medium'
                  value={String((isCustom ? CUSTOM_VALUE : value) || CONTINUOUS_VALUE)}>
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
            {isCustom && (
              <div className={halfWidth}>
                <NumericFormat
                  allowNegative={false}
                  className='width-full'
                  customInput={TextInput}
                  decimalScale={0}
                  error={error?.message}
                  fixedDecimalScale
                  id='custom-duration'
                  isAllowed={({ floatValue }) => {
                    if (floatValue === undefined) {
                      return true;
                    }
                    return floatValue <= 999999;
                  }}
                  isDisabled={isEditDisabled}
                  label={editMode ? translate('Label.Duration') : translate('Label.CustomDuration')}
                  onBlur={onBlur}
                  onValueChange={({ floatValue = NaN }) => {
                    onChange(floatValue);
                  }}
                  size='Medium'
                  thousandSeparator=','
                  thousandsGroupStyle='thousand'
                  trailingIconNode={<FieldUnitAdornment>{daysLabel}</FieldUnitAdornment>}
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

export default DurationSelect;
