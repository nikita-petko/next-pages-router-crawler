import type { CreatorNotificationCategory } from '@rbx/client-creator-settings/v1';

export const ExperienceWebhookCategoryName = 'CustomAlerts';
export const ExperienceWebhookNotificationType = 'AnalyticsAlert';

export const experienceWebhookTriggers: CreatorNotificationCategory[] = [
  {
    notificationCategoryName: ExperienceWebhookCategoryName,
    notifications: [
      {
        notificationType: ExperienceWebhookNotificationType,
      },
    ],
  },
];
