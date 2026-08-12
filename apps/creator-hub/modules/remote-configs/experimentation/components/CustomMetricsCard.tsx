import type { FunctionComponent } from 'react';
import { useCallback, useRef } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import {
  RAQIV2AggregationType,
  RAQIV2Dimension,
  RAQIV2DimensionDisplayConfig,
} from '@rbx/creator-hub-analytics-config';
import { Badge, Button, Divider, IconButton } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { CustomMetric } from '../types/CustomMetric';
import { CustomMetricCategory, MAX_CUSTOM_METRICS } from '../types/CustomMetric';
import type { SetupStepFormData } from '../types/FormData';
import { getDisplayableFilters } from '../utils/customMetricOptions';

type CustomMetricsCardProps = {
  disabled?: boolean;
};

// Stable no-op for affordances whose handler isn't built yet, so IconButton
// doesn't get a new onClick reference on every render.
const noop = () => {};

// Distributive `Omit` so each member of the `CustomMetric` union keeps its own
// category-specific fields (a plain `Omit<Union, 'id'>` would collapse to only
// the keys common to every member).
type CustomMetricSample = CustomMetric extends infer M
  ? M extends CustomMetric
    ? Omit<M, 'id'>
    : never
  : never;

// Sample metrics cycled through when mock-inserting. The dedicated create/edit
// drawer that populates a real metric is not built yet, so "+ Add" just drops a
// pre-filled sample in to demonstrate the list and exercise the data model.
// `id` is stamped on insert (see handleAdd).
const buildSampleCustomMetric = (id: string, index: number): CustomMetric => {
  const samples: ReadonlyArray<CustomMetricSample> = [
    {
      name: 'Average herbs collected',
      category: CustomMetricCategory.Custom,
      aggregation: RAQIV2AggregationType.Average,
      customEvent: 'HerbCollected',
      filters: [
        {
          dimension: RAQIV2Dimension.CustomField1,
          values: ['PowerHerb', 'HealthHerb'],
        },
        { dimension: RAQIV2Dimension.CustomField2, values: ['MeadowMap1'] },
      ],
    },
    {
      name: 'Average flowers collected',
      category: CustomMetricCategory.Custom,
      aggregation: RAQIV2AggregationType.Average,
      customEvent: 'FlowerCollected',
      filters: [
        { dimension: RAQIV2Dimension.CustomField1, values: ['StarLily', 'MoonRose'] },
        { dimension: RAQIV2Dimension.CustomField2, values: ['MeadowMap1'] },
      ],
    },
    {
      name: 'Premium pass purchased',
      category: CustomMetricCategory.Economy,
      aggregation: RAQIV2AggregationType.Average,
      currency: 'Robux',
      filters: [
        { dimension: RAQIV2Dimension.TransactionType, values: ['IAP'] },
        { dimension: RAQIV2Dimension.ItemSku, values: ['PremiumPass'] },
      ],
    },
  ];
  const sample = samples[index % samples.length];
  return { ...sample, id };
};

/**
 * "Custom metrics" panel shown underneath the metric set selector when the
 * creator has picked the `Custom` metric set. Guides the creator to define up
 * to {@link MAX_CUSTOM_METRICS} custom metrics: it lists the metrics they have
 * added (with edit/delete affordances) and offers a "+ Add" button.
 *
 * Presentational only — it does not render its own layout wrapper, and gating
 * (flag + `metricTemplateType === Custom`) is the consumer's responsibility.
 * The create/edit flow for an individual metric is not built yet, so "+ Add"
 * mock-inserts a placeholder and the edit affordance is a no-op for now. The
 * metrics are captured in the form but not yet sent to the backend (UI-only
 * phase of the custom metrics & experiment templates work).
 */
const CustomMetricsCard: FunctionComponent<CustomMetricsCardProps> = ({ disabled = false }) => {
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { control } = useFormContext<SetupStepFormData>();
  const { fields, append, remove } = useFieldArray<SetupStepFormData, 'customMetrics', 'fieldId'>({
    control,
    name: 'customMetrics',
    keyName: 'fieldId',
  });

  // Monotonic counter for generating stable, unique client-side ids for
  // mock-inserted metrics (Date.now()/Math.random() are intentionally avoided
  // so behavior stays deterministic in tests and storybook).
  const nextIdRef = useRef(0);

  const hasReachedLimit = fields.length >= MAX_CUSTOM_METRICS;

  const handleAdd = useCallback(() => {
    if (hasReachedLimit) {
      return;
    }
    const insertionIndex = nextIdRef.current;
    nextIdRef.current += 1;
    append(buildSampleCustomMetric(`custom-metric-${insertionIndex}`, insertionIndex));
  }, [append, hasReachedLimit]);

  const title = tPendingTranslation(
    'Custom metrics',
    'Heading for the custom metrics panel in the experiment create flow.',
    translationKey(
      'Title.ExperimentCreation.CustomMetrics',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  const description =
    fields.length > 0
      ? tPendingTranslation(
          'Define up to 3 custom metrics for this experiment.',
          'Description shown in the custom metrics panel when at least one metric has been added.',
          translationKey(
            'Message.ExperimentCreation.CustomMetricsDescription',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )
      : tPendingTranslation(
          'No custom metrics added yet. Add below to configure up to 3 metrics for this experiment.',
          'Empty-state description shown in the custom metrics panel when no metrics have been added.',
          translationKey(
            'Message.ExperimentCreation.CustomMetricsEmpty',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );

  const addLabel = tPendingTranslation(
    '+ Add',
    'Button label to add a custom metric in the experiment create flow.',
    translationKey(
      'Action.ExperimentCreation.AddCustomMetric',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  const editLabel = tPendingTranslation(
    'Edit metric',
    'Accessible label for the edit button on a custom metric row.',
    translationKey(
      'Action.ExperimentCreation.EditCustomMetric',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  const deleteLabel = tPendingTranslation(
    'Delete metric',
    'Accessible label for the delete button on a custom metric row.',
    translationKey(
      'Action.ExperimentCreation.DeleteCustomMetric',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  const countLabel = tPendingTranslation(
    '({count}/{max} metrics)',
    'Counter showing how many custom metrics have been added out of the maximum.',
    translationKey(
      'Message.ExperimentCreation.CustomMetricsCount',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    { count: String(fields.length), max: String(MAX_CUSTOM_METRICS) },
  );

  // Localized label for a filter dimension chip, reusing the analytics config's
  // dimension display names (the same source the explore-mode and economy /
  // funnel pages label their dimensions with) instead of a bespoke copy table.
  const filterDimensionLabel = (dimension: RAQIV2Dimension): string =>
    translate(RAQIV2DimensionDisplayConfig[dimension].name);

  // Single translation unit for the filter chip so translators control the
  // "<dimension>: <values>" formatting rather than it being concatenated here.
  const filterBadgeLabel = (dimension: RAQIV2Dimension, values: string[]): string =>
    tPendingTranslation(
      '{dimension}: {values}',
      'Filter chip on a custom metric row: a dimension name followed by its selected values.',
      translationKey(
        'Label.ExperimentCreation.CustomMetricFilterBadge',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
      { dimension: filterDimensionLabel(dimension), values: values.join(', ') },
    );

  return (
    <section
      data-testid='custom-metrics-card'
      className='flex flex-col gap-medium radius-large bg-surface-100 stroke-thin stroke-default padding-large'>
      <div className='flex flex-col gap-xxsmall'>
        <h3 className='text-heading-medium content-emphasis margin-none'>{title}</h3>
        <p className='text-body-medium content-muted margin-none'>{description}</p>
      </div>

      {fields.length > 0 && (
        <div className='flex flex-col'>
          {fields.map((field, index) => (
            <div key={field.fieldId} className='flex flex-col'>
              {index > 0 && <Divider />}
              <div className='flex flex-row items-center justify-between gap-medium padding-y-medium'>
                <div className='flex flex-col gap-xsmall min-width-0'>
                  <span className='text-body-large content-emphasis'>{field.name}</span>
                  {getDisplayableFilters(field).length > 0 && (
                    <div className='flex flex-row [flex-wrap:wrap] gap-xsmall'>
                      {getDisplayableFilters(field).map((filter) => (
                        <Badge
                          // A dimension appears at most once per metric, so it is
                          // a stable, unique key across the filter chips.
                          key={filter.dimension}
                          variant='Neutral'
                          label={filterBadgeLabel(filter.dimension, filter.values)}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className='flex flex-row items-center gap-small shrink-0'>
                  <IconButton
                    type='button'
                    variant='Utility'
                    size='Small'
                    icon='icon-regular-pencil'
                    ariaLabel={editLabel}
                    isDisabled={disabled}
                    // Edit flow is not built yet — no-op for now.
                    onClick={noop}
                  />
                  <IconButton
                    type='button'
                    variant='Utility'
                    size='Small'
                    icon='icon-regular-trash-can'
                    ariaLabel={deleteLabel}
                    isDisabled={disabled}
                    onClick={() => remove(index)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className='flex flex-row items-center gap-medium'>
        <Button
          type='button'
          variant='Standard'
          size='Small'
          isDisabled={disabled || hasReachedLimit}
          onClick={handleAdd}>
          {addLabel}
        </Button>
        {fields.length > 0 && <span className='text-body-medium content-muted'>{countLabel}</span>}
      </div>
    </section>
  );
};

export default CustomMetricsCard;
