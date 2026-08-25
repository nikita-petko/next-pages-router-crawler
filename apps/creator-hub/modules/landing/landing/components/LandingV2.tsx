import type { FunctionComponent } from 'react';
import { useEffect, useState } from 'react';
import { withTranslation } from '@rbx/intl';
import { Grid, UIThemeProvider } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  getAuthorizationEndpoint,
  type TAuthorizationEndpointOptions,
} from '@modules/navigation/applicationAuthorization/services/appAuthDataService';
import BasicLayout from '@modules/navigation/layout/components/BasicLayout';
import Experiences from '../../sections/components/Experiences';
import GlobalCommunity from '../../sections/components/GlobalCommunity';
import LandingHead from '../../sections/components/LandingHead';
import Making from '../../sections/components/MakeAnything';
import StudioOverview from '../../sections/components/StudioOverview';
import StudioV2 from '../../sections/components/StudioV2';
import Tools from '../../sections/components/Tools';
import { captureLandingPageImpression } from '../utils/eventUtils';
import LandingDivider from './LandingDivider';

const LandingV2: FunctionComponent = () => {
  const [loginUrl, setLoginUrl] = useState('');

  useEffect(() => {
    captureLandingPageImpression();
  }, []);

  useEffect(() => {
    const getLoginUrl = async () => {
      const options: TAuthorizationEndpointOptions = { redirectUri: process.env.baseUrl };
      const authUrl = await getAuthorizationEndpoint(options);
      setLoginUrl(authUrl);
    };
    void getLoginUrl();
  }, []);

  return (
    <UIThemeProvider theme='dark'>
      <BasicLayout product='CreatorHub'>
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
      </BasicLayout>
    </UIThemeProvider>
  );
};

export default withTranslation(LandingV2, [
  TranslationNamespace.UnifiedNavigation,
  TranslationNamespace.Privacy,
]);
