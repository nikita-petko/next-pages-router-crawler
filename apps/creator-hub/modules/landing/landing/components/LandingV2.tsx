import React, { FunctionComponent, useEffect, useState } from 'react';
import {
  getAuthorizationEndpoint,
  type TAuthorizationEndpointOptions,
} from '@modules/navigation/applicationAuthorization/services/appAuthDataService';
import AppNavigationLayout from '@modules/navigation/layout/components/AppLayout';
import getNavigationEnvironment from '@modules/navigation/utils/getNavigationEnvironment';
import { Grid, UIThemeProvider } from '@rbx/ui';
import { NavigationConfigsProvider } from '@rbx/creator-hub-navigation';
import { useSettings } from '@modules/settings';
import Experiences from '../../sections/components/Experiences';
import GlobalCommunity from '../../sections/components/GlobalCommunity';
import LandingHead from '../../sections/components/LandingHead';
import Making from '../../sections/components/MakeAnything';
import StudioOverview from '../../sections/components/StudioOverview';
import StudioV2 from '../../sections/components/StudioV2';
import Tools from '../../sections/components/Tools';
import LandingDivider from './LandingDivider';
import { captureLandingPageImpression } from '../utils/eventUtils';

const LandingV2: FunctionComponent = () => {
  const [loginUrl, setLoginUrl] = useState('');
  const { settings, isFetched } = useSettings();

  useEffect(() => {
    captureLandingPageImpression();
  }, []);

  useEffect(() => {
    const getLoginUrl = async () => {
      const options: TAuthorizationEndpointOptions = { redirectUri: process.env.baseUrl };
      const authUrl = await getAuthorizationEndpoint(options);
      setLoginUrl(authUrl);
    };
    getLoginUrl();
  }, []);

  return (
    <UIThemeProvider theme='dark'>
      <NavigationConfigsProvider
        currentProduct='CreatorHub'
        environment={getNavigationEnvironment()}
        target={process.env.buildTarget}
        signalRCrossTab={{
          enabled: settings.enableSignalRCrossTab,
          isFetched,
        }}
        enableGroupModeration={settings.enableGroupModerationPage}>
        <AppNavigationLayout disableLeftNavigation usePublicFooter>
          <LandingHead />
          <Grid>
            <StudioV2 />
            <LandingDivider showHighlight />
            <Experiences />
            <LandingDivider showHighlight />
            <StudioOverview />
            <LandingDivider />
            <GlobalCommunity />
            <LandingDivider showHighlight />
            <Tools loginUrl={loginUrl} />
            <Making />
          </Grid>
        </AppNavigationLayout>
      </NavigationConfigsProvider>
    </UIThemeProvider>
  );
};

export default LandingV2;
