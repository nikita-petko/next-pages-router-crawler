/* eslint-disable no-console */
import { createContext } from 'react';

export interface MetricsMonitoringInterface {
  info: (message: string) => void;
  error: (message: string) => void;
  captureError: (error: Error) => void;
  reportEvent: (eventName: string) => void;
}

const defaultMetricsMonitor: MetricsMonitoringInterface = {
  info: console.info,
  error: console.error,
  captureError: console.error,
  reportEvent: console.log,
};

const metricsMonitoringContext = createContext<MetricsMonitoringInterface>(defaultMetricsMonitor);
metricsMonitoringContext.displayName = 'TencentPerformanceMonitor';

export default metricsMonitoringContext;
