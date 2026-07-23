import React, { FC, useRef, useMemo, memo } from 'react';
import {
  AnalyticsComponent,
  GenericAnalyticsLayoutItem,
  RAQIV2ChartContext,
  RAQIV2SpecialLayoutType,
  useOnSelectChartRegion,
  useUniverseResource,
  snapToLatestStartTime,
  snapToLatestEndTime,
  getControlledSubcontextConfigExperienceAnalyticsSnapshotV2,
  getPredefinedComponentMetrics,
  useMetricLatestAvailableTime,
} from '@modules/experience-analytics-shared';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { getCurrentDate, useComponentSize } from '@modules/charts-generic';
import { subDays } from '@rbx/core';

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
