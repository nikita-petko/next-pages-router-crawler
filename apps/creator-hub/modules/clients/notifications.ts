import type {
  ConfigureExperienceNotificationResponse,
  NotificationsDeveloperConfigurationCreateNotificationStringRequest,
  NotificationsDeveloperConfigurationUpdateNotificationStringRequest,
} from '@rbx/client-notifications-api/v1';
import {
  NotificationsAggregatedAnalyticsApi,
  NotificationsDeveloperConfigurationApi,
} from '@rbx/client-notifications-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

const maxNotificationContentCount = 100;

export class NotificationsClient {
  private notificationsDeveloperConfigApi: NotificationsDeveloperConfigurationApi;

  private notificationsAggregatedAnalyticsApi: NotificationsAggregatedAnalyticsApi;

  constructor() {
    const developerConfigurationApiConfiguration = createClientConfiguration(
      'notifications',
      'bedev2',
      {
        enableBoundAuthToken: true,
        boundAuthTokenLoadTimeout: 6000,
        boundAuthTokenDataTimeout: 1000,
      },
    );
    this.notificationsDeveloperConfigApi = new NotificationsDeveloperConfigurationApi(
      developerConfigurationApiConfiguration,
    );
    const aggregatedAnalyticsApiConfiguration = createClientConfiguration(
      'notifications',
      'bedev2',
    );
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
