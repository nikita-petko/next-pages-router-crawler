import type { FunctionComponent } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import { FormControl, Select, MenuItem } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { SetupStepFormData } from '../types/FormData';
import { MetricTemplateType } from '../types/MetricTemplateType';
import { METRIC_SET_OPTION_ORDER } from '../utils/metricSetOptions';

type MetricSetSelectorProps = {
  disabled?: boolean;
};

/**
 * Metric set (experiment template) dropdown shown underneath the experiment
 * name in the create/edit flow. Renders the Default/Ads/Custom options, each
 * with a short description.
 *
 * Presentational only — it does not render its own layout wrapper; the parent
 * (`ExperimentSetupStep`) owns the surrounding `<Grid item>`. Gating behind the
 * `isExperimentationTemplatesEnabled` flag is also the consumer's
 * responsibility. The selection is captured in the form but is not yet sent to
 * the backend (UI-only phase of the custom metrics & experiment templates work).
 */
const MetricSetSelector: FunctionComponent<MetricSetSelectorProps> = ({ disabled = false }) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { control } = useFormContext<SetupStepFormData>();

  // The exact design for this selector is not yet finalized, so the copy is not
  // final and these translation keys are intentionally NOT registered in
  // Translations Hub yet. We render via tPendingTranslation (translate() would
  // render the raw/blank key) until the design and copy are locked. Each call
  // must take string-literal arguments so the translation-sync tooling can
  // extract them — hence the copy lives here rather than in a data table.
  const label = tPendingTranslation(
    'Metric set',
    'Field label for the metric set dropdown in the experiment create flow.',
    translationKey(
      'Label.ExperimentCreation.MetricSet',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  const placeholder = tPendingTranslation(
    'Select a metric set',
    'Placeholder for the metric set dropdown in the experiment create flow.',
    translationKey(
      'Placeholder.ExperimentCreation.MetricSet',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  const optionContent: Record<MetricTemplateType, { label: string; description: string }> = {
    [MetricTemplateType.Default]: {
      label: tPendingTranslation(
        'Default',
        'Name of the default metric set option in the experiment create flow.',
        translationKey(
          'Label.MetricSet.Default',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
      description: tPendingTranslation(
        'Standard performance and engagement metrics like ARPU, session length, and retention.',
        'Description of the Default metric set option.',
        translationKey(
          'Message.MetricSet.DefaultDescription',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
    },
    [MetricTemplateType.Ads]: {
      label: tPendingTranslation(
        'Ads',
        'Name of the Ads metric set option in the experiment create flow.',
        translationKey(
          'Label.MetricSet.Ads',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
      description: tPendingTranslation(
        'Optimized for ad performance. Tracks impressions, click-through rates, and total ad revenue.',
        'Description of the Ads metric set option.',
        translationKey(
          'Message.MetricSet.AdsDescription',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
    },
    [MetricTemplateType.Custom]: {
      label: tPendingTranslation(
        'Custom',
        'Name of the Custom metric set option in the experiment create flow.',
        translationKey(
          'Label.MetricSet.Custom',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
      description: tPendingTranslation(
        'Includes default metrics plus up to three custom metrics defined by your team.',
        'Description of the Custom metric set option.',
        translationKey(
          'Message.MetricSet.CustomDescription',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
    },
  };

  return (
    <Controller
      name='metricTemplateType'
      control={control}
      render={({ field }) => (
        <FormControl fullWidth>
          <Select
            {...field}
            value={field.value ?? ''}
            disabled={disabled}
            data-testid='metric-set-label'
            label={label}
            placeholder={placeholder}
            renderValue={(selected) => {
              const value = METRIC_SET_OPTION_ORDER.find((option) => option === selected);
              return value ? optionContent[value].label : placeholder;
            }}>
            {METRIC_SET_OPTION_ORDER.map((value) => (
              <MenuItem key={value} value={value}>
                <div className='flex flex-col gap-xxsmall text-wrap'>
                  <span className='text-body-large'>{optionContent[value].label}</span>
                  <span className='text-body-medium content-muted'>
                    {optionContent[value].description}
                  </span>
                </div>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    />
  );
};

export default MetricSetSelector;
