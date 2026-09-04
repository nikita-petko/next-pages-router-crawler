import type { NextLayoutPage } from 'next';
import { StatusCodes } from '@rbx/core';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import { ErrorPage } from '@modules/miscellaneous/error';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import { useUniversePermissions } from '@modules/react-query/organizations';
import ExternalEligibilityReportPageContent from '@modules/shops/pages/ExternalEligibilityReportPageContent';
import ExternalEligibilityReportPageTitle from '@modules/shops/pages/ExternalEligibilityReportPageTitle';

const ExternalEligibilityReportPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  const { data: permissions, isLoading: isPermissionsLoading } = useUniversePermissions(universeId);

  if (!universeId || isPermissionsLoading) {
    return null;
  }

  if (!permissions?.monetizeExperience && !permissions?.viewAnalytics) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  return <ExternalEligibilityReportPageContent universeId={universeId} />;
};

ExternalEligibilityReportPage.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: <ExternalEligibilityReportPageTitle /> });
ExternalEligibilityReportPage.loggerConfig = { rosId: RosTeams.MonetizationProducts };

export default ExternalEligibilityReportPage;
