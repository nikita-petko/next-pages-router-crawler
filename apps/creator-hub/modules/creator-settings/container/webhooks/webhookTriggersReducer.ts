import { CreatorNotificationCategory } from '@rbx/clients/creatorSettings';
import { useTranslation } from '@rbx/intl';

const getTriggersForCategory = (
  categories: CreatorNotificationCategory[],
  translate: ReturnType<typeof useTranslation>['translate'],
) => {
  return categories.reduce((triggerToCategory: Record<string, string>, category) => {
    const additionalTriggersToCategory =
      category.notifications?.reduce(
        (reducedNotifications: Record<string, string>, notification) => {
          return {
            ...reducedNotifications,
            [notification.notificationType ?? '']: translate(
              `Label.Category${category.notificationCategoryName}`,
            ),
          };
        },
        {},
      ) ?? {};

    return {
      ...triggerToCategory,
      ...additionalTriggersToCategory,
    };
  }, {});
};

export default getTriggersForCategory;
