import { useAuthentication } from '@modules/authentication/providers';
import { notificationsClient } from '@modules/clients';
import { getResponseFromError } from '@modules/clients/utils';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { useUniverseID } from '@modules/experience-analytics-shared';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useRouter } from 'next/router';
import React, {
  FunctionComponent,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import createNotificationAnalyticsViewEvent from '../../constants/notificationAnalyticsEventConstant';
import {
  NotificationsContentAnalyticsResponse,
  NotificationsContentAnalyticsSummary,
  NotificationsContentCampaignAnalytics,
  NotificationsContentCampaignAnalyticsTableRow,
} from '../../types/notificationAnalytics';

export type NotificationsAnalyticsContextValue = {
  notificationsContentAnalyticsList: NotificationsContentCampaignAnalyticsTableRow[];
  notificationsContentAnalyticsSummary: NotificationsContentAnalyticsSummary;
  notificationContentDismissWarning: (contentId: string) => Promise<unknown>;
  downloadNotificationsContentAnalytics: () => Promise<unknown>;
  initializeNotificationsContentAnalytics: (startDate: Date, endDate: Date) => Promise<unknown>;
  isNotificationAnalyticsLoading: boolean;
  isGetNotificationsAnalyticsFailed: boolean;
  isNotificationsAnalyticsDataFetched: boolean;
  isUserForbidden: boolean;
};

const defaultNotificationsContentAnalyticsSummary: NotificationsContentAnalyticsSummary = {
  impressions: 0,
  optedInUsers: 0,
  clicks: 0,
  clickthroughRate: '--',
  turnoffRate: '--',
  dismissRate: '--',
  warning: undefined,
  campaignCount: 0,
};

const NotificationsAnalyticsContext = createContext<NotificationsAnalyticsContextValue>({
  notificationsContentAnalyticsList: [],
  notificationsContentAnalyticsSummary: defaultNotificationsContentAnalyticsSummary,
  isNotificationAnalyticsLoading: false,
  isGetNotificationsAnalyticsFailed: false,
  isNotificationsAnalyticsDataFetched: false,
  isUserForbidden: false,
  notificationContentDismissWarning: () => new Promise((resolve) => resolve(null)),
  downloadNotificationsContentAnalytics: () => new Promise((resolve) => resolve(null)),
  initializeNotificationsContentAnalytics: () => new Promise((resolve) => resolve(null)),
});

NotificationsAnalyticsContext.displayName = 'NotificationsAnalyticsContext';

const getNotificationsContentAnalyticsSummaryFromData = (
  data: NotificationsContentAnalyticsSummary,
) => {
  return {
    impressions: data.impressions ?? defaultNotificationsContentAnalyticsSummary.impressions,
    optedInUsers: data.optedInUsers ?? defaultNotificationsContentAnalyticsSummary.optedInUsers,
    clicks: data.clicks ?? defaultNotificationsContentAnalyticsSummary.clicks,
    clickthroughRate:
      data.clickthroughRate ?? defaultNotificationsContentAnalyticsSummary.clickthroughRate,
    turnoffRate: data.turnoffRate ?? defaultNotificationsContentAnalyticsSummary.turnoffRate,
    dismissRate: data.dismissRate ?? defaultNotificationsContentAnalyticsSummary.dismissRate,
    warning: data.warning ?? defaultNotificationsContentAnalyticsSummary.warning,
    campaignCount: data.campaignCount ?? defaultNotificationsContentAnalyticsSummary.campaignCount,
  };
};

const NotificationsAnalyticsProvider: FunctionComponent<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const router = useRouter();
  // eslint-disable-next-line deprecation/deprecation -- @dbrunais leaving for code owners to resolve
  const universeId = useUniverseID();
  if (!universeId) {
    router.push('/dashboard/creations');
  }
  const { trackerClient } = useEventTrackerProvider();
  const currentGroup = useCurrentGroup();
  const isGroup = (currentGroup?.id ?? 0) !== 0;

  const [isNotificationAnalyticsLoading, setIsNotificationAnalyticsLoading] = useState(false);
  const [isGetNotificationsAnalyticsFailed, setIsGetNotificationsAnalyticsFailed] = useState(false);
  const [isUserForbidden, setIsUserForbidden] = useState(false);
  const [isNotificationsAnalyticsDataFetched, setIsNotificationsAnalyticsDataFetched] =
    useState(false);
  const [notificationsContentAnalyticsList, setNotificationsContentAnalyticsList] = useState<
    NotificationsContentCampaignAnalyticsTableRow[]
  >([]);
  const [notificationsContentAnalyticsSummary, setNotificationsContentAnalyticsSummary] =
    useState<NotificationsContentAnalyticsSummary>(defaultNotificationsContentAnalyticsSummary);
  const { user } = useAuthentication();

  const getNotificationsContentAnalytics = useCallback(
    async (
      universeID: number,
      userId: number,
      sDate: Date,
      eDate: Date,
    ): Promise<NotificationsContentAnalyticsResponse> => {
      return (await notificationsClient.getNotificationAnalytics(
        universeID,
        userId,
        sDate,
        eDate,
      )) as NotificationsContentAnalyticsResponse;
    },
    [],
  );

  const notificationContentDismissWarning = useCallback(async (contentId: string) => {
    return new Promise((resolve) => resolve(contentId));
  }, []);

  const downloadNotificationsContentAnalytics = useCallback(async () => {
    return new Promise((resolve) => resolve(null));
  }, []);

  const generateNotificationsContentAnalyticsList = (
    campaigns: NotificationsContentCampaignAnalytics[],
  ): NotificationsContentCampaignAnalyticsTableRow[] => {
    return campaigns.map((campaign) => ({
      campaignName: campaign.campaignName,
      impressions: campaign.metrics.impressions,
      clicks: campaign.metrics.clicks,
      clickthroughRate: campaign.metrics.clickthroughRate,
      turnoffRate: campaign.metrics.turnoffRate,
      dismissRate: campaign.metrics.dismissRate,
      firstImpressionDate: campaign.metrics.firstImpressionDate,
    }));
  };

  const initializeNotificationsContentAnalytics = useCallback(
    async (startDate: Date, endDate: Date) => {
      if (!universeId || isNotificationAnalyticsLoading) return;
      setIsNotificationAnalyticsLoading(true);
      try {
        const data: NotificationsContentAnalyticsResponse = await getNotificationsContentAnalytics(
          universeId,
          user?.id ?? 0,
          startDate,
          endDate,
        );

        if (data?.overview) {
          setNotificationsContentAnalyticsSummary(
            getNotificationsContentAnalyticsSummaryFromData(data.overview),
          );
        } else {
          setNotificationsContentAnalyticsSummary(defaultNotificationsContentAnalyticsSummary);
        }
        if (data?.campaigns) {
          setNotificationsContentAnalyticsList(
            generateNotificationsContentAnalyticsList(data.campaigns),
          );
        }
        setIsGetNotificationsAnalyticsFailed(false);
        setIsNotificationAnalyticsLoading(false);
        setIsNotificationsAnalyticsDataFetched(true);
        setIsUserForbidden(false);
      } catch (e) {
        const optOutErrorResponse = getResponseFromError(e);
        if (optOutErrorResponse?.status === 403) {
          setIsUserForbidden(true);
        } else {
          setIsUserForbidden(false);
        }
        setIsGetNotificationsAnalyticsFailed(true);
        setIsNotificationAnalyticsLoading(false);
      }
      trackerClient?.sendEvent(createNotificationAnalyticsViewEvent(user?.id, universeId, isGroup));
    },
    [
      getNotificationsContentAnalytics,
      universeId,
      user?.id,
      isNotificationAnalyticsLoading,
      trackerClient,
      isGroup,
    ],
  );

  const providerValue = useMemo(
    () => ({
      isNotificationAnalyticsLoading,
      isGetNotificationsAnalyticsFailed,
      notificationsContentAnalyticsList,
      notificationsContentAnalyticsSummary,
      notificationContentDismissWarning,
      downloadNotificationsContentAnalytics,
      initializeNotificationsContentAnalytics,
      isNotificationsAnalyticsDataFetched,
      isUserForbidden: isGetNotificationsAnalyticsFailed && isUserForbidden,
    }),
    [
      isNotificationAnalyticsLoading,
      isGetNotificationsAnalyticsFailed,
      notificationsContentAnalyticsList,
      notificationsContentAnalyticsSummary,
      notificationContentDismissWarning,
      downloadNotificationsContentAnalytics,
      initializeNotificationsContentAnalytics,
      isNotificationsAnalyticsDataFetched,
      isUserForbidden,
    ],
  );

  return (
    <NotificationsAnalyticsContext.Provider value={providerValue}>
      {children}
    </NotificationsAnalyticsContext.Provider>
  );
};

const useNotificationsAnalyticsContext = () => {
  return useContext(NotificationsAnalyticsContext);
};

export {
  NotificationsAnalyticsContext,
  NotificationsAnalyticsProvider,
  useNotificationsAnalyticsContext,
};
