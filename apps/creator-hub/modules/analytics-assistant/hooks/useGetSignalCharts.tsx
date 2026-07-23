import React, { useMemo } from 'react';
import {
  AnalyticsConfigTable,
  RAQIV2PredefinedControlledSubcontext,
  RAQIV2ControlledSubcontextType,
  RAQIV2TimeRangeControlMode,
} from '@modules/experience-analytics-shared';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { SummaryReportUISignal } from '../types/AssistantUISignal';
import adaptSignalToChartElement, {
  dedupeSignalChartElements,
} from '../adapters/adaptSignalToChartElement';
import { SignalChartElementType } from '../types/AssistantSignalChartElement';
import RetentionPowerCurveChart from '../components/charts/RetentionPowerCurveChart';
import SimpleNewUserRetentionTable from '../components/charts/SimpleNewUserRetentionTable';

export function useGetSignalCharts(
  signals: SummaryReportUISignal[],
  universeId: number,
): React.ReactNode[] {
  const chartElements = useMemo(() => {
    return dedupeSignalChartElements(
      signals.flatMap((signal) => adaptSignalToChartElement(signal, universeId)),
    );
  }, [signals, universeId]);

  const charts = useMemo(() => {
    return chartElements
      .map((element) => {
        const key = element.dedupKey;

        switch (element.type) {
          case SignalChartElementType.AnalyticsConfigChart: {
            return (
              <RAQIV2PredefinedControlledSubcontext
                key={key}
                config={{
                  type: AnalyticsComponentType.ControlledSubcontext,
                  subcontextType: RAQIV2ControlledSubcontextType.TimeRangeOverride,
                  controlMode: RAQIV2TimeRangeControlMode.ZoomResetOnly,
                  body: element.props.chartKeyOrConfig,
                }}
                chartContext={element.props.chartContext}
              />
            );
          }
          case SignalChartElementType.AnalyticsConfigTable: {
            return <AnalyticsConfigTable key={key} {...element.props} />;
          }
          case SignalChartElementType.RetentionPowerCurveChart: {
            return <RetentionPowerCurveChart key={key} {...element.props} />;
          }
          case SignalChartElementType.SimpleNewUserRetentionTable: {
            return <SimpleNewUserRetentionTable key={key} {...element.props} />;
          }
          default: {
            const exhaustiveCheck: never = element;
            throw new Error(`Unhandled chart element type: ${exhaustiveCheck}`);
          }
        }
      })
      .filter((chart): chart is React.ReactElement => chart !== null);
  }, [chartElements]);

  return charts;
}

export default useGetSignalCharts;
