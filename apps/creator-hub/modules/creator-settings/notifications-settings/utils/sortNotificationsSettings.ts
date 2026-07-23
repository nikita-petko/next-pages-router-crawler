import type {
  CreatorNotification,
  CreatorNotificationCategory,
} from '@rbx/client-creator-settings/v1';

/**
 * Override ordering for categories and notification types.
 *
 * Keys to this object should
 * come from the API response GetAllCreatorNotificationSettingsResponse.categories.notificationCategoryName.
 *
 * Values for each entry in the object should be an array whose entries come from
 * GetAllCreatorNotificationSettingsResponse.categories.notifications.notificationType
 *
 * The arrays determine the ordering of each notification type. Anything not found will be
 * put to the end and sorted alphabetically with other strings not found in this array.
 *
 * Example:
 *
 * {
 *   CategoryC: [CategoryC_NotificationTypeB, CategoryC_NotificationTypeA]
 *   CategoryA: [CategoryA_NotificationTypeA, CategoryA_NotificationTypeB]
 * }
 *
 * With this example:
 * Category C will appear in the before the UI.
 * Any Category not defined will be put after CategoryC and Category A in alphabetical order
 *
 * CategoryC_NotificationTypeB will come before CategoryC_NotificationTypeA within CategoryC
 * Any NotificationType not defined in CategoryC will come after anything defined in the array in alphabetical order
 *
 * CategoryA_NotificationTypeA will come before CategoryA_NotificationTypeB within Category A
 * Any NotificationType not defined in CategoryA will come after anything defined in the array in alphabetical order
 */
export const CATEGORY_AND_NOTIFICATION_TYPE_ORDER_OVERRIDE: Record<string, string[]> = {
  ExperienceGuidelines: [],
  CreatorExperiencePermissions: [],
  CloudServices: [],
  Oauth2: [],
  CreatorOutreach: [],
  PlatformFeedback: [],
};

/**
 * A function that you can pass into sort() to prioritize an overrideArray followed
 * by alphabetical order for the remaining elements not found in overrideArray.
 */
const compareKeysWithPriority = (
  stringA: string | undefined,
  stringB: string | undefined,
  overrideArray?: string[],
): number => {
  if ((stringA == null && stringB == null) || stringA === stringB) {
    return 0;
  }

  if (stringA == null) {
    return 1;
  }

  if (stringB == null) {
    return -1;
  }

  if (overrideArray == null) {
    return stringA.localeCompare(stringB);
  }

  if (!overrideArray.includes(stringA) && !overrideArray.includes(stringB)) {
    return stringA.localeCompare(stringB);
  }

  if (overrideArray.includes(stringA) && overrideArray.includes(stringB)) {
    return overrideArray.indexOf(stringA) - overrideArray.indexOf(stringB);
  }

  if (overrideArray.includes(stringA)) {
    return -1;
  }

  return 1;
};

const sortCategories = (
  categoryArray: CreatorNotificationCategory[],
  override = CATEGORY_AND_NOTIFICATION_TYPE_ORDER_OVERRIDE,
): CreatorNotificationCategory[] => {
  const categoriesOverride = Object.keys(override);

  return categoryArray.sort((categoryA, categoryB) => {
    return compareKeysWithPriority(
      categoryA.notificationCategoryName,
      categoryB.notificationCategoryName,
      categoriesOverride,
    );
  });
};

const sortNotificationTypes = (
  category: string,
  notificationTypeArray: CreatorNotification[],
  override = CATEGORY_AND_NOTIFICATION_TYPE_ORDER_OVERRIDE,
): CreatorNotification[] => {
  const notificationTypeOverride = override[category];

  return notificationTypeArray.sort((notificationTypeA, notificationTypeB) => {
    return compareKeysWithPriority(
      notificationTypeA.notificationType,
      notificationTypeB.notificationType,
      notificationTypeOverride,
    );
  });
};

export const sortNotificationsSettings = (
  categoryArray: CreatorNotificationCategory[],
): CreatorNotificationCategory[] => {
  sortCategories(categoryArray);
  for (let categoryIndex = 0; categoryIndex < categoryArray.length; categoryIndex += 1) {
    sortNotificationTypes(
      categoryArray[categoryIndex].notificationCategoryName || '',
      categoryArray[categoryIndex].notifications || [],
    );
  }
  return categoryArray;
};
