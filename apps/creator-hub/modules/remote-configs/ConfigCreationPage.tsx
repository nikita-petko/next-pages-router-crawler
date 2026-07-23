import React, { FC } from 'react';
import { withNamespaceSwitchedTranslation } from '@modules/analytics-translations';
import {
  AnalyticsFlagGatedContext,
  AnalyticsPermissionControlledContext,
} from '@modules/experience-analytics-shared';
import { client as creatorConfigsApi } from '@modules/clients/analytics/universeConfigs';
import { client as universeExperimentationApi } from '@modules/clients/analytics/universeExperimentation';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CreatorExperimentationClientProvider } from './CreatorExperimentationClientProvider';
import CreatorConfigsClientProvider from './CreatorConfigsClientProvider';
import ConfigCreationPageContent from './ConfigCreationPageContent';
import makeValidatedApi from './api/makeValidatedAPI';
import makeValidatedExperimentationAPI from './api/makeValidatedExperimentationAPI';

const creatorConfigsClient = makeValidatedApi(creatorConfigsApi);
const experimentationClient = makeValidatedExperimentationAPI(universeExperimentationApi);

const ConfigCreationPage: FC = () => {
  return (
    <AnalyticsFlagGatedContext flag='isTargetingConfigsEnabled'>
      <AnalyticsPermissionControlledContext permissionType='userCanViewAnalyticsForUniverse'>
        <CreatorConfigsClientProvider client={creatorConfigsClient}>
          <CreatorExperimentationClientProvider client={experimentationClient}>
            <ConfigCreationPageContent />
          </CreatorExperimentationClientProvider>
        </CreatorConfigsClientProvider>
      </AnalyticsPermissionControlledContext>
    </AnalyticsFlagGatedContext>
  );
};

export default withNamespaceSwitchedTranslation(ConfigCreationPage, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.Navigation,
  TranslationNamespace.UniverseConfigAndExperimentation,
]);
