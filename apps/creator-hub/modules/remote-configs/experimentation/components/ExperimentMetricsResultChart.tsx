import type { FC } from 'react';
import React, { useState, useCallback, useMemo } from 'react';
import { ChartAbnormalStatus, SingleChartCardContainer } from '@rbx/analytics-ui';
import { RAQIV2MetricGranularity, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { useTranslation } from '@rbx/intl';
import { Autocomplete, Grid, TextField } from '@rbx/ui';
import type { TranslationKey } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { TExplicitTimeRangeSpec } from '@modules/charts-generic/charts/types/ChartTypes';
import type { NonEmptyArray } from '@modules/charts-generic/types/NonEmptyArray';
import RAQIV2GenericChart from '@modules/experience-analytics-shared/components/RAQIV2/RAQIV2GenericChart';
import getAnalyticsMetricDisplayConfig from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import type RAQIV2ChartSpec from '@modules/experience-analytics-shared/types/RAQIV2ChartSpec';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ExperimentMetricToRAQIV2Metric } from '../../api/makeValidatedExperimentationAPI';
import type { ExperimentMetric } from '../../api/universeExperimentationClientEnums';

// Do not display chart summaries
const emptySummarySpec = {
  totalSummaryTypes: [],
  perBreakdownSummaryTypes: [],
  aggregatedBreakdownSummaryTypes: [],
};
const comparisonWithoutChip = { chip: false } as const;

type ExperimentMetricsResultChartProps = {
  experimentId: string;
  metrics: NonEmptyArray<ExperimentMetric>;
  timeSpec: TExplicitTimeRangeSpec;
  isSRMDetected?: boolean;
};

const ExperimentMetricsResultChart: FC<ExperimentMetricsResultChartProps> = ({
  experimentId,
  metrics,
  timeSpec,
  isSRMDetected,
}) => {
  const resource = useUniverseResource();
  const { translate } = useTranslationWrapper(useTranslation());

  const [metric, setMetric] = useState<ExperimentMetric>(metrics[0]);
  const onValueChange = useCallback((event: React.SyntheticEvent, value: ExperimentMetric) => {
    setMetric(value);
  }, []);
  const renderInput = useCallback<
    NonNullable<React.ComponentProps<typeof Autocomplete>['renderInput']>
  >(
    (params) => (
      <TextField
        {...params}
        id='values'
        label={translate(
          translationKey('Label.Metric', TranslationNamespace.UniverseConfigAndExperimentation),
        )}
      />
    ),
    [translate],
  );
  const getOptionLabel = useCallback(
    (option: ExperimentMetric) => {
      const raqiMetric = ExperimentMetricToRAQIV2Metric[option];
      return translate(getAnalyticsMetricDisplayConfig(raqiMetric).localizedName);
    },
    [translate],
  );

  const {
    chartSpec,
    titleKey,
    definitionTooltipKey,
  }: {
    chartSpec: RAQIV2ChartSpec;
    titleKey: TranslationKey;
    definitionTooltipKey: TranslationKey;
  } = useMemo(() => {
    const raqiMetric = ExperimentMetricToRAQIV2Metric[metric];
    const metricConfig = getAnalyticsMetricDisplayConfig(raqiMetric);
    return {
      chartSpec: {
        resource,
        timeSpec,
        metric: raqiMetric,
        breakdown: [RAQIV2Dimension.ExperimentVariant],
        granularity: RAQIV2MetricGranularity.OneDay,
        filter: [{ dimension: RAQIV2Dimension.Experiment, values: [experimentId] }],
        timeAxisBounds: 'disabled',
      },
      titleKey: translationKey(
        `Title.Chart.${raqiMetric}`,
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
      definitionTooltipKey: metricConfig.localizedDescription,
    };
  }, [experimentId, metric, resource, timeSpec]);

  const chart = useMemo(() => {
    return isSRMDetected ? (
      <SingleChartCardContainer
        titleLabel={translate(titleKey)}
        chartSummarySpecs={emptySummarySpec.totalSummaryTypes}
        abnormalState={{
          status: ChartAbnormalStatus.NoData,
          description: translate(
            translationKey('Message.NoData', TranslationNamespace.UniverseConfigAndExperimentation),
          ),
        }}>
        <div style={{ height: 360 }} />
      </SingleChartCardContainer>
    ) : (
      <RAQIV2GenericChart
        titleKey={titleKey}
        definitionTooltipKey={definitionTooltipKey}
        spec={chartSpec}
        chartKeyOrConfig={null}
        onSelectChartRegion={null}
        chartType={ChartType.Spline}
        summarySpec={emptySummarySpec}
        comparison={comparisonWithoutChip}
        displayOptions={{ hideTotalSeriesInChart: true }}
      />
    );
  }, [chartSpec, definitionTooltipKey, isSRMDetected, titleKey, translate]);

  return (
    <>
      <Grid item minWidth={220}>
        <Autocomplete
          value={metric}
          disableClearable
          onChange={onValueChange}
          options={metrics}
          renderInput={renderInput}
          getOptionLabel={getOptionLabel}
          fullWidth
        />
      </Grid>
      <Grid item XSmall={12}>
        {chart}
      </Grid>
    </>
  );
};

export default ExperimentMetricsResultChart;
