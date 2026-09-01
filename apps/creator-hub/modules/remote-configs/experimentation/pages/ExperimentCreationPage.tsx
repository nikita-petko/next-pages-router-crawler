import type { FC } from 'react';
import { client as creatorConfigsApi } from '@modules/clients/analytics/universeConfigs';
import { client as universeExperimentationApi } from '@modules/clients/analytics/universeExperimentation';
import AnalyticsPermissionControlledContext from '@modules/experience-analytics-shared/context/AnalyticsPermissionControlledContext';
import MatchmakingConfigurationProvider from '@modules/matchmaking/providers/MatchmakingConfigurationProvider';
import UniversePlacesProvider from '@modules/matchmaking/providers/UniversePlacesProvider';
import makeValidatedApi from '../../api/makeValidatedAPI';
import makeValidatedExperimentationAPI from '../../api/makeValidatedExperimentationAPI';
import CreatorConfigsClientProvider from '../../CreatorConfigsClientProvider';
import { CreatorExperimentationClientProvider } from '../../CreatorExperimentationClientProvider';
import ExperimentCreationPageContent from './ExperimentCreationPageContent';

const configsClient = makeValidatedApi(creatorConfigsApi);
const client = makeValidatedExperimentationAPI(universeExperimentationApi);
const ExperimentCreationPage: FC = () => {
  return (
    <AnalyticsPermissionControlledContext permissionType='userCanViewAnalyticsForUniverse'>
      <CreatorConfigsClientProvider client={configsClient}>
        <CreatorExperimentationClientProvider client={client}>
          <UniversePlacesProvider>
            <MatchmakingConfigurationProvider>
              <ExperimentCreationPageContent />
            </MatchmakingConfigurationProvider>
          </UniversePlacesProvider>
        </CreatorExperimentationClientProvider>
      </CreatorConfigsClientProvider>
    </AnalyticsPermissionControlledContext>
  );
};

export default ExperimentCreationPage;
