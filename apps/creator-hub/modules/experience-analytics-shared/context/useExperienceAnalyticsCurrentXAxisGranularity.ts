import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import { getXAxisGranularity } from '@modules/charts-generic/enums/XAxisGranularity';

const useExperienceAnalyticsCurrentXAxisGranularity = () => {
  const { startDate, endDate } = useAnalyticsCurrentDateRangeBundle();
  return getXAxisGranularity(startDate, endDate);
};
export default useExperienceAnalyticsCurrentXAxisGranularity;
