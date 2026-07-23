import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import CredentialsContainer from '@modules/open-cloud/app-credentials/containers/CredentialsContainer';
import CredentialsTabsStates from '@modules/open-cloud/app-credentials/enums/CredentialsTabsStates';
import { OAuthMetadataProvider } from '@modules/open-cloud/oauth2/OAuthMetadataContext';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';

const Credentials: NextLayoutPage = () => {
  return (
    <Authenticated>
      <OAuthMetadataProvider>
        <CredentialsContainer />
      </OAuthMetadataProvider>
    </Authenticated>
  );
};

Credentials.getPageLayout = (page, { query }) => {
  const pageTitle =
    query.activeTab === CredentialsTabsStates.OAuthTab ? 'Heading.OAuth2' : 'Heading.ApiExtensions';

  return (
    <IALayoutExperiment noBreadCrumbs title={pageTitle}>
      {page}
    </IALayoutExperiment>
  );
};

export default Credentials;
