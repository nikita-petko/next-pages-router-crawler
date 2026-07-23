import { AnalyticsPermissionControlledContext } from '@modules/experience-analytics-shared';
import React, { FC } from 'react';
import { CreatorExperimentationClientProvider } from '@modules/remote-configs/CreatorExperimentationClientProvider';
import { client as universeExperimentationApi } from '@modules/clients/analytics/universeExperimentation';
import { client as creatorConfigsApi } from '@modules/clients/analytics/universeConfigs';
import CreatorConfigsClientProvider from '@modules/remote-configs/CreatorConfigsClientProvider';
import MatchmakingConfigurationProvider from '@modules/matchmaking/providers/MatchmakingConfigurationProvider';
import UniversePlacesProvider from '@modules/matchmaking/providers/UniversePlacesProvider';
import makeValidatedApi from '../../api/makeValidatedAPI';
import makeValidatedExperimentationAPI from '../../api/makeValidatedExperimentationAPI';
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
