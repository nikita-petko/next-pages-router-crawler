import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import CredentialsContainer from '@modules/open-cloud/app-credentials/containers/CredentialsContainer';
import CredentialsTabsStates from '@modules/open-cloud/app-credentials/enums/CredentialsTabsStates';
import { OAuthMetadataProvider } from '@modules/open-cloud/oauth2/OAuthMetadataContext';

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
    <CreatorHubLayout
      noBreadCrumbs
      title={<Translate namespace='CreatorDashboard.Navigation' translationKey={pageTitle} />}>
      {page}
    </CreatorHubLayout>
  );
};
Credentials.loggerConfig = { rosId: RosTeams.CreatorIdentity };

export default Credentials;
