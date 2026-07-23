import type { FC } from 'react';
import React, { useMemo } from 'react';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { useGetSignalCharts } from '../../hooks/useGetSignalCharts';
import type { SummaryReportUISignal } from '../../types/AssistantUISignal';

/**
 * Canvas component that renders charts for a list of signals.
 *
 * This component is a thin wrapper around useSignalCharts that provides
 * backward compatibility for the existing Assistant page usage.
 */
const SummaryReportCanvas: FC<{ signals: SummaryReportUISignal[] }> = ({ signals }) => {
  const { id: universeId } = useUniverseResource();
  const charts = useGetSignalCharts(signals, universeId);

  return useMemo(() => {
    return charts.length > 0 ? <>{charts}</> : null;
  }, [charts]);
};

export default SummaryReportCanvas;
