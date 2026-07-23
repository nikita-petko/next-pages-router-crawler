import type { FC } from 'react';
import { StatusCodes } from '@rbx/core';
import { useFlag } from '@rbx/flags';
import { CircularProgress } from '@rbx/ui';
import { isTargetingConfigsEnabled as isTargetingConfigsEnabledFlag } from '@generated/flags/creatorAnalytics';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { client as creatorConfigsApi } from '@modules/clients/analytics/universeConfigs';
import { client as universeExperimentationApi } from '@modules/clients/analytics/universeExperimentation';
import AnalyticsPermissionControlledContext from '@modules/experience-analytics-shared/context/AnalyticsPermissionControlledContext';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import makeValidatedApi from './api/makeValidatedAPI';
import makeValidatedExperimentationAPI from './api/makeValidatedExperimentationAPI';
import ConfigCreationPageContent from './ConfigCreationPageContent';
import CreatorConfigsClientProvider from './CreatorConfigsClientProvider';
import { CreatorExperimentationClientProvider } from './CreatorExperimentationClientProvider';

const creatorConfigsClient = makeValidatedApi(creatorConfigsApi);
const experimentationClient = makeValidatedExperimentationAPI(universeExperimentationApi);

const ConfigCreationPage: FC = () => {
  const { id: universeId, isLoading: isUniverseLoading } = useUniverseResource();
  const { ready: isTargetingConfigsReady, value: isTargetingConfigsEnabledValue } = useFlag(
    isTargetingConfigsEnabledFlag,
    {
      universeId,
    },
  );
  const isTargetingConfigsEnabled = isTargetingConfigsReady && isTargetingConfigsEnabledValue;

  if (isUniverseLoading || !isTargetingConfigsReady) {
    return (
      <EmptyGrid>
        <CircularProgress data-testid='loading' />
      </EmptyGrid>
    );
  }

  if (!isTargetingConfigsEnabled) {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  return (
    <AnalyticsPermissionControlledContext permissionType='userCanViewAnalyticsForUniverse'>
      <CreatorConfigsClientProvider client={creatorConfigsClient}>
        <CreatorExperimentationClientProvider client={experimentationClient}>
          <ConfigCreationPageContent />
        </CreatorExperimentationClientProvider>
      </CreatorConfigsClientProvider>
    </AnalyticsPermissionControlledContext>
  );
};

export default withNamespaceSwitchedTranslation(ConfigCreationPage, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.Navigation,
  TranslationNamespace.UniverseConfigAndExperimentation,
]);
