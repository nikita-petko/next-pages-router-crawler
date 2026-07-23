import type { FC, ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import AudienceReachPage from '@modules/audience-reach/components/AudienceReachPage';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';
import { PageLoading } from '@modules/miscellaneous/components';
import AccessDeniedPage from '@modules/miscellaneous/error/components/AccessDeniedPage';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';

const AudienceReachTitle: FC = withTranslation(() => {
  const { translate } = useTranslation();
  return <Typography variant='h1'>{translate('Heading.AudienceReach')}</Typography>;
}, [TranslationNamespace.AudienceReach]);

const AudienceReachPageRoute: NextLayoutPage = () => {
  const { canConfigure, isLoadingGame, gameDetails } = useCurrentGame();
  const { userCanViewAnalyticsForUniverse, isPending: isPendingAnalyticsExperiencePermissions } =
    useAnalyticsExperiencePermissions(gameDetails?.id ?? uninitializedUniverseId);

  if (isLoadingGame || isPendingAnalyticsExperiencePermissions) {
    return <PageLoading />;
  }

  const canView = canConfigure === true || userCanViewAnalyticsForUniverse;
  if (!canView) {
    return <AccessDeniedPage />;
  }

  return <AudienceReachPage />;
};

AudienceReachPageRoute.getPageLayout = (page: ReactNode) =>
  getCreationsPageLayout(page, { title: <AudienceReachTitle /> });
AudienceReachPageRoute.loggerConfig = { rosId: RosTeams.GameOperations };

export default AudienceReachPageRoute;
