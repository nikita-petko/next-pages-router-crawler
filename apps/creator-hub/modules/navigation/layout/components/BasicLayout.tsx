import type { FunctionComponent } from 'react';
import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { CookieConsentBanner } from '@rbx/cookie-banner';
import {
  AssistantTab,
  NavigationConfigsProvider,
  TopNavigation,
  PublicFooter,
  PrivateFooter,
  AuthenticationStatusContainer,
} from '@rbx/creator-hub-navigation';
import { Grid, CircularProgress, NoSSR } from '@rbx/ui';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import NotificationTray from '../../topNavigation/components/NotificationTray';
import getNavigationEnvironment from '../../utils/getNavigationEnvironment';
import useFooterBehavior from '../hooks/useFooterBehavior';
import useBasicLayoutStyles from './BasicLayout.styles';
import useLayoutStyles from './Layout.styles';

const PrivacyChoicesFooterLink = dynamic(
  () => import('../../components/PrivacyChoicesFooterLink'),
  { ssr: false },
);

export interface BasicLayoutProps {
  classes?: Partial<{ root: string; footer: string; header: string }>;
  isReady?: boolean;
  product?: 'CreatorHub' | 'CreatorDashboard' | 'RoadMap' | 'DataCollection';
  showHeader?: boolean;
  showNotificationTray?: boolean;
}

const BasicLayout: FunctionComponent<React.PropsWithChildren<BasicLayoutProps>> = ({
  isReady = true,
  product,
  children,
  classes,
  showHeader = true,
  showNotificationTray = true,
}) => {
  const router = useRouter();
  const footerBehavior = useFooterBehavior();
  const { settings, isFetched } = useSettings();
  const currentProduct = product ?? (router.basePath === '' ? 'CreatorHub' : 'CreatorDashboard');

  const {
    classes: { scrollableY },
    cx,
  } = useLayoutStyles();
  const {
    classes: { root, main, content },
  } = useBasicLayoutStyles();

  return (
    <NavigationConfigsProvider
      currentProduct={currentProduct}
      environment={getNavigationEnvironment()}
      target={process.env.buildTarget}
      signalRCrossTab={{
        enabled: settings.enableSignalRCrossTab,
        isFetched,
      }}
      enableGroupModeration={settings.enableGroupModerationPage}>
      <NoSSR>
        <Grid className={root} container flexDirection='column' wrap='nowrap'>
          {showHeader && (
            <TopNavigation
              className={cx(classes?.header)}
              rightContent={
                <Grid container justifyContent='flex-end' wrap='nowrap'>
                  <AssistantTab />
                  {showNotificationTray && <NotificationTray />}
                  <AuthenticationStatusContainer />
                </Grid>
              }
            />
          )}
          <Grid
            container
            flexDirection='column'
            flexWrap='nowrap'
            alignItems='center'
            className={cx(main, scrollableY)}>
            <Grid container className={content} justifyContent='center' alignItems='center'>
              {isReady ? children : <CircularProgress />}
            </Grid>

            <footer>
              <PublicFooter />
              <PrivateFooter
                behavior={footerBehavior}
                additionalLinks={
                  settings.enableGPCFooter ? <PrivacyChoicesFooterLink inline /> : undefined
                }
              />
            </footer>
          </Grid>
        </Grid>
        <CookieConsentBanner />
      </NoSSR>
    </NavigationConfigsProvider>
  );
};

export default BasicLayout;
