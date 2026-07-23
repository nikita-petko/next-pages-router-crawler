import CreatorDashboardContext from '@modules/eventStream/enum/CreatorDashboardContext';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import CreatorDashboardSource from '@modules/eventStream/enum/CreatorDashboardSource';
import type { TrackerClientRequest } from '@modules/eventStream/constants/eventConstants';

const archiveNotificationContentEventModel = (
  userId: string | number | undefined,
  universeId: string | number | undefined,
  contentId: string | undefined,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.ArchiveNotificationContent,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.NotificationContentOverview,
    userId: userId ? `${userId}` : 'unknown',
    universeId: universeId ? `${universeId}` : 'unknown',
    contentId: contentId || 'unknown',
  },
});
const archiveNotificationContentSuccessEventModel = (
  userId: string | number | undefined,
  universeId: string | number | undefined,
  contentId: string | undefined,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.ArchiveNotificationContentSuccess,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.NotificationContentOverview,
    userId: userId ? `${userId}` : 'unknown',
    universeId: universeId ? `${universeId}` : 'unknown',
    contentId: contentId || 'unknown',
  },
});

const archiveNotificationContentFailedEventModel = (
  userId: string | number | undefined,
  universeId: string | number | undefined,
  contentId: string | undefined,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.ArchiveNotificationContentFailure,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.NotificationContentOverview,
    userId: userId ? `${userId}` : 'unknown',
    universeId: universeId ? `${universeId}` : 'unknown',
    contentId: contentId || 'unknown',
  },
});

const copyNotificationContentAssetIdEventModel = (
  userId: string | number | undefined,
  universeId: string | number | undefined,
  contentId: string | undefined,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.CopyNotificationContentAssetId,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.NotificationContentOverview,
    userId: userId ? `${userId}` : 'unknown',
    universeId: universeId ? `${universeId}` : 'unknown',
    contentId: contentId || 'unknown',
  },
});

const createNotificationContentEventModel = (
  userId: string | number | undefined,
  universeId: string | number | undefined,
  isGroup: boolean,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.CreateNotificationContent,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.NotificationContentForm,
    userId: userId ? `${userId}` : 'unknown',
    universeId: universeId ? `${universeId}` : 'unknown',
    isGroup: isGroup ? 'true' : 'false',
  },
});

const createNotificationContentSuccessEventModel = (
  userId: string | number | undefined,
  universeId: string | number | undefined,
  contentId: string | undefined,
  isGroup: boolean,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.CreateNotificationContentSuccess,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.NotificationContentForm,
    userId: userId ? `${userId}` : 'unknown',
    universeId: universeId ? `${universeId}` : 'unknown',
    contentId: contentId || 'unknown',
    isGroup: isGroup ? 'true' : 'false',
  },
});

const createNotificationContentFailedEventModel = (
  userId: string | number | undefined,
  universeId: string | number | undefined,
  isGroup: boolean,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.CreateNotificationContentFailure,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.NotificationContentForm,
    userId: userId ? `${userId}` : 'unknown',
    universeId: universeId ? `${universeId}` : 'unknown',
    isGroup: isGroup ? 'true' : 'false',
  },
});

const initiateCreateNotificationContentEventModel = (
  userId: string | number | undefined,
  universeId: string | number | undefined,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.InitiateCreateNotificationContent,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.NotificationContentOverview,
    userId: userId ? `${userId}` : 'unknown',
    universeId: universeId ? `${universeId}` : 'unknown',
  },
});
const notificationStringListLoaded = (
  userId: string | number | undefined,
  universeId: string | number | undefined,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.NotificationStringListLoaded,
  context: CreatorDashboardContext.Load,
  additionalProperties: {
    Source: CreatorDashboardSource.NotificationContentOverview,
    userId: userId ? `${userId}` : 'unknown',
    universeId: universeId ? `${universeId}` : 'unknown',
  },
});
const getNotificationStringsList = (
  userId: string | number | undefined,
  universeId: string | number | undefined,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.GetNotificationStringsList,
  context: CreatorDashboardContext.Load,
  additionalProperties: {
    Source: CreatorDashboardSource.NotificationContentOverview,
    userId: userId ? `${userId}` : 'unknown',
    universeId: universeId ? `${universeId}` : 'unknown',
  },
});

const getNotificationStringsListSuccess = (
  userId: string | number | undefined,
  universeId: string | number | undefined,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.GetNotificationStringsListSuccess,
  context: CreatorDashboardContext.Load,
  additionalProperties: {
    Source: CreatorDashboardSource.NotificationContentOverview,
    userId: userId ? `${userId}` : 'unknown',
    universeId: universeId ? `${universeId}` : 'unknown',
  },
});
const getNotificationStringsListFailed = (
  userId: string | number | undefined,
  universeId: string | number | undefined,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.GetNotificationStringsListFailure,
  context: CreatorDashboardContext.Load,
  additionalProperties: {
    Source: CreatorDashboardSource.NotificationContentOverview,
    userId: userId ? `${userId}` : 'unknown',
    universeId: universeId ? `${universeId}` : 'unknown',
  },
});

const getNotificationStringFailed = (
  userId: string | number | undefined,
  universeId: string | number | undefined,
  contentId: string | undefined,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.GetNotificationStringFailure,
  context: CreatorDashboardContext.Load,
  additionalProperties: {
    Source: CreatorDashboardSource.NotificationContentForm,
    userId: userId ? `${userId}` : 'unknown',
    universeId: universeId ? `${universeId}` : 'unknown',
    contentId: contentId || 'unknown',
  },
});

const getNotificationStringSuccess = (
  userId: string | number | undefined,
  universeId: string | number | undefined,
  contentId: string | undefined,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.GetNotificationStringSuccess,
  context: CreatorDashboardContext.Load,
  additionalProperties: {
    Source: CreatorDashboardSource.NotificationContentForm,
    userId: userId ? `${userId}` : 'unknown',
    universeId: universeId ? `${universeId}` : 'unknown',
    contentId: contentId || 'unknown',
  },
});
const getNotificationString = (
  userId: string | number | undefined,
  universeId: string | number | undefined,
  contentId: string | undefined,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.GetNotificationString,
  context: CreatorDashboardContext.Load,
  additionalProperties: {
    Source: CreatorDashboardSource.NotificationContentForm,
    userId: userId ? `${userId}` : 'unknown',
    universeId: universeId ? `${universeId}` : 'unknown',
    contentId: contentId || 'unknown',
  },
});
const editNotificationContentLoaded = (
  userId: string | number | undefined,
  universeId: string | number | undefined,
  contentId: string | undefined,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.EditNotificationStringLoaded,
  context: CreatorDashboardContext.Load,
  additionalProperties: {
    Source: CreatorDashboardSource.NotificationContentForm,
    userId: userId ? `${userId}` : 'unknown',
    universeId: universeId ? `${universeId}` : 'unknown',
    contentId: contentId || 'unknown',
  },
});

const initiateEditNotificationContentEventModel = (
  userId: string | number | undefined,
  universeId: string | number | undefined,
  contentId: string | undefined,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.InitiateEditNotificationContent,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.NotificationContentOverview,
    userId: userId ? `${userId}` : 'unknown',
    universeId: universeId ? `${universeId}` : 'unknown',
    contentId: contentId || 'unknown',
  },
});

const editNotificationContentEventModel = (
  userId: string | number | undefined,
  universeId: string | number | undefined,
  contentId: string | undefined,
  isGroup: boolean,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.EditNotificationContent,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.NotificationContentForm,
    userId: userId ? `${userId}` : 'unknown',
    universeId: universeId ? `${universeId}` : 'unknown',
    contentId: contentId || 'unknown',
    isGroup: isGroup ? 'true' : 'false',
  },
});

const editNotificationContentSuccessEventModel = (
  userId: string | number | undefined,
  universeId: string | number | undefined,
  contentId: string | undefined,
  isGroup: boolean,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.EditNotificationContentSuccess,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.NotificationContentForm,
    userId: userId ? `${userId}` : 'unknown',
    universeId: universeId ? `${universeId}` : 'unknown',
    contentId: contentId || 'unknown',
    isGroup: isGroup ? 'true' : 'false',
  },
});

const editNotificationContentFailedEventModel = (
  userId: string | number | undefined,
  universeId: string | number | undefined,
  contentId: string | undefined,
  isGroup: boolean,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.EditNotificationContentFailure,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.NotificationContentForm,
    userId: userId ? `${userId}` : 'unknown',
    universeId: universeId ? `${universeId}` : 'unknown',
    contentId: contentId || 'unknown',
    isGroup: isGroup ? 'true' : 'false',
  },
});

export {
  archiveNotificationContentEventModel,
  archiveNotificationContentSuccessEventModel,
  archiveNotificationContentFailedEventModel,
  copyNotificationContentAssetIdEventModel,
  createNotificationContentEventModel,
  createNotificationContentSuccessEventModel,
  createNotificationContentFailedEventModel,
  editNotificationContentLoaded,
  initiateCreateNotificationContentEventModel,
  initiateEditNotificationContentEventModel,
  editNotificationContentEventModel,
  editNotificationContentSuccessEventModel,
  editNotificationContentFailedEventModel,
  getNotificationString,
  getNotificationStringFailed,
  getNotificationStringSuccess,
  getNotificationStringsList,
  getNotificationStringsListFailed,
  getNotificationStringsListSuccess,
  notificationStringListLoaded,
};
