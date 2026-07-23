import React, { FunctionComponent, ReactNode, useMemo } from 'react';
import { Grid } from '@rbx/ui';

import {
  AssistantTab,
  AuthenticationStatusContainer,
  TopNavigation,
} from '@rbx/creator-hub-navigation';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';
import LeftNavigationContainer from '../../leftNavigation/components/LeftNavigationContainer';
import LeftNavigation from '../../leftNavigation/components/LeftNavigation';
import TopNavigationSidebarDrawerContext from '../../layout/hooks/TopNavigationSidebarDrawerContext';
import NotificationTray from './NotificationTray';

type UnifiedTopNavigationProps = {
  leftNavigationContents?: ReactNode;
  disableLeftNavigation: boolean;
  useExperienceNavigation?: boolean;
};
const UnifiedTopNavigation: FunctionComponent<
  React.PropsWithChildren<UnifiedTopNavigationProps>
> = ({ leftNavigationContents, disableLeftNavigation, useExperienceNavigation }) => {
  const drawerContext = useMemo(
    () => ({
      insideTopNavigationDrawer: true,
    }),
    [],
  );
  return (
    <TopNavigation
      rightContent={
        <Grid container justifyContent='flex-end' wrap='nowrap'>
          <AssistantTab />
          <NotificationTray />
          <AuthenticationStatusContainer />
        </Grid>
      }
      compactProductSidebarNavigation={
        disableLeftNavigation === false ? (
          <TopNavigationSidebarDrawerContext.Provider value={drawerContext}>
            <ToolboxServiceApiProvider>
              <LeftNavigationContainer
                primarySidebarExpanded
                useExperienceNavigation={useExperienceNavigation}
                secondaryleftNavigationContents={leftNavigationContents ?? <LeftNavigation />}
              />
            </ToolboxServiceApiProvider>
          </TopNavigationSidebarDrawerContext.Provider>
        ) : undefined
      }
    />
  );
};

export default UnifiedTopNavigation;
