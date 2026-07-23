import type { FC } from 'react';
import { useRef, useMemo, memo } from 'react';
import { subDays } from '@rbx/core';
import { RAQIV2DateRangeType, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import useComponentSize from '@modules/charts-generic/components/useComponentSize';
import { getCurrentDate } from '@modules/charts-generic/utils/dateUtils';
import AnalyticsComponent from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsComponent';
import GenericAnalyticsLayoutItem from '@modules/experience-analytics-shared/components/RAQIV2/layout/GenericAnalyticsLayoutItem';
import { getControlledSubcontextConfigExperienceAnalyticsSnapshotV2 } from '@modules/experience-analytics-shared/constants/chart-configs/PredefinedSubcontextConfigLiterals';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useMetricLatestAvailableTime from '@modules/experience-analytics-shared/hooks/useMetricLatestAvailableTime';
import useOnSelectChartRegion from '@modules/experience-analytics-shared/hooks/useOnSelectChartRegion';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import getPredefinedComponentMetrics from '@modules/experience-analytics-shared/utils/getPredefinedComponentMetrics';
import {
  snapToLatestEndTime,
  snapToLatestStartTime,
} from '@modules/experience-analytics-shared/utils/snapToLatestTimestep';
import { MetricAverageType, useMetricAverageType } from './MetricAverageTypeContext';

const SnapshotSection: FC = memo(() => {
  const snapshotContainerRef = useRef<HTMLDivElement | null>(null);
  const { height: snapShotContainerHeight } = useComponentSize(snapshotContainerRef);

  const resource = useUniverseResource();
  const granularity = RAQIV2MetricGranularity.OneDay;
  const { metricAverageType } = useMetricAverageType();

  const useL7Metrics = metricAverageType === MetricAverageType.L7Average;

  const componentConfig = useMemo(
    () => getControlledSubcontextConfigExperienceAnalyticsSnapshotV2(useL7Metrics),
    [useL7Metrics],
  );

  const metrics = useMemo(() => getPredefinedComponentMetrics(componentConfig), [componentConfig]);
  const { data: maxEndDate } = useMetricLatestAvailableTime(metrics);

  const chartContext: RAQIV2ChartContext = useMemo(() => {
    const endDate = snapToLatestEndTime(maxEndDate ?? getCurrentDate(), granularity);
    const startDate = snapToLatestStartTime(subDays(endDate, 6), granularity);
    const context: RAQIV2ChartContext = {
      resource,
      timeSpec: {
        rangeType: RAQIV2DateRangeType.Custom,
        startTime: startDate,
        endTime: endDate,
      },
      granularity,
      breakdown: [],
      timeAxisBounds: 'disabled',
    };
    return context;
  }, [granularity, resource, maxEndDate]);
  const onSelectChartRegion = useOnSelectChartRegion();

  return (
    <GenericAnalyticsLayoutItem layout={RAQIV2SpecialLayoutType.FullWidthLayout}>
      <div style={{ position: 'relative', height: snapShotContainerHeight || undefined }}>
        <div ref={snapshotContainerRef} style={{ position: 'absolute', width: '100%' }}>
          <AnalyticsComponent
            key={`with-data-${maxEndDate?.getTime()}`}
            config={componentConfig}
            chartContext={chartContext}
            onSelectChartRegion={onSelectChartRegion}
          />
        </div>
      </div>
    </GenericAnalyticsLayoutItem>
  );
});

SnapshotSection.displayName = 'SnapshotSection';

export default SnapshotSection;
