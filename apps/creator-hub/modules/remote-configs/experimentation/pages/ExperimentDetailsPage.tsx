import type { FC } from 'react';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { StatusCodes } from '@rbx/core';
import { Typography } from '@rbx/ui';
import { client as creatorConfigsApi } from '@modules/clients/analytics/universeConfigs';
import { client as universeExperimentationApi } from '@modules/clients/analytics/universeExperimentation';
import { getResponseFromError } from '@modules/clients/utils';
import { AnalyticsContextLayerOuterProvider } from '@modules/experience-analytics-shared/context/AnalyticsContextLayerProvider';
import AnalyticsPermissionControlledContext from '@modules/experience-analytics-shared/context/AnalyticsPermissionControlledContext';
import { UniverseResourceProvider } from '@modules/experience-analytics-shared/context/resourceContexts/UniverseResourceProvider';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import MatchmakingConfigurationProvider from '@modules/matchmaking/providers/MatchmakingConfigurationProvider';
import UniversePlacesProvider from '@modules/matchmaking/providers/UniversePlacesProvider';
import { PageLoading } from '@modules/miscellaneous/components';
import { ErrorPage, PageNotFound } from '@modules/miscellaneous/error';
import BreadcrumbItemType from '@modules/navigation/layout/enums/BreadcrumbsItemType';
import useBreadcrumbRegistration from '@modules/navigation/layout/hooks/useBreadcrumbRegistration';
import GameProvider from '@modules/providers/game/GameProvider';
import makeValidatedApi from '../../api/makeValidatedAPI';
import makeValidatedExperimentationAPI from '../../api/makeValidatedExperimentationAPI';
import CreatorConfigsClientProvider from '../../CreatorConfigsClientProvider';
import { CreatorExperimentationClientProvider } from '../../CreatorExperimentationClientProvider';
import useExperiment, { experimentIdPlaceholder } from '../hooks/useExperiment';
import ExperimentationDetailsPageContent from './ExperimentationDetailsPageContent';

const configsClient = makeValidatedApi(creatorConfigsApi);
const experimentClient = makeValidatedExperimentationAPI(universeExperimentationApi, configsClient);

const ExperimentDetailsPage = ({ experimentId }: { experimentId: string }) => {
  const { experiment, error, isDataLoading } = useExperiment({
    experimentId,
    refetchOnMount: true,
  });

  useBreadcrumbRegistration(BreadcrumbItemType.ExperimentDetails, experiment?.name);

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
        <AnalyticsContextLayerOuterProvider>
          <CreatorConfigsClientProvider client={configsClient}>
            <CreatorExperimentationClientProvider client={experimentClient}>
              <ExperimentDetailsPage experimentId={experimentIdString ?? experimentIdPlaceholder} />
            </CreatorExperimentationClientProvider>
          </CreatorConfigsClientProvider>
        </AnalyticsContextLayerOuterProvider>
      </UniverseResourceProvider>
    </GameProvider>
  );
};

export default ExperimentDetailsPageWrapper;
