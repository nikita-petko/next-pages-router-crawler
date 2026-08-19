import {
  type FC,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RAQIV2Dimension, RAQIV2UIPseudoDimension } from '@rbx/creator-hub-analytics-config';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Divider,
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
import getDimensionRenderer from '@modules/experience-analytics-shared/components/getDimensionRenderer';
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
  | 'aggregationAverageOverDailyData'
  | 'aggregationMostRecentDataPoint'
  | 'aggregationCumulative';

type SummaryCardEditorAggregation = (typeof SUPPORTED_SUMMARY_CARD_EDITOR_AGGREGATIONS)[number];

const SUMMARY_AGGREGATION_LABEL_KEYS: Readonly<
  Record<SummaryCardEditorAggregation, SummaryAggregationLabelKey>
> = {
  AverageOverTimePeriod: 'aggregationAverageOverDailyData',
  MostRecentDataPoint: 'aggregationMostRecentDataPoint',
  Cumulative: 'aggregationCumulative',
};

const SUMMARY_AGGREGATION_OPTIONS = SUPPORTED_SUMMARY_CARD_EDITOR_AGGREGATIONS.map((value) => ({
  value,
  labelKey: SUMMARY_AGGREGATION_LABEL_KEYS[value],
})) satisfies ReadonlyArray<{
  readonly value: SummaryCardEditorAggregation;
  readonly labelKey: SummaryAggregationLabelKey;
}>;

const SummaryTimeInterval = {
  Daily: 'Daily',
  Cumulative: 'Cumulative',
} as const;

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

function isAggregationOption(value: string): value is SummaryCardEditorAggregation {
  return aggregationOptionValues.has(value);
}

function useSummaryCardDialogTranslations() {
  const { tPendingTranslation, translate } = useTranslationWrapper(useTranslation());
  return {
    metricLabel: tPendingTranslation(
      'Metric',
      'Section label for the metric selector inside the summary-card dialog.',
      translationKey('Label.CustomDashboards.SummaryEditor.Metric', TranslationNamespace.Analytics),
    ),
    aggregationLabel: tPendingTranslation(
      'Summarize by',
      'Section label for the aggregation selector inside the summary-card dialog.',
      translationKey(
        'Label.CustomDashboards.SummaryEditor.Aggregation',
        TranslationNamespace.Analytics,
      ),
    ),
    timeIntervalLabel: translate(
      translationKey('Label.ExploreMode.TimeInterval', TranslationNamespace.Analytics),
    ),
    dailyIntervalLabel: translate(
      translationKey('Label.Granularity.Daily', TranslationNamespace.Analytics),
    ),
    cumulativeIntervalLabel: translate(
      translationKey('Label.Granularity.Cumulative', TranslationNamespace.Analytics),
    ),
    selectAggregationPlaceholder: tPendingTranslation(
      'Select an aggregation',
      'Placeholder text in the summary-card aggregation dropdown before an aggregation is selected.',
      translationKey(
        'Placeholder.CustomDashboards.SummaryEditor.SelectAggregation',
        TranslationNamespace.Analytics,
      ),
    ),
    aggregationAverageOverDailyData: tPendingTranslation(
      'Daily average over selected period',
      'Label for an average calculated from daily data across the selected time range.',
      translationKey('Label.AverageDailyDataSelectedPeriod', TranslationNamespace.Analytics),
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
    formatAutoTitle: (metric: string, summarizeBy: string) =>
      tPendingTranslation(
        '{metric} ({summarizeBy})',
        'Auto-generated summary-card title. {metric} is the selected metric name and {summarizeBy} is the localized aggregation label.',
        translationKey(
          'Title.CustomDashboards.SummaryCard.AutoWithAggregation',
          TranslationNamespace.Analytics,
        ),
        { metric, summarizeBy },
      ),
    formatAutoCustomEventTitle: (metric: string, eventAggregation: string, summarizeBy: string) =>
      tPendingTranslation(
        '{metric} ({eventAggregation}) ({summarizeBy})',
        'Auto-generated custom-event summary-card title. {metric} is the event name, {eventAggregation} is the event aggregation label, and {summarizeBy} is the localized summary aggregation label.',
        translationKey(
          'Title.CustomDashboards.SummaryCard.AutoCustomEvent',
          TranslationNamespace.Analytics,
        ),
        { eventAggregation, metric, summarizeBy },
      ),
  } as const;
}

export type SummaryCardTitleTranslations = Pick<
  ReturnType<typeof useSummaryCardDialogTranslations>,
  SummaryAggregationLabelKey | 'formatAutoTitle' | 'formatAutoCustomEventTitle'
>;

export function buildAutoSummaryCardTitle(
  metricLabel: string | null,
  aggregation: SummaryCardEditorAggregation | null,
  customEventAggregationLabel: string | null,
  t: SummaryCardTitleTranslations,
): string {
  if (!metricLabel || !aggregation) {
    return '';
  }
  const summarizeBy = t[SUMMARY_AGGREGATION_LABEL_KEYS[aggregation]];
  return customEventAggregationLabel
    ? t.formatAutoCustomEventTitle(metricLabel, customEventAggregationLabel, summarizeBy)
    : t.formatAutoTitle(metricLabel, summarizeBy);
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
  const [aggregation, setAggregation] = useState<SummaryCardEditorAggregation | null>(() => {
    const initialAggregation =
      initialValue?.aggregation ?? CustomDashboardSummaryCardAggregation.AverageOverTimePeriod;
    const resolvedAggregation = initialValue?.metric
      ? resolveSupportedSummaryCardAggregation(initialValue.metric, initialAggregation)
      : initialAggregation;
    return resolvedAggregation && isAggregationOption(resolvedAggregation)
      ? resolvedAggregation
      : null;
  });
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
  const timeInterval =
    aggregation === CustomDashboardSummaryCardAggregation.Cumulative
      ? SummaryTimeInterval.Cumulative
      : SummaryTimeInterval.Daily;
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
  const selectedCustomEventAggregation = useMemo(
    () =>
      getFilterValueForDimension(customEventFilters, RAQIV2UIPseudoDimension.AggregationType, null),
    [customEventFilters],
  );
  const selectedCustomEventAggregationLabel = useMemo(() => {
    if (!isCustomEventsMetric || !selectedCustomEventAggregation) {
      return null;
    }
    return getDimensionRenderer(RAQIV2UIPseudoDimension.AggregationType).getBreakdownValueName(
      { value: selectedCustomEventAggregation },
      translationDependencies,
    );
  }, [isCustomEventsMetric, selectedCustomEventAggregation, translationDependencies]);
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
    () =>
      buildAutoSummaryCardTitle(
        metricLabel,
        aggregation,
        selectedCustomEventAggregationLabel,
        summaryT,
      ),
    [aggregation, metricLabel, selectedCustomEventAggregationLabel, summaryT],
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

  const handleTimeIntervalChange = useCallback(
    (nextValue: string) => {
      if (nextValue === SummaryTimeInterval.Cumulative) {
        if (
          metric &&
          isSummaryCardAggregationSupported(
            metric,
            CustomDashboardSummaryCardAggregation.Cumulative,
          )
        ) {
          setAggregation(CustomDashboardSummaryCardAggregation.Cumulative);
        }
        return;
      }
      if (nextValue === SummaryTimeInterval.Daily && metric) {
        const nextAggregation = [
          CustomDashboardSummaryCardAggregation.AverageOverTimePeriod,
          CustomDashboardSummaryCardAggregation.MostRecentDataPoint,
        ].find((candidate) => isSummaryCardAggregationSupported(metric, candidate));
        if (nextAggregation) {
          setAggregation(nextAggregation);
        }
      }
    },
    [metric],
  );

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
            <Divider variant='Standard' />
            <Dropdown
              className='width-full'
              label={summaryT.timeIntervalLabel}
              size='Medium'
              value={timeInterval}
              placeholder={summaryT.timeIntervalLabel}
              onValueChange={handleTimeIntervalChange}>
              <Menu>
                <MenuSection>
                  <MenuItem
                    value={SummaryTimeInterval.Daily}
                    title={summaryT.dailyIntervalLabel}
                    disabled={
                      !!metric &&
                      !isSummaryCardAggregationSupported(
                        metric,
                        CustomDashboardSummaryCardAggregation.AverageOverTimePeriod,
                      ) &&
                      !isSummaryCardAggregationSupported(
                        metric,
                        CustomDashboardSummaryCardAggregation.MostRecentDataPoint,
                      )
                    }
                  />
                  <MenuItem
                    value={SummaryTimeInterval.Cumulative}
                    title={summaryT.cumulativeIntervalLabel}
                    disabled={
                      !!metric &&
                      !isSummaryCardAggregationSupported(
                        metric,
                        CustomDashboardSummaryCardAggregation.Cumulative,
                      )
                    }
                  />
                </MenuSection>
              </Menu>
            </Dropdown>
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
