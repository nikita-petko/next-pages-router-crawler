import { Checkbox } from '@rbx/foundation-ui';
import { FormHelperText, MenuItem, Select } from '@rbx/ui';
import { useMemo, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import useCampaignBuilderCommonStyles from '@components/campaignBuilder/common/CampaignBuilderCommon.styles';
import FormAccordion from '@components/campaignBuilder/common/FormAccordion';
import useFormLayoutStyles from '@components/campaignBuilder/common/FormLayout.styles';
import useFrequencyCappingStyles from '@components/campaignBuilder/common/FrequencyCapping.styles';
import { ServerCampaignObjectiveType } from '@constants/campaign';
import { FlowTypes, FormField, INPUT_LABEL_PROPS } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { ServerAdSetBidType } from '@type/adSet';

const OptimizationSection = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(false);
  const { control } = useFormContext<FormType>();
  const flowType = useCampaignBuilderStore((state) => state.flowType);
  const maxFrequencyCapDurationInDays = useAppStore(
    (state) => state.appMetadataState.data?.maxFrequencyCapDurationInDays,
  );
  const maxFrequencyCapValue = useAppStore(
    (state) => state.appMetadataState.data?.maxFrequencyCapValue,
  );
  const editMode = flowType === FlowTypes.EDIT;
  const goal = useWatch<FormType, typeof FormField.GOAL>({
    name: FormField.GOAL,
  });
  const frequencyCappingOn = useWatch<FormType, typeof FormField.FREQUENCY_CAPPING_ON>({
    name: FormField.FREQUENCY_CAPPING_ON,
  });
  const frequencyCappingValue = useWatch<FormType, typeof FormField.FREQUENCY_CAPPING_VALUE>({
    name: FormField.FREQUENCY_CAPPING_VALUE,
  });
  const frequencyCappingDurationDays = useWatch<
    FormType,
    typeof FormField.FREQUENCY_CAPPING_DURATION_DAYS
  >({
    name: FormField.FREQUENCY_CAPPING_DURATION_DAYS,
  });
  const bidType = useWatch<FormType, typeof FormField.BID_TYPE>({
    name: FormField.BID_TYPE,
  });

  const isOptimizationEnabled = goal === ServerCampaignObjectiveType.REACH;
  const isVideoViewBidType = bidType === ServerAdSetBidType.CPV2;

  const {
    classes: { rightContentSubContainer },
  } = useCampaignBuilderCommonStyles();
  const {
    classes: { formColumn, formRow },
    cx,
  } = useFormLayoutStyles();
  const {
    classes: {
      frequencyCappingConnectingText,
      frequencyCappingDurationSelect,
      frequencyCappingRow,
      frequencyCappingValueSelect,
    },
  } = useFrequencyCappingStyles();

  // Generate options for frequency capping value (impressions) - 1 to 100
  const impressionOptions = useMemo(
    () =>
      Array.from({ length: maxFrequencyCapValue }, (_, i) => ({
        label: (i + 1).toString(),
        value: i + 1,
      })),
    [maxFrequencyCapValue],
  );

  // Generate options for frequency capping duration (days) - 1 to 30
  const dayOptions = useMemo(
    () =>
      Array.from({ length: maxFrequencyCapDurationInDays }, (_, i) => ({
        label: (i + 1).toString(),
        value: i + 1,
      })),
    [maxFrequencyCapDurationInDays],
  );

  const frequencyCapSummary = useMemo(() => {
    if (frequencyCappingOn && frequencyCappingValue && frequencyCappingDurationDays) {
      return translate('Description.FrequencyCapSummary', {
        dayLabel:
          frequencyCappingDurationDays !== 1 ? translate('Label.Days') : translate('Label.Day'),
        days: String(frequencyCappingDurationDays),
        impressionLabel: isVideoViewBidType
          ? translate(frequencyCappingValue !== 1 ? 'Label.VideoViews' : 'Label.VideoView')
          : translate(frequencyCappingValue !== 1 ? 'Label.Impressions' : 'Label.Impression'),
        impressions: String(frequencyCappingValue),
      });
    }
    return '';
  }, [
    frequencyCappingOn,
    frequencyCappingValue,
    frequencyCappingDurationDays,
    isVideoViewBidType,
    translate,
  ]);

  const accordionDescription = useMemo(() => {
    if (frequencyCappingOn && frequencyCapSummary) {
      return frequencyCapSummary;
    }
    return translate('Description.FrequencyCapOff');
  }, [frequencyCappingOn, frequencyCapSummary, translate]);

  if (!isOptimizationEnabled) {
    return null;
  }

  return (
    <FormAccordion
      description={accordionDescription}
      isOpen={isAccordionOpen}
      onChange={setIsAccordionOpen}
      rightContent={
        editMode ? undefined : (
          <div className={rightContentSubContainer}>
            <span className='text-heading-small'>{translate('Label.HowItWorksFrequency')}</span>
            <span className='text-body-large'>
              {translate('Description.FrequencyCapExplanation')}
            </span>
          </div>
        )
      }
      title={translate('Heading.OptimizationAndDelivery')}>
      <div className={formColumn}>
        <span className={`text-title-large ${formRow}`}>{translate('Label.FrequencyCapping')}</span>
        <div className={`text-body-large ${formRow}`}>
          <Controller
            control={control}
            name={FormField.FREQUENCY_CAPPING_ON}
            render={({ field: { onChange, value } }) => (
              <Checkbox
                aria-label={translate('Label.EnableFrequencyCap')}
                data-testid='frequency-capping-checkbox'
                isChecked={value || false}
                isDisabled={editMode}
                label={translate('Label.EnableFrequencyCapPerUser')}
                onCheckedChange={(checked) => {
                  if (editMode) {
                    return;
                  }
                  onChange(checked === true);
                }}
                placement='Start'
                size='Small'
              />
            )}
          />
        </div>

        <div>
          <div className={`text-body-large ${cx(formRow, frequencyCappingRow)}`}>
            <Controller
              control={control}
              name={FormField.FREQUENCY_CAPPING_VALUE}
              render={({ field: { onChange, value } }) => (
                <Select
                  className={frequencyCappingValueSelect}
                  data-testid='frequency-capping-value-select'
                  disabled={editMode || !frequencyCappingOn}
                  InputLabelProps={INPUT_LABEL_PROPS}
                  label={translate(
                    isVideoViewBidType ? 'Label.NumberOfVideoViews' : 'Label.NumberOfImpressions',
                  )}
                  onChange={onChange}
                  SelectProps={{
                    MenuProps: {
                      style: {
                        maxHeight: 200,
                      },
                    },
                  }}
                  size='medium'
                  value={value}
                  variant='outlined'>
                  {impressionOptions.map(({ label, value: optionValue }) => (
                    <MenuItem key={optionValue} value={optionValue}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            <span
              className={`text-body-large ${frequencyCappingOn ? 'content-inherit' : 'content-muted'} ${frequencyCappingConnectingText}`}>
              {translate(isVideoViewBidType ? 'Label.VideoViewsEvery' : 'Label.ImpressionsEvery')}
            </span>
            <Controller
              control={control}
              name={FormField.FREQUENCY_CAPPING_DURATION_DAYS}
              render={({ field: { onChange, value } }) => (
                <Select
                  className={frequencyCappingDurationSelect}
                  data-testid='frequency-capping-duration-select'
                  disabled={editMode || !frequencyCappingOn}
                  InputLabelProps={INPUT_LABEL_PROPS}
                  label={translate('Label.Frequency')}
                  onChange={onChange}
                  SelectProps={{
                    MenuProps: {
                      style: {
                        maxHeight: 200,
                      },
                    },
                  }}
                  size='medium'
                  value={value}
                  variant='outlined'>
                  {dayOptions.map(({ label, value: optionValue }) => (
                    <MenuItem key={optionValue} value={optionValue}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            <span
              className={`text-body-large ${frequencyCappingOn ? 'content-inherit' : 'content-muted'}`}>
              {translate('Label.Days')}
            </span>
          </div>

          {frequencyCapSummary && (
            <FormHelperText className={formRow} component='div'>
              {frequencyCapSummary}
            </FormHelperText>
          )}
        </div>
      </div>
    </FormAccordion>
  );
};

export default OptimizationSection;
