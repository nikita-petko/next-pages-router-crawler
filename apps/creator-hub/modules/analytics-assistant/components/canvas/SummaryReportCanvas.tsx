import React, { FC, useMemo } from 'react';
import { useUniverseResource } from '@modules/experience-analytics-shared';
import { SummaryReportUISignal } from '../../types/AssistantUISignal';
import { useGetSignalCharts } from '../../hooks/useGetSignalCharts';

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
    return charts.length > 0 ? <React.Fragment>{charts}</React.Fragment> : null;
  }, [charts]);
};

export default SummaryReportCanvas;
