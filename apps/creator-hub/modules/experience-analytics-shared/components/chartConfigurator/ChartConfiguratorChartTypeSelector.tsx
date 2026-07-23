import type { FC } from 'react';
import React, { useMemo } from 'react';
import type { TTailwindIconClass } from '@rbx/foundation-tailwind/classes';
import { OptionSelector, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { makeStyles } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ChartConfiguratorChartType } from '../../chartConfigurator/ChartConfiguratorChartTypes';
import {
  UnsupportedL7SmoothingCumulativeGranularityReason,
  type ChartTypeMetricSupport,
} from '../../chartConfigurator/isChartTypeSupportedForMetric';

type ChartTypeOption = {
  type: ChartConfiguratorChartType;
  label: string;
  icon: TTailwindIconClass;
};

type ChartConfiguratorChartTypeSelectorProps = {
  value: ChartConfiguratorChartType;
  onChange: (chartType: ChartConfiguratorChartType) => void;
  availableTypes: readonly ChartConfiguratorChartType[];
  supportedTypes: readonly ChartConfiguratorChartType[];
  chartTypeSupport: Record<ChartConfiguratorChartType, ChartTypeMetricSupport>;
};

const useStyles = makeStyles()(() => ({
  labelClassName: {
    fontSize: '14px',
    fontWeight: 700,
    lineHeight: '20px',
    marginBottom: '12px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  tooltipContent: {
    maxWidth: '192px',
    whiteSpace: 'normal' as const,
  },
}));

const ChartConfiguratorChartTypeSelector: FC<ChartConfiguratorChartTypeSelectorProps> = ({
  value,
  onChange,
  availableTypes,
  supportedTypes,
  chartTypeSupport,
}) => {
  const {
    classes: { labelClassName, grid, tooltipContent },
  } = useStyles();
  const { tPendingTranslation, translate } = useTranslationWrapper(useTranslation());
  const chartTypeLabel = tPendingTranslation(
    'Chart type',
    'Section label for selecting the chart visualization type.',
    translationKey('Label.ExploreMode.ChartType', TranslationNamespace.Analytics),
  );

  const allOptions: readonly ChartTypeOption[] = useMemo(
    () => [
      {
        type: ChartType.Spline,
        label: tPendingTranslation(
          'Line chart',
          'Option label for the line chart visualization type.',
          translationKey('Label.ExploreMode.ChartType.LineChart', TranslationNamespace.Analytics),
        ),
        icon: 'icon-regular-chart-line' as const satisfies TTailwindIconClass,
      },
      {
        type: ChartType.Area,
        label: tPendingTranslation(
          'Area chart',
          'Option label for the area chart visualization type.',
          translationKey('Label.ExploreMode.ChartType.AreaChart', TranslationNamespace.Analytics),
        ),
        icon: 'icon-regular-chart-line' as const satisfies TTailwindIconClass,
      },
      {
        type: ChartType.Bar,
        label: tPendingTranslation(
          'Horizontal bar',
          'Option label for the bar chart visualization type.',
          translationKey('Label.ExploreMode.ChartType.BarChart', TranslationNamespace.Analytics),
        ),
        icon: 'icon-regular-chart-three-vertical-bars' as const satisfies TTailwindIconClass,
      },
      {
        type: ChartType.Column,
        label: tPendingTranslation(
          'Stacked column',
          'Option label for the histogram (column) chart visualization type.',
          translationKey('Label.ExploreMode.ChartType.Histogram', TranslationNamespace.Analytics),
        ),
        icon: 'icon-regular-chart-four-vertical-bars' as const satisfies TTailwindIconClass,
      },
      {
        type: ChartType.DurationSpline,
        label: tPendingTranslation(
          'Duration line',
          'Option label for the duration line chart visualization type, used for bucket-based metrics.',
          translationKey(
            'Label.ExploreMode.ChartType.DurationLineChart',
            TranslationNamespace.Analytics,
          ),
        ),
        icon: 'icon-regular-chart-line' as const satisfies TTailwindIconClass,
      },
      {
        type: ChartType.DurationArea,
        label: tPendingTranslation(
          'Duration area',
          'Option label for the duration area chart visualization type, used for bucket-based metrics.',
          translationKey(
            'Label.ExploreMode.ChartType.DurationAreaChart',
            TranslationNamespace.Analytics,
          ),
        ),
        icon: 'icon-regular-chart-line' as const satisfies TTailwindIconClass,
      },
      {
        type: ChartType.Pie,
        label: tPendingTranslation(
          'Pie chart',
          'Option label for the pie chart visualization type.',
          translationKey('Label.ExploreMode.ChartType.PieChart', TranslationNamespace.Analytics),
        ),
        icon: 'icon-regular-chart-pie' as const satisfies TTailwindIconClass,
      },
      {
        type: ChartType.Table,
        label: tPendingTranslation(
          'Table',
          'Option label for the table visualization type.',
          translationKey('Label.ExploreMode.ChartType.Table', TranslationNamespace.Analytics),
        ),
        icon: 'icon-regular-grid' as const satisfies TTailwindIconClass,
      },
    ],
    [tPendingTranslation],
  );

  const visibleOptions = useMemo(
    () => allOptions.filter((opt) => availableTypes.includes(opt.type)),
    [allOptions, availableTypes],
  );

  const disabledTooltipByUnsupportedReasonKey = useMemo(
    () =>
      new Map([
        [
          UnsupportedL7SmoothingCumulativeGranularityReason.key,
          tPendingTranslation(
            'Rolling average is not available for cumulative metrics',
            'Tooltip shown when the L7 smoothing option is disabled because cumulative granularity is selected.',
            translationKey(
              'Label.ExploreMode.Smoothing.L7CumulativeDisabled',
              TranslationNamespace.Analytics,
            ),
          ),
        ],
      ]),
    [tPendingTranslation],
  );

  return (
    <div>
      <div className={labelClassName}>{chartTypeLabel}</div>
      <div className={grid}>
        {visibleOptions.map(({ type, label, icon }) => {
          const isDisabled = !supportedTypes.includes(type);
          const isSelected = value === type;
          const support = chartTypeSupport[type];
          const disabledTooltipTitle = support.isSupported
            ? undefined
            : (disabledTooltipByUnsupportedReasonKey.get(support.unsupportedReason.key) ??
              translate(support.unsupportedReason));
          const selector = (
            <OptionSelector
              layout='Horizontal'
              size='XSmall'
              type='Checkmark'
              label={label}
              icon={icon}
              isSelected={isSelected}
              isDisabled={isDisabled}
              onSelect={() => onChange(type)}
            />
          );

          if (isDisabled && disabledTooltipTitle) {
            return (
              <Tooltip
                key={type}
                title={disabledTooltipTitle}
                position='top-center'
                contentClassName={tooltipContent}>
                <TooltipTrigger asChild>
                  <span>{selector}</span>
                </TooltipTrigger>
              </Tooltip>
            );
          }

          return <React.Fragment key={type}>{selector}</React.Fragment>;
        })}
      </div>
    </div>
  );
};

export default ChartConfiguratorChartTypeSelector;
