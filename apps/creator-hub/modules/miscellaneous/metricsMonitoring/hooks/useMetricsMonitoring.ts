import { useContext } from 'react';
import metricsMonitoringContext from '../contexts/MetricsMonitoringContext';

function useMetricsMonitoring() {
  return useContext(metricsMonitoringContext);
}
export default useMetricsMonitoring;
