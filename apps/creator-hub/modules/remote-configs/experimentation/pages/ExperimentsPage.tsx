import { useEffect } from 'react';
import { StatusCodes } from '@rbx/core';
import { CircularProgress } from '@rbx/ui';
import { analyticsExperimentsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { client as creatorConfigsApi } from '@modules/clients/analytics/universeConfigs';
import { client as universeExperimentationApi } from '@modules/clients/analytics/universeExperimentation';
import { useHasUserSeenAnalyticsPage } from '@modules/creations/common/components/AnalyticsPageNewChip';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import makeValidatedApi from '../../api/makeValidatedAPI';
import makeValidatedExperimentationAPI from '../../api/makeValidatedExperimentationAPI';
import { CreatorExperimentationClientProvider } from '../../CreatorExperimentationClientProvider';
import useCanConfigureOrPublish from '../../hooks/useCanConfigureOrPublish';
import ExperimentsPageContent from './ExperimentsPageContent';

const configsClient = makeValidatedApi(creatorConfigsApi);
const client = makeValidatedExperimentationAPI(universeExperimentationApi, configsClient);
const ExperimentsPage = () => {
  const { setHasUserSeen } = useHasUserSeenAnalyticsPage(analyticsExperimentsNavigationItem.path);
  useEffect(() => {
    setHasUserSeen(true);
  }, [setHasUserSeen]);

  const { id: universeId } = useUniverseResource();
  const { userCanViewAnalyticsForUniverse, isPending: isPendingAnalyticsExperiencePermissions } =
    useAnalyticsExperiencePermissions(universeId);
  const { canConfigure } = useCanConfigureOrPublish();

  if (isPendingAnalyticsExperiencePermissions) {
    return (
      <EmptyGrid>
        <CircularProgress data-testid='loading' />
      </EmptyGrid>
    );
  }

  if (!userCanViewAnalyticsForUniverse && !canConfigure) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  return (
    <CreatorExperimentationClientProvider client={client}>
      <ExperimentsPageContent />
    </CreatorExperimentationClientProvider>
  );
};

export default ExperimentsPage;
