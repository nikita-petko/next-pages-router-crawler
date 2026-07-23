import { Badge } from '@rbx/foundation-ui';
import { InputAdornment, MenuItem, Select, TextField, Tooltip, Typography } from '@rbx/ui';
import { useMemo } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import useFormLayoutStyles from '@components/campaignBuilder/common/FormLayout.styles';
import { ServerBudgetType } from '@constants/campaign';
import {
  CONTINUOUS_VALUE,
  DefaultDuration,
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
        <Tooltip placement='top-start' title={GetTooltipText()}>
          <Typography className={cx(formRow, halfWidth)} component='div'>
            {showSelect && (
              <Select
                className={cx({ [halfWidth]: isCustom })}
                data-testid='duration-select'
                disabled={isEditDisabled}
                fullWidth
                InputLabelProps={INPUT_LABEL_PROPS}
                label={translate('Label.Duration')}
                onChange={(e) => {
                  logNativeClickEvent(EventName.DurationSelectChanged, {
                    flowType,
                    previousValue: value.toString(),
                    value: e.target.value,
                  });
                  if (e.target.value === CUSTOM_VALUE) {
                    setValue(FormField.CUSTOM_DURATION, true);
                    // if changing from continuous to custom, set value to default duration
                    const recommendedDuration =
                      options.find(({ isRecommended }) => isRecommended)?.value || DefaultDuration;
                    if (value === CONTINUOUS_VALUE) {
                      onChange(
                        recommendedDuration === CONTINUOUS_VALUE
                          ? DefaultDuration
                          : recommendedDuration,
                      );
                    }
                  } else {
                    onChange(e);
                    setValue(FormField.CUSTOM_DURATION, false);
                  }
                }}
                size='medium'
                value={(isCustom ? CUSTOM_VALUE : value) || CONTINUOUS_VALUE}
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
            {isCustom && (
              <NumericFormat
                allowNegative={false}
                className={halfWidth}
                color='primary'
                customInput={TextField}
                decimalScale={0}
                disabled={isEditDisabled}
                error={!!error}
                fixedDecimalScale
                FormHelperTextProps={FORM_HELPER_TEXT_PROPS}
                fullWidth
                helperText={error?.message}
                id='custom-duration'
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

export default DurationSelect;
