import type { FunctionComponent } from 'react';
import { useCallback, useRef, useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { RAQIV2DimensionDisplayConfig } from '@rbx/creator-hub-analytics-config';
import type { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { Badge, Button, Divider, IconButton } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { CustomMetric } from '../types/CustomMetric';
import { MAX_CUSTOM_METRICS } from '../types/CustomMetric';
import type { SetupStepFormData } from '../types/FormData';
import { draftToMetric } from '../utils/customMetricDraft';
import type { CustomMetricDraft } from '../utils/customMetricDraft';
import { getDisplayableFilters } from '../utils/customMetricOptions';
import CustomMetricDrawer from './CustomMetricDrawer';

type CustomMetricsCardProps = {
  disabled?: boolean;
};

// Which metric (if any) the create/edit drawer is currently open for.
type DrawerState = { mode: 'add' } | { mode: 'edit'; index: number; metric: CustomMetric };

/**
 * "Custom metrics" panel shown underneath the metric set selector when the
 * creator has picked the `Custom` metric set. Guides the creator to define up
 * to {@link MAX_CUSTOM_METRICS} custom metrics: it lists the metrics they have
 * added (with edit/delete affordances) and offers a "+ Add" button that opens
 * the {@link CustomMetricDrawer} for creating or editing a single metric.
 *
 * Presentational only — it does not render its own layout wrapper, and gating
 * (flag + `metricTemplateType === Custom`) is the consumer's responsibility. The
 * metrics are captured in the form but not yet sent to the backend (UI-only
 * phase of the custom metrics & experiment templates work).
 */
const CustomMetricsCard: FunctionComponent<CustomMetricsCardProps> = ({ disabled = false }) => {
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { control } = useFormContext<SetupStepFormData>();
  const { fields, append, remove, update } = useFieldArray<
    SetupStepFormData,
    'customMetrics',
    'fieldId'
  >({
    control,
    name: 'customMetrics',
    keyName: 'fieldId',
  });

  const [drawerState, setDrawerState] = useState<DrawerState | null>(null);

  // Monotonic counter for generating stable, unique client-side ids for newly
  // created metrics (Date.now()/Math.random() are intentionally avoided so
  // behavior stays deterministic in tests and storybook).
  const nextIdRef = useRef(0);

  const hasReachedLimit = fields.length >= MAX_CUSTOM_METRICS;

  const handleAdd = useCallback(() => {
    if (hasReachedLimit) {
      return;
    }
    setDrawerState({ mode: 'add' });
  }, [hasReachedLimit]);

  const handleEdit = useCallback(
    (index: number, metric: CustomMetric) => {
      setDrawerState({ mode: 'edit', index, metric });
    },
    [setDrawerState],
  );

  const handleCloseDrawer = useCallback(() => {
    setDrawerState(null);
  }, []);

  const handleSaveMetric = useCallback(
    (draft: CustomMetricDraft) => {
      if (!drawerState) {
        return;
      }
      if (drawerState.mode === 'add') {
        const insertionIndex = nextIdRef.current;
        nextIdRef.current += 1;
        append(draftToMetric(draft, `custom-metric-${insertionIndex}`));
      } else {
        update(drawerState.index, draftToMetric(draft, drawerState.metric.id));
      }
    },
    [drawerState, append, update],
  );

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
                    onClick={() => handleEdit(index, field)}
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

      <CustomMetricDrawer
        open={drawerState !== null}
        mode={drawerState?.mode ?? 'add'}
        initialMetric={drawerState?.mode === 'edit' ? drawerState.metric : undefined}
        onClose={handleCloseDrawer}
        onSave={handleSaveMetric}
        disabled={disabled}
      />
    </section>
  );
};

export default CustomMetricsCard;
