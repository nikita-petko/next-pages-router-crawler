import { getXAxisGranularity, useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic';

const useExperienceAnalyticsCurrentXAxisGranularity = () => {
  const { startDate, endDate } = useAnalyticsCurrentDateRangeBundle();
  return getXAxisGranularity(startDate, endDate);
};
export default useExperienceAnalyticsCurrentXAxisGranularity;
