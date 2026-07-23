import type { CreatorNotificationCategory } from '@rbx/client-creator-settings/v1';
import type { UseTranslationResult } from '@rbx/intl';

const getTriggersForCategory = (
  categories: CreatorNotificationCategory[],
  translate: UseTranslationResult['translate'],
) => {
  return categories.reduce((triggerToCategory: Record<string, string>, category) => {
    const additionalTriggersToCategory =
      category.notifications?.reduce(
        (reducedNotifications: Record<string, string>, notification) => {
          reducedNotifications[notification.notificationType ?? ''] = translate(
            `Label.Category${category.notificationCategoryName}`,
          );
          return reducedNotifications;
        },
        {},
      ) ?? {};

    return Object.assign(triggerToCategory, additionalTriggersToCategory);
  }, {});
};

export default getTriggersForCategory;
