import type { FC, ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import AudienceReachPage from '@modules/audience-reach/components/AudienceReachPage';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';
import { PageLoading } from '@modules/miscellaneous/components';
import { PageNotFound } from '@modules/miscellaneous/error';
import AccessDeniedPage from '@modules/miscellaneous/error/components/AccessDeniedPage';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useUniversePermissions } from '@modules/react-query/organizations';

const AudienceReachTitle: FC = withTranslation(() => {
  const { translate } = useTranslation();
  return <Typography variant='h1'>{translate('Heading.AudienceReach')}</Typography>;
}, [TranslationNamespace.AudienceReach]);

const AudienceReachPageRoute: NextLayoutPage = () => {
  const { isLoadingGame, isErrorLoadingGame, gameDetails } = useCurrentGame();

  const { userCanViewAnalyticsForUniverse, isPending: isPendingAnalyticsExperiencePermissions } =
    useAnalyticsExperiencePermissions(gameDetails?.id ?? uninitializedUniverseId);
  const { data: universePermissions, isPending: isPendingUniversePermissions } =
    useUniversePermissions(gameDetails?.id);

  if (!isLoadingGame && (isErrorLoadingGame || gameDetails === null)) {
    // this must be checked first because the other querys will never resolve if gameDetails is null
    return <PageNotFound />;
  }

  if (isLoadingGame || isPendingAnalyticsExperiencePermissions || isPendingUniversePermissions) {
    return <PageLoading />;
  }

  const canView = userCanViewAnalyticsForUniverse || universePermissions?.publish === true;
  if (!canView) {
    return <AccessDeniedPage />;
  }

  return <AudienceReachPage />;
};

AudienceReachPageRoute.getPageLayout = (page: ReactNode) =>
  getCreationsPageLayout(page, { title: <AudienceReachTitle /> });
AudienceReachPageRoute.loggerConfig = { rosId: RosTeams.GameOperations };

export default AudienceReachPageRoute;
