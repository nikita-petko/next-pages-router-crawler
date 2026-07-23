import type { FunctionComponent, ReactNode, PropsWithChildren } from 'react';
import { useEffect, useContext } from 'react';
import { useAuthentication } from '@modules/authentication/providers';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import type { TCreatorNotificationsSettingsContext } from './hooks/CreatorNotificationsSettingsContext';
import { CreatorNotificationsSettingsContext } from './hooks/CreatorNotificationsSettingsContext';
import CreatorSettingsLeftNavigation from './leftNavigation/CreatorSettingsLeftNavigation';

const CreatorSettingsAppNavigationLayout: FunctionComponent<PropsWithChildren> = ({ children }) => {
  const { user } = useAuthentication();

  const { getNotificationSettings } = useContext<TCreatorNotificationsSettingsContext>(
    CreatorNotificationsSettingsContext,
  );

  useEffect(() => {
    if (user?.id) {
      getNotificationSettings();
    }
  }, [user?.id, getNotificationSettings]);

  return children;
};

type TLayoutProps = {
  title?: string | ReactNode;
  noBreadCrumbs?: boolean;
  beta?: boolean;
};
export const getCreatorSettingsAppNavigationLayout = (
  page: ReactNode,
  props: TLayoutProps = {},
) => {
  return (
    <CreatorHubLayout
      {...props}
      leftNavigationContents={<CreatorSettingsLeftNavigation />}
      secondarySize='small'>
      <CreatorSettingsAppNavigationLayout>{page}</CreatorSettingsAppNavigationLayout>
    </CreatorHubLayout>
  );
};

export default CreatorSettingsAppNavigationLayout;
