import React, { FC, useMemo } from 'react';
import { ChartType } from '@modules/charts-generic';
import { makeStyles } from '@rbx/ui';
import { OptionSelector, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { TTailwindIconClass } from '@rbx/foundation-tailwind/classes';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import {
  type ExploreModeChartType,
  type ChartTypeMetricSupport,
} from '@modules/experience-analytics-shared';

type ChartTypeOption = {
  type: ExploreModeChartType;
  label: string;
  icon: TTailwindIconClass;
};

type ExploreModeChartTypeSelectorProps = {
  value: ExploreModeChartType;
  onChange: (chartType: ExploreModeChartType) => void;
  availableTypes: readonly ExploreModeChartType[];
  supportedTypes: readonly ExploreModeChartType[];
  chartTypeSupport: Record<ExploreModeChartType, ChartTypeMetricSupport>;
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

const ExploreModeChartTypeSelector: FC<ExploreModeChartTypeSelectorProps> = ({
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
        type: 'Table' as const,
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
            : translate(support.unsupportedReason);
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

export default ExploreModeChartTypeSelector;
