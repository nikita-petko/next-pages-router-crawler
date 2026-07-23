import React, { FC, useMemo } from 'react';
import {
  Dropdown,
  Icon,
  Menu,
  MenuItem,
  MenuSection,
  Radio,
  RadioGroup,
  Tooltip,
  TooltipTrigger,
  type TMenuItemProps,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import {
  BenchmarkType,
  type BenchmarkOverlayType,
  type OverlayAvailability,
  type OverlayDisabledReason,
} from '@modules/experience-analytics-shared';

export type OverlayOption = 'none' | 'benchmarks' | 'period-over-period' | 'trend-line';

const BENCHMARK_DEFAULT_VALUE = 'default';

type ExploreModeOverlaysControlProps = {
  value: OverlayOption;
  onChange: (value: OverlayOption) => void;
  benchmarkType: BenchmarkOverlayType | null;
  onBenchmarkTypeChange: (benchmarkType: BenchmarkOverlayType | null) => void;
  availableBenchmarkTypes?: readonly BenchmarkOverlayType[];
  availability: OverlayAvailability;
};

const OverlayRadio: FC<{
  value: string;
  label: string;
  isDisabled?: boolean;
  tooltipText?: string;
}> = ({ value, label, isDisabled, tooltipText }) => {
  const radio = <Radio value={value} label={label} isDisabled={isDisabled} />;
  if (!isDisabled || !tooltipText) return radio;
  return (
    <Tooltip title={tooltipText} position='top-start'>
      <TooltipTrigger asChild>
        <span className='self-start'>{radio}</span>
      </TooltipTrigger>
    </Tooltip>
  );
};

const ExploreModeOverlaysControl: FC<ExploreModeOverlaysControlProps> = ({
  value,
  onChange,
  benchmarkType,
  onBenchmarkTypeChange,
  availableBenchmarkTypes = [],
  availability,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const overlaysLabel = tPendingTranslation(
    'Overlays',
    'Group label for the chart overlay options radio group.',
    translationKey('Label.ExploreMode.Overlays', TranslationNamespace.Analytics),
  );
  const noneLabel = tPendingTranslation(
    'None',
    'Default view for the chart.',
    translationKey('Label.ExploreMode.Overlay.None', TranslationNamespace.Analytics),
  );
  const benchmarksLabel = tPendingTranslation(
    'Benchmarks',
    'Radio option to show benchmark overlays on the chart.',
    translationKey('Label.ExploreMode.Overlay.Benchmarks', TranslationNamespace.Analytics),
  );
  const periodOverPeriodLabel = tPendingTranslation(
    'Period-over-period',
    'Radio option to show a period-over-period comparison overlay on the chart.',
    translationKey('Label.ExploreMode.Overlay.PeriodOverPeriod', TranslationNamespace.Analytics),
  );
  const trendLineLabel = tPendingTranslation(
    'Trend line',
    'Radio option to show a trend line overlay on the chart.',
    translationKey('Label.ExploreMode.Overlay.TrendLine', TranslationNamespace.Analytics),
  );
  const benchmarkTypeLabel = tPendingTranslation(
    'Benchmark type',
    'Dropdown label for selecting which type of benchmark to display.',
    translationKey('Label.ExploreMode.BenchmarkType', TranslationNamespace.Analytics),
  );
  const genreBenchmarkTypeLabel = tPendingTranslation(
    'Genre benchmark',
    'Label for range benchmarks in creator analytics that are derived from experiences in the same internally-labeled genre as the visible experience',
    translationKey('Label.BenchmarkSource.Genre', TranslationNamespace.Analytics),
  );
  const similarityBenchmarkTypeLabel = tPendingTranslation(
    'Similarity benchmark',
    'Label for similarity benchmarks in creator analytics that are derived from experiences in the same internally-labeled genre as the visible experience',
    translationKey('Label.BenchmarkSource.Similarity.Short', TranslationNamespace.Analytics),
  );
  const defaultBenchmarkTypeLabel = tPendingTranslation(
    'Default',
    'Option label for the default benchmark type when no specific benchmark source is selected.',
    translationKey('Label.BenchmarkSource.Default', TranslationNamespace.Analytics),
  );

  const disabledReasonText: Record<OverlayDisabledReason, string> = useMemo(
    () => ({
      chartType: tPendingTranslation(
        'Overlays are only available on line charts',
        'Tooltip explaining why chart overlays are disabled for the current chart type.',
        translationKey(
          'Tooltip.ExploreMode.Overlay.Disabled.ChartType',
          TranslationNamespace.Analytics,
        ),
      ),
      breakdown: tPendingTranslation(
        'Unavailable with breakdowns',
        'Tooltip explaining why this overlay is disabled when a breakdown dimension is active.',
        translationKey(
          'Tooltip.ExploreMode.Overlay.Disabled.Breakdown',
          TranslationNamespace.Analytics,
        ),
      ),
      granularity: tPendingTranslation(
        'Benchmarks require daily granularity',
        'Tooltip explaining why benchmarks are disabled when a non-daily granularity is selected.',
        translationKey(
          'Tooltip.ExploreMode.Overlay.Disabled.Granularity',
          TranslationNamespace.Analytics,
        ),
      ),
      benchmarkContext: tPendingTranslation(
        'Benchmarks are not available for this configuration',
        'Tooltip explaining why benchmarks are disabled for the current metric and filter configuration.',
        translationKey(
          'Tooltip.ExploreMode.Overlay.Disabled.BenchmarkContext',
          TranslationNamespace.Analytics,
        ),
      ),
      noBenchmarkData: tPendingTranslation(
        'Benchmarks are not available for this metric',
        'Tooltip explaining why benchmarks are disabled because the benchmark API returned no data for this metric.',
        translationKey(
          'Tooltip.ExploreMode.Overlay.Disabled.NoBenchmarkData',
          TranslationNamespace.Analytics,
        ),
      ),
    }),
    [tPendingTranslation],
  );

  const getTooltipText = (reason?: OverlayDisabledReason): string | undefined =>
    reason ? disabledReasonText[reason] : undefined;

  const dropdownValue = benchmarkType ?? BENCHMARK_DEFAULT_VALUE;
  const shouldShowBenchmarkTypeSelector =
    value === 'benchmarks' && availableBenchmarkTypes.length > 1;

  const handleBenchmarkTypeChange = (v: string) => {
    onBenchmarkTypeChange(v === BENCHMARK_DEFAULT_VALUE ? null : (v as BenchmarkOverlayType));
  };

  const benchmarkMenuItems = useMemo(() => {
    const benchmarkTypeLabels: Record<string, string> = {
      [BenchmarkType.Genre]: genreBenchmarkTypeLabel,
      [BenchmarkType.Similarity]: similarityBenchmarkTypeLabel,
      [BENCHMARK_DEFAULT_VALUE]: defaultBenchmarkTypeLabel,
    };
    const items: React.ReactElement<TMenuItemProps>[] = [
      <MenuItem
        key={BENCHMARK_DEFAULT_VALUE}
        value={BENCHMARK_DEFAULT_VALUE}
        title={defaultBenchmarkTypeLabel}
        trailing={
          dropdownValue === BENCHMARK_DEFAULT_VALUE ? (
            <Icon name='icon-filled-check' size='Medium' />
          ) : undefined
        }
      />,
      ...availableBenchmarkTypes.map((type) => (
        <MenuItem
          key={type}
          value={type}
          title={benchmarkTypeLabels[type]}
          trailing={
            dropdownValue === type ? <Icon name='icon-filled-check' size='Medium' /> : undefined
          }
        />
      )),
    ];
    return items;
  }, [
    availableBenchmarkTypes,
    defaultBenchmarkTypeLabel,
    dropdownValue,
    genreBenchmarkTypeLabel,
    similarityBenchmarkTypeLabel,
  ]);

  const benchmarkStatus = availability.benchmark;
  const comparisonStatus = availability.comparison;
  const trendLineStatus = availability['trend-line'];

  return (
    <RadioGroup
      groupLabel={overlaysLabel}
      size='Small'
      value={value}
      onValueChange={(v) => onChange(v as OverlayOption)}>
      <Radio value='none' label={noneLabel} />
      {benchmarkStatus.applicable && (
        <OverlayRadio
          value='benchmarks'
          label={benchmarksLabel}
          isDisabled={benchmarkStatus.disabled}
          tooltipText={getTooltipText(benchmarkStatus.reason)}
        />
      )}
      {shouldShowBenchmarkTypeSelector && (
        <div style={{ paddingLeft: 32 }}>
          <Dropdown
            size='Medium'
            placeholder={benchmarkTypeLabel}
            value={dropdownValue}
            onValueChange={handleBenchmarkTypeChange}>
            <Menu>
              <MenuSection>{benchmarkMenuItems}</MenuSection>
            </Menu>
          </Dropdown>
        </div>
      )}
      <OverlayRadio
        value='period-over-period'
        label={periodOverPeriodLabel}
        isDisabled={comparisonStatus.disabled}
        tooltipText={getTooltipText(comparisonStatus.reason)}
      />
      {trendLineStatus.applicable && (
        <OverlayRadio
          value='trend-line'
          label={trendLineLabel}
          isDisabled={trendLineStatus.disabled}
          tooltipText={getTooltipText(trendLineStatus.reason)}
        />
      )}
    </RadioGroup>
  );
};

export default ExploreModeOverlaysControl;
