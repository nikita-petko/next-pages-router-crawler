import {
  AnalyticsContextLayerOuterProvider,
  AnalyticsPermissionControlledContext,
  getAnalyticsPageLayout,
  UniverseResourceProvider,
} from '@modules/experience-analytics-shared';
import { FC, useMemo } from 'react';
import { CreatorExperimentationClientProvider } from '@modules/remote-configs/CreatorExperimentationClientProvider';
import { client as universeExperimentationApi } from '@modules/clients/analytics/universeExperimentation';
import { useRouter } from 'next/router';
import { ErrorPage, PageNotFound } from '@modules/miscellaneous/error';
import MatchmakingConfigurationProvider from '@modules/matchmaking/providers/MatchmakingConfigurationProvider';
import UniversePlacesProvider from '@modules/matchmaking/providers/UniversePlacesProvider';
import { client as creatorConfigsApi } from '@modules/clients/analytics/universeConfigs';
import CreatorConfigsClientProvider from '@modules/remote-configs/CreatorConfigsClientProvider';
import { Typography } from '@rbx/ui';
import GameProvider from '@modules/providers/game/GameProvider';
import { StatusCodes } from '@rbx/core';
import { getResponseFromError } from '@modules/clients/utils';
import { PageLoading } from '@modules/miscellaneous/common';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { FeatureFlagsProvider } from '@modules/feature-flags/context/FeatureFlagsProvider';
import makeValidatedExperimentationAPI from '../../api/makeValidatedExperimentationAPI';
import ExperimentationDetailsPageContent from './ExperimentationDetailsPageContent';
import makeValidatedApi from '../../api/makeValidatedAPI';
import useExperiment, { experimentIdPlaceholder } from '../hooks/useExperiment';

const configsClient = makeValidatedApi(creatorConfigsApi);
const experimentClient = makeValidatedExperimentationAPI(universeExperimentationApi);

const ExperimentDetailsPage = ({ experimentId }: { experimentId: string }) => {
  const { experiment, error, isDataLoading } = useExperiment({
    experimentId,
    refetchOnMount: true,
  });

  const isExperimentNotFound = useMemo(() => {
    return error && getResponseFromError(error)?.status === StatusCodes.NOT_FOUND;
  }, [error]);

  const pageContent = useMemo(() => {
    if (isDataLoading) {
      return <PageLoading />;
    }

    if (isExperimentNotFound) {
      return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
    }

    return (
      <AnalyticsPermissionControlledContext permissionType='userCanViewAnalyticsForUniverse'>
        <UniversePlacesProvider>
          <MatchmakingConfigurationProvider>
            <ExperimentationDetailsPageContent experimentId={experimentId} />
          </MatchmakingConfigurationProvider>
        </UniversePlacesProvider>
      </AnalyticsPermissionControlledContext>
    );
  }, [isDataLoading, isExperimentNotFound, experimentId]);

  return getAnalyticsPageLayout(pageContent, {
    noNavigationItem: true,
    context: {
      title: (
        <Typography variant='h3' sx={{ display: 'block' }}>
          {experiment?.name}
        </Typography>
      ),
    },
  });
};

const ExperimentDetailsPageWrapper: FC = () => {
  const router = useRouter();
  const { experimentId } = router.query;

  const experimentIdString = useMemo(() => {
    if (Array.isArray(experimentId)) {
      return experimentId[0];
    }
    return experimentId;
  }, [experimentId]);

  if (!experimentIdString && router.isReady) {
    return <PageNotFound />;
  }

  return (
    <GameProvider>
      <UniverseResourceProvider>
        <FeatureFlagsProvider
          namespaces={[FeatureFlagNamespace.Analytics, FeatureFlagNamespace.Matchmaking]}>
          <AnalyticsContextLayerOuterProvider>
            <CreatorConfigsClientProvider client={configsClient}>
              <CreatorExperimentationClientProvider client={experimentClient}>
                <ExperimentDetailsPage
                  experimentId={experimentIdString ?? experimentIdPlaceholder}
                />
              </CreatorExperimentationClientProvider>
            </CreatorConfigsClientProvider>
          </AnalyticsContextLayerOuterProvider>
        </FeatureFlagsProvider>
      </UniverseResourceProvider>
    </GameProvider>
  );
};

export default ExperimentDetailsPageWrapper;
