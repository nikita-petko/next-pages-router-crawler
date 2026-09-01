import type { NextLayoutPage } from 'next';
import { StatusCodes } from '@rbx/core';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import { ErrorPage } from '@modules/miscellaneous/error';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import { useUniversePermissions } from '@modules/react-query/organizations';
import PersonalizedShopsPageContent from '@modules/shops/pages/PersonalizedShopsPageContent';
import PersonalizedShopsPageTitle from '@modules/shops/pages/PersonalizedShopsPageTitle';

const PersonalizedShopsPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  const { data: permissions, isLoading: isPermissionsLoading } = useUniversePermissions(universeId);

  if (!universeId || isPermissionsLoading) {
    return null;
  }

  if (!permissions?.monetizeExperience && !permissions?.viewAnalytics) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  return <PersonalizedShopsPageContent universeId={universeId} />;
};

PersonalizedShopsPage.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: <PersonalizedShopsPageTitle /> });
PersonalizedShopsPage.loggerConfig = { rosId: RosTeams.MonetizationProducts };

export default PersonalizedShopsPage;
