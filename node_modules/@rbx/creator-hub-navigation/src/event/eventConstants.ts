import type { CreatorStreamNotification } from '@rbx/client-creator-notification-streams-api/v1';

// Events logged through unified logger, it will have composite event name in format of `${currentProduct}.${eventType}.${eventValue}`
// where `currentProduct` is prefixed automatically( in function logEventToUnifiedLogger).
// * `currentProduct`: is the product key of the current product (e.g. CreatorDashboard, Store, Home, etc),
// * `eventType` is the event name (e.g. ClickNavTab, ClickNavList, ClickNavMenuIcon, etc),
// * `eventValue` is the optional value of the event, indicates what user clicks on (e.g. 'Create', 'Home', 'MenuIcon', etc).
// * `parameters` is an optional object that contains additional information about the event.
// See Dashboard https://superset.di.rbx.com/superset/dashboard/p/xdGKbamDolZ/ for events from top nav and notification tray.
export interface TrackerClientRequest {
  eventType: string;
  context: string;
  eventValue?: string;
  parameters?: Record<string, string>;
}

export enum EventContext {
  Load = 'load',
  Click = 'click',
  Hover = 'hover',
  Impression = 'impression',
  Error = 'error',
}

export enum NotificationTrayCloseSource {
  BellIcon = 'bellIcon',
  ClickOutside = 'clickOutside',
}

export interface NotificationCommonEventParameters {
  hasUnSeenNotifications: boolean;
  unreadNotificationCount?: number;
  notificationsCount?: number;
}

enum EventName {
  LoadNav = 'loadNav',
  ClickNavTab = 'clickNavTab',
  ClickNavPrimaryRail = 'clickNavPrimaryRail',
  ClickNavPrimaryRailCollapse = 'clickNavPrimaryRailCollapse',
  ClickNavAllTools = 'clickNavAllTools',
  ClickNavList = 'clickNavList',
  ClickNavMenuIcon = 'clickNavMenuIcon',
  clickCreatorIcon = 'clickCreatorIcon',
  ClickNavDropdownTab = 'ClickNavDropdownTab',
  ClickNavBackToCreator = 'clickNavBackToCreator',
  ClickNavDropdownMenuItemTab = 'ClickNavDropdownMenuItemTab',
  OpenNavUserMenuButton = 'OpenNavUserMenuButton',
  ClickNavSettings = 'settingsEntryPointClicked',
  ClickCopyUserId = 'ClickCopyUserId',
  ClickNavSwitchAccounts = 'ClickNavSwitchAccounts',
  ClickNavLogOut = 'ClickNavLogOut',
  HoverNavDropdownTab = 'HoverNavDropdownTab',
  // Notification Events
  // Check detail in https://roblox.atlassian.net/wiki/spaces/CREATORSUCCESS/pages/3972661250/Creator+Notifications+Measurement
  NotificationBellIconImpression = 'NotificationBellIconImpression',
  ClickNotification = 'clickNotification',
  MarkAllNotificationsRead = 'MarkAllNotificationsRead',
  ClickNotificationSettingsButton = 'ClickNotificationSettingsButton',
  OpenNotificationTray = 'OpenNotificationTray',
  CloseNotificationTray = 'CloseNotificationTray',
  ViewNotifications = 'ViewNotifications',
  NotificationItemImpression = 'NotificationItemImpression',
  AccountSwitcherDialogImpression = 'AccountSwitcherDialogImpression',
  AccountSwitcherGetUsersMetadataFailed = 'AccountSwitcherGetUsersMetadataFailed',
  ClickSwitchAccountsButton = 'ClickSwitchAccountsButton',
  ClickAccountSwitcherAddAccount = 'ClickAccountSwitcherAddAccount',
  SwitchAccountsSuccess = 'SwitchAccountsSuccess',
  SwitchAccountsFailed = 'SwitchAccountsFailed',
  RefreshDialogImpression = 'RefreshDialogImpression',
  ClickRefreshButton = 'ClickRefreshButton',
}

const NOTIFICATION_PRODUCT_TEAM = 'knowledge';

const convertNotificationCommonEventParametersToParameters = (
  parameters: NotificationCommonEventParameters,
): Record<string, string> => {
  return Object.entries(parameters).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value.toString();
    }
    return acc;
  }, {});
};

export const loadNavEventModel: TrackerClientRequest = {
  eventType: EventName.LoadNav,
  context: EventContext.Load,
};

export const clickTabEventModel = (productName: string): TrackerClientRequest => ({
  eventType: EventName.ClickNavTab,
  context: EventContext.Click,
  eventValue: productName,
});

export const clickRailEventModel = (productName: string): TrackerClientRequest => ({
  eventType: EventName.ClickNavPrimaryRail,
  context: EventContext.Click,
  eventValue: productName,
});

export const clickToolsEventModel = (
  productName: string,
  searchTerm?: string,
): TrackerClientRequest => {
  const parameters: Record<string, string> = { productName };
  if (searchTerm) {
    parameters.searchTerm = searchTerm;
  }

  return {
    eventType: EventName.ClickNavAllTools,
    context: EventContext.Click,
    parameters,
  };
};

export const ClickNavPrimaryRailCollapse: TrackerClientRequest = {
  eventType: EventName.ClickNavPrimaryRailCollapse,
  context: EventContext.Click,
};

export const clickListEventModel = (productName: string): TrackerClientRequest => ({
  eventType: EventName.ClickNavList,
  context: EventContext.Click,
  eventValue: productName,
});

export const clickMenuIconEventModel: TrackerClientRequest = {
  eventType: EventName.ClickNavMenuIcon,
  context: EventContext.Click,
};

export const clickCreatorIconEventModel: TrackerClientRequest = {
  eventType: EventName.clickCreatorIcon,
  context: EventContext.Click,
};

export const clickBackToCreatorEventModel: TrackerClientRequest = {
  eventType: EventName.ClickNavBackToCreator,
  context: EventContext.Click,
};

export const openNavUserMenuButtonEventModel: TrackerClientRequest = {
  eventType: EventName.OpenNavUserMenuButton,
  context: EventContext.Click,
};

export const clickNavSettingsEventModel: TrackerClientRequest = {
  eventType: EventName.ClickNavSettings,
  context: EventContext.Click,
};

export const clickNavCopyUserIdEventModel: TrackerClientRequest = {
  eventType: EventName.ClickCopyUserId,
  context: EventContext.Click,
};

export const clickNavSwitchAccountsEventModel: TrackerClientRequest = {
  eventType: EventName.ClickNavSwitchAccounts,
  context: EventContext.Click,
};

export const clickNavLogOutEventModel: TrackerClientRequest = {
  eventType: EventName.ClickNavLogOut,
  context: EventContext.Click,
};

export const clickDropdownTabEventModel = (productName: string): TrackerClientRequest => ({
  eventType: EventName.ClickNavDropdownTab,
  context: EventContext.Click,
  eventValue: productName,
});

export const clickDropdownMenuItemEventModel = (
  productName: string,
  itemName: string,
): TrackerClientRequest => ({
  eventType: EventName.ClickNavDropdownMenuItemTab,
  context: EventContext.Click,
  eventValue: `${productName}.${itemName}`,
});

export const clickNotificationEventModel = (
  notification: CreatorStreamNotification,
  notificationGroupIndex?: number,
): TrackerClientRequest => ({
  eventType: EventName.ClickNotification,
  context: EventContext.Click,
  parameters: {
    id: notification.notificationId,
    type: notification.notificationType,
    title: notification.creatorStreamNotificationContent?.title ?? '',
    notificationGroupIndex: notificationGroupIndex?.toString() ?? '',
    clickAction: notification.creatorStreamNotificationContent?.clickAction ?? '',
    referenceId: notification.referenceId ?? '',
    read: notification.read?.toString() ?? 'false',
    productTeam: NOTIFICATION_PRODUCT_TEAM,
  },
});

export const markAllNotificationsReadEventModel = (
  parameters: NotificationCommonEventParameters,
): TrackerClientRequest => ({
  eventType: EventName.MarkAllNotificationsRead,
  context: EventContext.Click,
  parameters: {
    ...convertNotificationCommonEventParametersToParameters(parameters),
    productTeam: NOTIFICATION_PRODUCT_TEAM,
  },
});

export const clickNotificationSettingsButtonEventModel = (
  parameters: NotificationCommonEventParameters,
): TrackerClientRequest => ({
  eventType: EventName.ClickNotificationSettingsButton,
  context: EventContext.Click,
  parameters: {
    ...convertNotificationCommonEventParametersToParameters(parameters),
    productTeam: NOTIFICATION_PRODUCT_TEAM,
  },
});

export const openNotificationTrayEventModel = (
  parameters: NotificationCommonEventParameters,
): TrackerClientRequest => ({
  eventType: EventName.OpenNotificationTray,
  context: EventContext.Click,
  parameters: {
    ...convertNotificationCommonEventParametersToParameters(parameters),
    productTeam: NOTIFICATION_PRODUCT_TEAM,
  },
});

export const closeNotificationTrayEventModel = (
  parameters: NotificationCommonEventParameters,
  durationMs?: number,
  source?: NotificationTrayCloseSource,
): TrackerClientRequest => {
  const parametersResult: Record<string, string> = {};
  if (durationMs !== undefined) {
    parametersResult.durationMs = durationMs.toString();
  }
  if (source) {
    parametersResult.source = source;
  }
  return {
    eventType: EventName.CloseNotificationTray,
    context: EventContext.Click,
    parameters: {
      ...parametersResult,
      ...convertNotificationCommonEventParametersToParameters(parameters),
      productTeam: NOTIFICATION_PRODUCT_TEAM,
    },
  };
};

export const notificationsImpressionEventModel = (
  notifications: CreatorStreamNotification[],
): TrackerClientRequest => {
  const viewedNotifications: Record<string, string> = {};
  notifications.forEach((notification) => {
    const { notificationType, notificationId } = notification;
    if (viewedNotifications[notificationType]) {
      viewedNotifications[notificationType] =
        `${viewedNotifications[notificationType]},${notificationId}`;
    } else {
      viewedNotifications[notificationType] = notificationId;
    }
  });

  return {
    eventType: EventName.ViewNotifications,
    context: EventContext.Impression,
    parameters: {
      ...viewedNotifications,
      productTeam: NOTIFICATION_PRODUCT_TEAM,
    },
  };
};

export const notificationItemImpressionEventModel = (
  notification: CreatorStreamNotification,
  notificationGroupIndex?: number,
): TrackerClientRequest => ({
  eventType: EventName.NotificationItemImpression,
  context: EventContext.Impression,
  parameters: {
    id: notification.notificationId,
    type: notification.notificationType,
    title: notification.creatorStreamNotificationContent?.title ?? '',
    notificationGroupIndex: notificationGroupIndex?.toString() ?? '',
    clickAction: notification.creatorStreamNotificationContent?.clickAction ?? '',
    referenceId: notification.referenceId ?? '',
    read: notification.read?.toString() ?? 'false',
    productTeam: NOTIFICATION_PRODUCT_TEAM,
  },
});

export const notificationBellIconImpressionEventModel = (
  parameters: NotificationCommonEventParameters,
): TrackerClientRequest => ({
  eventType: EventName.NotificationBellIconImpression,
  context: EventContext.Impression,
  parameters: {
    ...convertNotificationCommonEventParametersToParameters(parameters),
    productTeam: NOTIFICATION_PRODUCT_TEAM,
  },
});

export const accountSwitcherDialogImpressionEventModel = ({
  userIdsViewedCsv,
}: {
  userIdsViewedCsv: string;
}): TrackerClientRequest => ({
  eventType: EventName.AccountSwitcherDialogImpression,
  context: EventContext.Impression,
  parameters: {
    userIdsViewedCsv,
  },
});

export const clickSwitchAccountsButtonEventModel = ({
  switchedFromUserId,
  switchedToUserId,
  userIdsViewedCsv,
}: {
  switchedFromUserId: string;
  switchedToUserId: string;
  userIdsViewedCsv: string;
}): TrackerClientRequest => ({
  eventType: EventName.ClickSwitchAccountsButton,
  context: EventContext.Click,
  parameters: {
    switchedFromUserId,
    switchedToUserId,
    userIdsViewedCsv,
  },
});

export const clickAccountSwitcherAddAccountEventModel = ({
  userIdsViewedCsv,
}: {
  userIdsViewedCsv: string;
}): TrackerClientRequest => ({
  eventType: EventName.ClickAccountSwitcherAddAccount,
  context: EventContext.Click,
  parameters: {
    userIdsViewedCsv,
  },
});

export const switchAccountsSuccessEventModel = ({
  switchedFromUserId,
  switchedToUserId,
}: {
  switchedFromUserId: string;
  switchedToUserId: string;
}): TrackerClientRequest => ({
  eventType: EventName.SwitchAccountsSuccess,
  context: EventContext.Click,
  parameters: {
    switchedFromUserId,
    switchedToUserId,
  },
});

export const switchAccountsFailedEventModel = ({
  switchedFromUserId,
  switchedToUserId,
  error,
}: {
  switchedFromUserId: string;
  switchedToUserId: string;
  error: string;
}): TrackerClientRequest => ({
  eventType: EventName.SwitchAccountsFailed,
  context: EventContext.Error,
  parameters: {
    switchedFromUserId,
    switchedToUserId,
    error,
  },
});

export const accountSwitcherGetUsersMetadataFailedEventModel = ({
  error,
}: {
  error: string;
}): TrackerClientRequest => ({
  eventType: EventName.AccountSwitcherGetUsersMetadataFailed,
  context: EventContext.Error,
  parameters: {
    error,
  },
});

export const refreshDialogImpressionEventModel = ({
  switchedFromUserId,
  switchedToUserId,
}: {
  switchedFromUserId: number;
  switchedToUserId?: number;
}): TrackerClientRequest => ({
  eventType: EventName.RefreshDialogImpression,
  context: EventContext.Impression,
  parameters: {
    switchedFromUserId: switchedFromUserId.toString(),
    switchedToUserId: switchedToUserId?.toString() ?? '',
  },
});

export const clickRefreshButtonEventModel = ({
  switchedFromUserId,
  switchedToUserId,
}: {
  switchedFromUserId: number;
  switchedToUserId?: number;
}): TrackerClientRequest => ({
  eventType: EventName.ClickRefreshButton,
  context: EventContext.Click,
  parameters: {
    switchedFromUserId: switchedFromUserId.toString(),
    switchedToUserId: switchedToUserId?.toString() ?? '',
  },
});
