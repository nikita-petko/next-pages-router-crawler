import { useAuthentication } from '@modules/authentication/providers';
import {
  ConfigureExperienceNotificationResponse,
  notificationsClient,
} from '@modules/clients/notifications';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { useRouter } from 'next/router';
import React, {
  FunctionComponent,
  createContext,
  useCallback,
  useContext,
  useState,
  useMemo,
} from 'react';
import {
  getNotificationStringsList,
  getNotificationStringsListFailed,
  getNotificationStringsListSuccess,
} from '../../constants/notificationEventConstants';
import useUniverseId from '../../hooks/useUniverseId';

export type NotificationContentContextValue = {
  notificationsContentList: ConfigureExperienceNotificationResponse[];
  archiveNotificationContent: (contentId: string) => Promise<void>;
  initializeNotificationsContentList: (universeId: number) => Promise<void>;
  isNotificationContentLoading: boolean;
  isGetNotificationsContentListFailed: boolean;
};

const NotificationsContentContext = createContext<NotificationContentContextValue>({
  notificationsContentList: [],
  archiveNotificationContent: () => new Promise((resolve) => resolve()),
  initializeNotificationsContentList: () => new Promise((resolve) => resolve()),
  isNotificationContentLoading: true,
  isGetNotificationsContentListFailed: false,
});
NotificationsContentContext.displayName = 'NotificationContent';

const NotificationsContentProvider: FunctionComponent<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const { trackerClient } = useEventTrackerProvider();
  const router = useRouter();
  const { user } = useAuthentication();
  const [isNotificationContentLoading, setIsNotificationContentLoading] = useState(true);
  const [isGetNotificationsContentListFailed, setIsGetNotificationsContentListFailed] =
    useState(false);
  const [notificationsContentList, setNotificationsContentList] = useState<
    ConfigureExperienceNotificationResponse[]
  >([]);
  const universeId = useUniverseId();

  if (!universeId) {
    router.push('/dashboard/creations');
  }

  const getNotificationsContentList = async (universeID: number | undefined) => {
    if (!universeID) return [];
    trackerClient.sendEvent(getNotificationStringsList(user?.id, universeID));
    try {
      const notificationsContentData =
        await notificationsClient.getNotificationsContent(universeID);
      setIsGetNotificationsContentListFailed(false);
      trackerClient.sendEvent(getNotificationStringsListSuccess(user?.id, universeID));
      return notificationsContentData?.notificationStringConfigs ?? [];
    } catch {
      setIsGetNotificationsContentListFailed(true);
      trackerClient.sendEvent(getNotificationStringsListFailed(user?.id, universeID));
      return [];
    }
  };

  const initializeNotificationsContentList = useCallback(async (uid: number | undefined) => {
    setIsNotificationContentLoading(true);
    const contentList = await getNotificationsContentList(uid);
    setNotificationsContentList(contentList);
    setIsNotificationContentLoading(false);
    // NOTE: memoising getNotificationsContentList is an overkill, so disabling exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getNotificationsContentList is intentionally omitted; wrapping it would add noise without benefit
  }, []);

  const archiveNotificationContent = useCallback(async (contentId: string) => {
    await notificationsClient.archiveNotificationContent(contentId);
    setNotificationsContentList((list) => {
      return list.filter((content) => content.id !== contentId);
    });
  }, []);

  const providerValue = useMemo(
    () => ({
      archiveNotificationContent,
      notificationsContentList,
      isNotificationContentLoading,
      isGetNotificationsContentListFailed,
      initializeNotificationsContentList,
    }),
    [
      archiveNotificationContent,
      initializeNotificationsContentList,
      isGetNotificationsContentListFailed,
      isNotificationContentLoading,
      notificationsContentList,
    ],
  );

  return (
    <NotificationsContentContext.Provider value={providerValue}>
      {children}
    </NotificationsContentContext.Provider>
  );
};

const useNotificationsContent = () => {
  return useContext(NotificationsContentContext);
};

export { NotificationsContentContext, NotificationsContentProvider, useNotificationsContent };
