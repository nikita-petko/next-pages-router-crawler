import type { TrackerClientRequest } from '@modules/eventStream/constants/eventConstants';
import CreatorDashboardContext from '@modules/eventStream/enum/CreatorDashboardContext';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import CreatorDashboardSource from '@modules/eventStream/enum/CreatorDashboardSource';

const createNotificationAnalyticsViewEvent = (
  userId: string | number | undefined,
  universeId: string | number | undefined,
  isGroup: boolean,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.ViewNotificationCampaignAnalytics,
  context: CreatorDashboardContext.Load,
  additionalProperties: {
    Source: CreatorDashboardSource.NotificationAnalyticsOverview,
    userId: userId ? `${userId}` : 'unknown',
    universeId: universeId ? `${universeId}` : 'unknown',
    isGroup: isGroup ? 'true' : 'false',
  },
});

export default createNotificationAnalyticsViewEvent;
