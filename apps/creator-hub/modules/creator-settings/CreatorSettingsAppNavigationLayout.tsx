import { FunctionComponent, ReactNode, useEffect, useContext, PropsWithChildren } from 'react';
import { useAuthentication } from '@modules/authentication/providers';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import {
  CreatorNotificationsSettingsContext,
  TCreatorNotificationsSettingsContext,
} from './hooks/CreatorNotificationsSettingsContext';
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
  title?: string;
  noBreadCrumbs?: boolean;
  beta?: boolean;
};
export const getCreatorSettingsAppNavigationLayout = (
  page: ReactNode,
  props: TLayoutProps = {},
) => {
  return (
    <IALayoutExperiment
      {...props}
      leftNavigationContents={<CreatorSettingsLeftNavigation />}
      secondarySize='small'>
      <CreatorSettingsAppNavigationLayout>{page}</CreatorSettingsAppNavigationLayout>
    </IALayoutExperiment>
  );
};

export default CreatorSettingsAppNavigationLayout;
