import React, { useMemo } from 'react';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import {
  RAQIV2ControlledSubcontextType,
  RAQIV2TimeRangeControlMode,
} from '@modules/experience-analytics-shared/components/RAQIV2/subcontext/RAQIV2ControlledSubcontextConfig';
import RAQIV2PredefinedControlledSubcontext from '@modules/experience-analytics-shared/components/RAQIV2/subcontext/RAQIV2PredefinedControlledSubcontext';
import AnalyticsConfigTable from '@modules/experience-analytics-shared/components/RAQIV2/table/AnalyticsConfigTable';
import adaptSignalToChartElement, {
  dedupeSignalChartElements,
} from '../adapters/adaptSignalToChartElement';
import RetentionPowerCurveChart from '../components/charts/RetentionPowerCurveChart';
import SimpleNewUserRetentionTable from '../components/charts/SimpleNewUserRetentionTable';
import { SignalChartElementType } from '../types/AssistantSignalChartElement';
import type { SignalChartElement } from '../types/AssistantSignalChartElement';
import type { SummaryReportUISignal } from '../types/AssistantUISignal';

export function useGetSignalCharts(
  signals: SummaryReportUISignal[],
  universeId: number,
): React.ReactNode[] {
  const chartElements = useMemo(() => {
    return dedupeSignalChartElements(
      signals.flatMap((signal) => adaptSignalToChartElement(signal, universeId)),
    );
  }, [signals, universeId]);

  const charts = useMemo(() => chartElements.map(renderSignalChartElement), [chartElements]);

  return charts;
}

export default useGetSignalCharts;

export function renderSignalChartElement(element: SignalChartElement): React.ReactElement {
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
          chartLocation='assistant'
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
  }
  return assertUnhandledSignalChartElement(element);
}

function assertUnhandledSignalChartElement(element: never): never {
  void element;
  throw new Error('Unhandled chart element type');
}
