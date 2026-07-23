import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  ConfigureExperienceNotificationResponse,
  NotificationsAggregatedAnalyticsApi,
  NotificationsDeveloperConfigurationApi,
  NotificationsDeveloperConfigurationCreateNotificationStringRequest,
  NotificationsDeveloperConfigurationUpdateNotificationStringRequest,
} from '@rbx/clients/notificationsApi/v1';
import { getBEDEV2ServiceBasePath } from './utils';

const maxNotificationContentCount = 100;

export class NotificationsClient {
  private notificationsDeveloperConfigApi: NotificationsDeveloperConfigurationApi;

  private notificationsAggregatedAnalyticsApi: NotificationsAggregatedAnalyticsApi;

  constructor(basePath: string = getBEDEV2ServiceBasePath('notifications')) {
    const developerConfigurationApiConfiguration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
      enableBoundAuthToken: true,
      boundAuthTokenLoadTimeout: 6000,
      boundAuthTokenDataTimeout: 1000,
    });
    this.notificationsDeveloperConfigApi = new NotificationsDeveloperConfigurationApi(
      developerConfigurationApiConfiguration,
    );
    const aggregatedAnalyticsApiConfiguration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });
    this.notificationsAggregatedAnalyticsApi = new NotificationsAggregatedAnalyticsApi(
      aggregatedAnalyticsApiConfiguration,
    );
  }

  async getNotificationAnalytics(
    universeId: number,
    userId: number,
    aggregationStartDateTime: Date,
    aggregationEndDateTime: Date,
  ) {
    return this.notificationsAggregatedAnalyticsApi.notificationsAggregatedAnalyticsExperienceNotification(
      {
        universeId,
        userId,
        aggregationStartDateTime,
        aggregationEndDateTime,
      },
    );
  }

  async getNotificationsContent(universeId: number) {
    return this.notificationsDeveloperConfigApi.notificationsDeveloperConfigurationExperienceNotificationsList(
      { universeId, count: maxNotificationContentCount },
    );
  }

  async getNotificationContent(contentId: string) {
    return this.notificationsDeveloperConfigApi.notificationsDeveloperConfigurationExperienceNotification(
      {
        id: contentId,
      },
    );
  }

  async createNotificationContent(
    createNotificationStringRequest: NotificationsDeveloperConfigurationCreateNotificationStringRequest,
  ) {
    return this.notificationsDeveloperConfigApi.notificationsDeveloperConfigurationCreateNotificationString(
      {
        notificationsDeveloperConfigurationCreateNotificationStringRequest:
          createNotificationStringRequest,
      },
    );
  }

  async updateNotificationContent(
    updateNotificationStringRequest: NotificationsDeveloperConfigurationUpdateNotificationStringRequest,
  ): Promise<void> {
    return this.notificationsDeveloperConfigApi.notificationsDeveloperConfigurationUpdateNotificationString(
      {
        notificationsDeveloperConfigurationUpdateNotificationStringRequest:
          updateNotificationStringRequest,
      },
    );
  }

  async archiveNotificationContent(contentId: string): Promise<void> {
    return this.notificationsDeveloperConfigApi.notificationsDeveloperConfigurationArchiveNotificationString(
      {
        notificationsDeveloperConfigurationArchiveNotificationStringRequest: {
          id: contentId,
        },
      },
    );
  }
}

export const notificationsClient = new NotificationsClient();
export type { ConfigureExperienceNotificationResponse };
