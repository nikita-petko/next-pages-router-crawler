import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import { SnackbarProvider } from '@rbx/ui';
import Authenticated from '@modules/authentication/Authenticated';
/*
 * NOTE(lucaswang 02-15-2023): Part of the task https://roblox.atlassian.net/browse/DSA-900
 * which introduces a new eslint rule to disallow importing private components from other modules.
 * Should refactor to export private component in the corresponding module's index.ts.
 */
import ExperienceAccessContainer from '@modules/creations/access/containers/ExperienceAccessContainer';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import MarketplacePublishingRequirementsContextProvider from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsProvider';

const Access: NextLayoutPage = () => {
  return (
    <Authenticated>
      <MarketplacePublishingRequirementsContextProvider>
        <SnackbarProvider>
          <ExperienceAccessContainer />
        </SnackbarProvider>
      </MarketplacePublishingRequirementsContextProvider>
    </Authenticated>
  );
};

Access.getPageLayout = (page) =>
  getCreationsPageLayout(page, {
    title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Access' />,
  });
Access.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default Access;
