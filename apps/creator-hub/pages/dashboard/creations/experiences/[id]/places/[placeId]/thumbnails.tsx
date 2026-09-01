import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import getPlaceAnalyticsPageLayout from '@modules/creations/places/layout/getPlaceAnalyticsPageLayout';
/*
 * NOTE(lucaswang 02-15-2023): Part of the task https://roblox.atlassian.net/browse/DSA-900
 * which introduces a new eslint rule to disallow importing private components from other modules.
 * Should refactor to export private component in the corresponding module's index.ts.
 */
import PlaceThumbnailsContainer from '@modules/creations/placeThumbnails/containers/PlaceThumbnailsContainer';

const Thumbnails: NextLayoutPage = () => {
  return (
    <Authenticated>
      <PlaceThumbnailsContainer />
    </Authenticated>
  );
};

Thumbnails.getPageLayout = (page) =>
  getPlaceAnalyticsPageLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.PlaceThumbnails' />
    ),
  });
Thumbnails.loggerConfig = { rosId: RosTeams.DiscoveryUX };

export default Thumbnails;
