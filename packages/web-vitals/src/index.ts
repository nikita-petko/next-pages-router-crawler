import type { NextWebVitalsMetric } from 'next/app';
import type { Metric } from 'web-vitals';
import { onCLS, onFCP, onLCP, onTTFB } from 'web-vitals';
import type { UnifiedLogger, TRawBaseEvent } from '@rbx/unified-logger';
import { getSessionParams } from './getSessionParams';
import onDCL from './onDCL';
import onLT from './onLT';

export type TWebPerformanceMetric = {
  eventName: string;
  metricName: string;
  metricValue: number;
};

export type TVitalsLogger = {
  logWebVitalsEvent: (event: TWebPerformanceMetric | TRawBaseEvent) => void;
};

export type TOptions = {
  reportThreshold?: number;
};

export const webVitalsEventModel = (metric: NextWebVitalsMetric): TRawBaseEvent => ({
  eventName: 'webVitals',
  parameters: {
    metricName: metric.name,
    metricStartTime: String(metric.startTime),
    metricValue: String(metric.value),
    metricLabel: metric.label,
    ...getSessionParams(),
  },
});

export const genericWebVitalsEventModel = (metric: { name: string; value: number }) => ({
  eventName: 'webPerformance',
  metricName: metric.name,
  metricValue: metric.value,
});

export const createWebVitalsReporter = (unifiedLoggerClient: UnifiedLogger) => {
  return (metric: NextWebVitalsMetric) =>
    unifiedLoggerClient.logWebVitalsEvent(webVitalsEventModel(metric));
};

export const reportWebVitals = (loggerClient: TVitalsLogger, additionalOptions?: TOptions) => {
  // NOTE (jsayani, 01/09/24): Use google web-vitals along with custom DCL and LT reporting.
  const sendPerfEvent = (arg: { name: string; value: number }) => {
    loggerClient.logWebVitalsEvent(genericWebVitalsEventModel(arg));
  };

  const queuedEvents: Record<string, Metric[]> = {};
  const queuePerfEvent = (arg: Metric) => {
    if (queuedEvents[arg.name]) {
      queuedEvents[arg.name].push(arg);
    } else {
      queuedEvents[arg.name] = [arg];
    }
  };

  const flushPerfEvents = () => {
    const eventsToReport = Object.keys(queuedEvents);
    eventsToReport.forEach((eventName) => {
      const metrics = queuedEvents[eventName];
      sendPerfEvent(metrics.pop()!);
      delete queuedEvents[eventName];
    });
  };

  const reportingTimeout = window.setTimeout(
    flushPerfEvents,
    additionalOptions?.reportThreshold || 10000,
  );

  window.addEventListener('beforeunload', () => {
    window.clearTimeout(reportingTimeout);
    flushPerfEvents();
  });

  onTTFB(sendPerfEvent);
  onFCP(sendPerfEvent);
  onDCL(sendPerfEvent);
  onLT(sendPerfEvent);

  onCLS(queuePerfEvent, { reportAllChanges: true });
  onLCP(queuePerfEvent, { reportAllChanges: true });
};
