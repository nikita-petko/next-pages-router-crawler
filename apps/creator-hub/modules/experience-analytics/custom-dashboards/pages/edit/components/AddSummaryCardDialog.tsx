import {
  type FC,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Dropdown,
  Menu,
  MenuItem,
  MenuSection,
  TextInput,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { isComboboxTypeaheadListboxTarget } from '@modules/charts-generic/components/ComboboxTypeahead';
import type { TChartConfiguratorMetrics } from '@modules/experience-analytics-shared/chartConfigurator/chartConfiguratorMetricsConfig';
import ChartConfiguratorCustomEventControls from '@modules/experience-analytics-shared/components/chartConfigurator/ChartConfiguratorCustomEventControls';
import ChartConfiguratorMetricSelector from '@modules/experience-analytics-shared/components/chartConfigurator/ChartConfiguratorMetricSelector';
import {
  customEventsMetric,
  isCustomEventsQueryReady,
} from '@modules/experience-analytics-shared/components/chartConfigurator/useChartConfiguratorSourceSelection';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import {
  getFilterValueForDimension,
  type UIFilters,
} from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/filterUtils';
import useTextFilterValidation from '@modules/experience-analytics-shared/text-filter/useTextFilterValidation';
import { getMetricLabelFromMetricLike } from '@modules/experience-analytics-shared/utils/metricLikeSemantics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  CustomDashboardSummaryCardAggregation,
  SummaryCardTitleSource,
  MAX_TILE_TITLE_LENGTH,
  type CustomDashboardSummaryCardAggregation as CustomDashboardSummaryCardAggregationValue,
  type SummaryCardTitleSource as SummaryCardTitleSourceValue,
} from '../../../types';
import {
  isSummaryCardAggregationSupported,
  resolveSupportedSummaryCardAggregation,
} from '../../../utils/summaryCardAggregation';
import { SUPPORTED_SUMMARY_CARD_EDITOR_AGGREGATIONS } from '../../chartEditor/chartTileDraft';
import useEditPageTranslations from '../useEditPageTranslations';

type SummaryAggregationLabelKey =
  | 'aggregationAverageOverTimePeriod'
  | 'aggregationMostRecentDataPoint'
  | 'aggregationCumulative';

const SUMMARY_AGGREGATION_LABEL_KEYS: Readonly<
  Record<CustomDashboardSummaryCardAggregationValue, SummaryAggregationLabelKey>
> = {
  AverageOverTimePeriod: 'aggregationAverageOverTimePeriod',
  AveragePerUniqueUser: 'aggregationAverageOverTimePeriod',
  MostRecentDataPoint: 'aggregationMostRecentDataPoint',
  Total: 'aggregationAverageOverTimePeriod',
  Median: 'aggregationAverageOverTimePeriod',
  Cumulative: 'aggregationCumulative',
};

const SUMMARY_AGGREGATION_OPTIONS = SUPPORTED_SUMMARY_CARD_EDITOR_AGGREGATIONS.map((value) => ({
  value,
  labelKey: SUMMARY_AGGREGATION_LABEL_KEYS[value],
})) satisfies ReadonlyArray<{
  readonly value: CustomDashboardSummaryCardAggregationValue;
  readonly labelKey: SummaryAggregationLabelKey;
}>;

export type AddSummaryCardDialogValue = {
  readonly title: string;
  readonly titleSource: SummaryCardTitleSourceValue;
  readonly metric: TChartConfiguratorMetrics;
  readonly aggregation: CustomDashboardSummaryCardAggregationValue;
  /** Working custom-event filters (`CustomEventName` + AggregationType). Empty for non-custom-event metrics. */
  readonly filters: UIFilters;
};

type AddSummaryCardDialogProps = {
  readonly allowedMetrics: readonly TChartConfiguratorMetrics[];
  readonly mode: 'add' | 'edit';
  readonly initialValue?: {
    readonly title?: string;
    readonly titleSource?: SummaryCardTitleSourceValue;
    readonly metric: TChartConfiguratorMetrics | null;
    readonly aggregation: CustomDashboardSummaryCardAggregationValue;
    readonly filters?: UIFilters;
  };
  readonly onCancel: () => void;
  readonly onConfirm: (value: AddSummaryCardDialogValue) => void;
};

const aggregationOptionValues: ReadonlySet<string> = new Set(
  SUMMARY_AGGREGATION_OPTIONS.map((option) => option.value),
);

function isAggregationOption(value: string): value is CustomDashboardSummaryCardAggregationValue {
  return aggregationOptionValues.has(value);
}

function useSummaryCardDialogTranslations() {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  return {
    metricLabel: tPendingTranslation(
      'Metric',
      'Section label for the metric selector inside the summary-card dialog.',
      translationKey('Label.CustomDashboards.SummaryEditor.Metric', TranslationNamespace.Analytics),
    ),
    aggregationLabel: tPendingTranslation(
      'Aggregate by',
      'Section label for the aggregation selector inside the summary-card dialog.',
      translationKey(
        'Label.CustomDashboards.SummaryEditor.Aggregation',
        TranslationNamespace.Analytics,
      ),
    ),
    selectAggregationPlaceholder: tPendingTranslation(
      'Select an aggregation',
      'Placeholder text in the summary-card aggregation dropdown before an aggregation is selected.',
      translationKey(
        'Placeholder.CustomDashboards.SummaryEditor.SelectAggregation',
        TranslationNamespace.Analytics,
      ),
    ),
    aggregationAverageOverTimePeriod: tPendingTranslation(
      'Average',
      'Summary aggregation label: Mean value across the selected time range.',
      translationKey(
        'Label.CustomDashboards.SummaryEditor.Agg.AverageOverTime',
        TranslationNamespace.Analytics,
      ),
    ),
    aggregationMostRecentDataPoint: tPendingTranslation(
      'Latest value',
      'Summary aggregation label: Latest reported data point in the time range.',
      translationKey(
        'Label.CustomDashboards.SummaryEditor.Aggregation.MostRecent',
        TranslationNamespace.Analytics,
      ),
    ),
    aggregationCumulative: tPendingTranslation(
      'Cumulative',
      'Summary aggregation label: Running cumulative value across the time range.',
      translationKey(
        'Label.CustomDashboards.SummaryEditor.Aggregation.Cumulative',
        TranslationNamespace.Analytics,
      ),
    ),
    autoTitleAverage: (metric: string) =>
      tPendingTranslation(
        'Average {metric}',
        'Auto-generated summary-card title for an averaged metric. {metric} is the selected metric name.',
        translationKey(
          'Title.CustomDashboards.SummaryCard.AutoAverage',
          TranslationNamespace.Analytics,
        ),
        { metric },
      ),
    autoTitleCumulative: (metric: string) =>
      tPendingTranslation(
        'Cumulative {metric}',
        'Auto-generated summary-card title for a cumulative metric. {metric} is the selected metric name.',
        translationKey(
          'Title.CustomDashboards.SummaryCard.AutoCumulative',
          TranslationNamespace.Analytics,
        ),
        { metric },
      ),
    autoTitleLatestValue: (metric: string) =>
      tPendingTranslation(
        'Latest {metric}',
        'Auto-generated summary-card title for the latest metric value. {metric} is the selected metric name.',
        translationKey(
          'Title.CustomDashboards.SummaryCard.AutoLatestValue',
          TranslationNamespace.Analytics,
        ),
        { metric },
      ),
  } as const;
}

function buildAutoSummaryCardTitle(
  metricLabel: string | null,
  aggregation: CustomDashboardSummaryCardAggregationValue | null,
  t: ReturnType<typeof useSummaryCardDialogTranslations>,
): string {
  if (!metricLabel) {
    return '';
  }
  if (aggregation === 'AverageOverTimePeriod') {
    return t.autoTitleAverage(metricLabel);
  }
  if (aggregation === 'Cumulative') {
    return t.autoTitleCumulative(metricLabel);
  }
  if (aggregation === 'MostRecentDataPoint') {
    return t.autoTitleLatestValue(metricLabel);
  }
  return metricLabel;
}

const AddSummaryCardDialog: FC<AddSummaryCardDialogProps> = ({
  allowedMetrics,
  mode,
  initialValue,
  onCancel,
  onConfirm,
}) => {
  const t = useEditPageTranslations();
  const summaryT = useSummaryCardDialogTranslations();
  const translationDependencies = useRAQIV2TranslationDependencies();
  const resource = useUniverseResource();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState(initialValue?.title ?? '');
  const [titleSource, setTitleSource] = useState<SummaryCardTitleSourceValue>(
    initialValue?.titleSource ??
      (initialValue?.title ? SummaryCardTitleSource.Custom : SummaryCardTitleSource.Auto),
  );
  const [metric, setMetric] = useState<TChartConfiguratorMetrics | null>(
    initialValue?.metric ?? null,
  );
  const [aggregation, setAggregation] = useState<CustomDashboardSummaryCardAggregationValue | null>(
    () => {
      const initialAggregation =
        initialValue?.aggregation ?? CustomDashboardSummaryCardAggregation.AverageOverTimePeriod;
      if (!initialValue?.metric) {
        return initialAggregation;
      }
      const resolvedAggregation = resolveSupportedSummaryCardAggregation(
        initialValue.metric,
        initialAggregation,
      );
      return resolvedAggregation && isAggregationOption(resolvedAggregation)
        ? resolvedAggregation
        : null;
    },
  );
  const [customEventFilters, setCustomEventFilters] = useState<UIFilters>(
    () => initialValue?.filters ?? [],
  );

  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, []);

  const metricOptions = useMemo(
    () =>
      allowedMetrics.filter((allowedMetric) =>
        SUMMARY_AGGREGATION_OPTIONS.some((option) =>
          isSummaryCardAggregationSupported(allowedMetric, option.value),
        ),
      ),
    [allowedMetrics],
  );
  const aggregationOptions = useMemo(
    () =>
      metric
        ? SUMMARY_AGGREGATION_OPTIONS.filter((option) =>
            isSummaryCardAggregationSupported(metric, option.value),
          )
        : SUMMARY_AGGREGATION_OPTIONS,
    [metric],
  );
  const isCustomEventsMetric = metric === customEventsMetric;
  const isCustomEventSelectionReady = isCustomEventsQueryReady(
    isCustomEventsMetric,
    metric,
    customEventFilters,
  );
  const isAddDisabled =
    !metric ||
    !aggregation ||
    !isSummaryCardAggregationSupported(metric, aggregation) ||
    !isCustomEventSelectionReady;
  const selectedCustomEventName = useMemo(
    () => getFilterValueForDimension(customEventFilters, RAQIV2Dimension.CustomEventName, null),
    [customEventFilters],
  );
  const metricLabel = useMemo(() => {
    if (!metric) {
      return null;
    }
    if (isCustomEventsMetric && selectedCustomEventName) {
      return selectedCustomEventName;
    }
    return getMetricLabelFromMetricLike(metric, translationDependencies);
  }, [isCustomEventsMetric, metric, selectedCustomEventName, translationDependencies]);
  const autoTitle = useMemo(
    () => buildAutoSummaryCardTitle(metricLabel, aggregation, summaryT),
    [aggregation, metricLabel, summaryT],
  );
  const displayTitle = titleSource === SummaryCardTitleSource.Auto ? autoTitle : title;
  const customTitleForValidation = titleSource === SummaryCardTitleSource.Custom ? title : '';
  const {
    confirmedValue: confirmedCustomTitle,
    status: titleFilterStatus,
    isBlocked: isTitleBlocked,
  } = useTextFilterValidation(customTitleForValidation, {
    initialConfirmedValue:
      initialValue?.titleSource === SummaryCardTitleSource.Custom ? (initialValue.title ?? '') : '',
  });
  const titleError = isTitleBlocked ? t.tileTitleBlockedError : undefined;
  const isTitleFilterPending = titleFilterStatus === 'pending';

  const handleAggregationChange = useCallback((nextValue: string) => {
    if (isAggregationOption(nextValue)) {
      setAggregation(nextValue);
    }
  }, []);

  const handleMetricChange = useCallback((nextMetric: TChartConfiguratorMetrics | null) => {
    setMetric(nextMetric);
    setAggregation((currentAggregation) => {
      if (!nextMetric || !currentAggregation) {
        return currentAggregation;
      }
      const resolvedAggregation = resolveSupportedSummaryCardAggregation(
        nextMetric,
        currentAggregation,
      );
      return resolvedAggregation && isAggregationOption(resolvedAggregation)
        ? resolvedAggregation
        : null;
    });
    if (nextMetric !== customEventsMetric) {
      setCustomEventFilters([]);
    }
  }, []);

  const handleTitleChange = useCallback(
    (nextTitle: string) => {
      setTitle(nextTitle);
      setTitleSource(
        nextTitle.trim() === autoTitle.trim()
          ? SummaryCardTitleSource.Auto
          : SummaryCardTitleSource.Custom,
      );
    },
    [autoTitle],
  );

  const handleConfirm = useCallback(() => {
    if (
      !metric ||
      !aggregation ||
      !isSummaryCardAggregationSupported(metric, aggregation) ||
      isTitleFilterPending ||
      isTitleBlocked ||
      !isCustomEventSelectionReady
    ) {
      return;
    }
    const resolvedTitleSource =
      title.trim().length === 0 ? SummaryCardTitleSource.Auto : titleSource;
    onConfirm({
      title: resolvedTitleSource === SummaryCardTitleSource.Auto ? autoTitle : confirmedCustomTitle,
      titleSource: resolvedTitleSource,
      metric,
      aggregation,
      filters: metric === customEventsMetric ? customEventFilters : [],
    });
  }, [
    aggregation,
    autoTitle,
    confirmedCustomTitle,
    customEventFilters,
    isCustomEventSelectionReady,
    isTitleBlocked,
    isTitleFilterPending,
    metric,
    onConfirm,
    title,
    titleSource,
  ]);

  const handleTitleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && !isAddDisabled) {
        event.preventDefault();
        handleConfirm();
      }
    },
    [handleConfirm, isAddDisabled],
  );

  // Custom-event ComboboxTypeahead portals its listbox to `document.body`.
  // Modal Dialog treats that as an outside interaction and would dismiss
  // before the option click lands — keep the dialog open for those targets.
  const preventDismissForPortaledCombobox = useCallback(
    (event: { readonly preventDefault: () => void; readonly target: EventTarget | null }) => {
      if (isComboboxTypeaheadListboxTarget(event.target)) {
        event.preventDefault();
      }
    },
    [],
  );

  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel();
        }
      }}
      size='Medium'
      isModal
      hasCloseAffordance
      closeLabel={t.addSummaryCardDialogCloseLabel}>
      <DialogContent
        className='[width:min(640px,calc(100vw-40px))] [max-width:none]'
        {...({
          onPointerDownOutside: preventDismissForPortaledCombobox,
          onFocusOutside: preventDismissForPortaledCombobox,
          onInteractOutside: preventDismissForPortaledCombobox,
        } as Record<string, unknown>)}>
        <DialogBody className='padding-x-medium padding-top-small padding-bottom-medium'>
          <DialogTitle className='text-heading-small margin-none'>
            {mode === 'edit' ? t.editSummaryCardDialogTitle : t.addSummaryCardDialogTitle}
          </DialogTitle>
          <div className='flex flex-col gap-medium padding-top-medium'>
            <TextInput
              ref={inputRef}
              size='Medium'
              label={t.addSummaryCardTitleLabel}
              placeholder={t.addSummaryCardTitlePlaceholder}
              value={displayTitle}
              maxLength={MAX_TILE_TITLE_LENGTH}
              onChange={(event) => handleTitleChange(event.target.value)}
              onKeyDown={handleTitleKeyDown}
              error={titleError}
            />
            <ChartConfiguratorMetricSelector
              options={metricOptions}
              value={metric}
              onChange={handleMetricChange}
              showCategoryLabels
              label={summaryT.metricLabel}
              placeholder={t.addSummaryCardMetricPlaceholder}
              isRequired
            />
            {isCustomEventsMetric ? (
              <ChartConfiguratorCustomEventControls
                resource={resource}
                filters={customEventFilters}
                onFiltersChange={setCustomEventFilters}
                hasEventTypeError={!isCustomEventSelectionReady}
              />
            ) : null}
            <Dropdown
              className='width-full'
              label={summaryT.aggregationLabel}
              size='Medium'
              value={aggregation ?? undefined}
              placeholder={summaryT.selectAggregationPlaceholder}
              onValueChange={handleAggregationChange}>
              <Menu>
                <MenuSection>
                  {aggregationOptions.map((option) => (
                    <MenuItem
                      key={option.value}
                      value={option.value}
                      title={summaryT[option.labelKey]}
                    />
                  ))}
                </MenuSection>
              </Menu>
            </Dropdown>
          </div>
        </DialogBody>
        <DialogFooter className='[border-top:var(--stroke-thin)_solid_var(--color-stroke-default)] padding-medium'>
          <div className='flex flex-row gap-small width-full'>
            <Button
              className='width-full'
              variant='Emphasis'
              size='Medium'
              isDisabled={isAddDisabled || isTitleFilterPending || isTitleBlocked}
              onClick={handleConfirm}>
              {mode === 'edit' ? t.editSummaryCardSaveLabel : t.addSummaryCardAddLabel}
            </Button>
            <Button className='width-full' variant='Standard' size='Medium' onClick={onCancel}>
              {t.addSummaryCardCancelLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddSummaryCardDialog;
