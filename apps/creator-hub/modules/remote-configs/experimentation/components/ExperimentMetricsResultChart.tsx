import React, { FC, useState, useCallback, useMemo } from 'react';
import { RAQIV2MetricGranularity, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { Autocomplete, Grid, TextField } from '@rbx/ui';
import {
  getAnalyticsMetricDisplayConfig,
  RAQIV2ChartSpec,
  RAQIV2GenericChart,
  useUniverseResource,
} from '@modules/experience-analytics-shared';
import {
  TranslationKey,
  translationKey,
  useTranslationWrapper,
} from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ChartType, NonEmptyArray } from '@modules/charts-generic';
import { useTranslation } from '@rbx/intl';
import { ChartAbnormalStatus, SingleChartCardContainer } from '@rbx/analytics-ui';
import { ExperimentMetric } from '../../api/universeExperimentationClientEnums';
import { ExperimentMetricToRAQIV2Metric } from '../../api/makeValidatedExperimentationAPI';

// Do not display chart summaries
const emptySummarySpec = {
  totalSummaryTypes: [],
  perBreakdownSummaryTypes: [],
  aggregatedBreakdownSummaryTypes: [],
};

type ExperimentMetricsResultChartProps = {
  experimentId: string;
  metrics: NonEmptyArray<ExperimentMetric>;
  timeSpec: {
    startTime: Date;
    endTime: Date;
  };
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
        hideComparisonChip
        displayOptions={{ hideTotalSeriesInChart: true }}
      />
    );
  }, [chartSpec, definitionTooltipKey, isSRMDetected, titleKey, translate]);

  return (
    <React.Fragment>
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
    </React.Fragment>
  );
};

export default ExperimentMetricsResultChart;
