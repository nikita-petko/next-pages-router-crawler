import React, { useEffect, useMemo } from 'react';
import { useAnalyticsCurrentDateRangeBundle as useExperienceAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import AnalyticsTabContentLayout from '@modules/experience-analytics-shared/layout/AnalyticsTabContentLayout';
import ExperienceAnalyticsPageDateRangeControl from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/AnalyticsPageDateRangeControl';
import { useNotificationsAnalyticsContext } from '../provider/NotificationsAnalyticsProvider';
import CampaignsAnalyticsTable from './CampaignsAnalyticsTable';
import NotificationAnalyticsSummary from './NotificationAnalyticsSummary';

const NotificationsAnalyticsWrapper: React.FC<React.PropsWithChildren> = () => {
  const {
    isNotificationAnalyticsLoading,
    isGetNotificationsAnalyticsFailed,
    isUserForbidden,
    initializeNotificationsContentAnalytics,
  } = useNotificationsAnalyticsContext();
  const controls = useMemo(() => [<ExperienceAnalyticsPageDateRangeControl key='date' />], []);
  const { startDate, endDate } = useExperienceAnalyticsCurrentDateRangeBundle();

  useEffect(() => {
    initializeNotificationsContentAnalytics(startDate, endDate);
    // NOTE: re-initialize data on initial component load and when the date
    // filter changes only
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-initialize only on date change
  }, [startDate, endDate]);

  return (
    <AnalyticsTabContentLayout controls={controls}>
      <NotificationAnalyticsSummary
        isDataLoading={isNotificationAnalyticsLoading}
        // TODO: change to authentication based on notifications api response
        isUserForbidden={isUserForbidden}
        isResponseFailed={isGetNotificationsAnalyticsFailed}
      />
      <CampaignsAnalyticsTable
        isDataLoading={isNotificationAnalyticsLoading}
        // TODO: change to authentication based on notifications api response
        isUserForbidden={isUserForbidden}
        isResponseFailed={isGetNotificationsAnalyticsFailed}
      />
    </AnalyticsTabContentLayout>
  );
};

export default NotificationsAnalyticsWrapper;
