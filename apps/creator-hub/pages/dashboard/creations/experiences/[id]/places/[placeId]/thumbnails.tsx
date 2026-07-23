import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { getPlaceAnalyticsPageLayout } from '@modules/creations';
/*
 * NOTE(lucaswang 02-15-2023): Part of the task https://roblox.atlassian.net/browse/DSA-900
 * which introduces a new eslint rule to disallow importing private components from other modules.
 * Should refactor to export private component in the corresponding module's index.ts.
 */
// eslint-disable-next-line no-restricted-imports -- see comment above
import PlaceThumbnailsContainer from '@modules/creations/placeThumbnails/containers/PlaceThumbnailsContainer';

const Thumbnails: NextLayoutPage = () => {
  return (
    <Authenticated>
      <PlaceThumbnailsContainer />
    </Authenticated>
  );
};

Thumbnails.getPageLayout = (page) =>
  getPlaceAnalyticsPageLayout(page, { title: 'Heading.Thumbnails' });

export default Thumbnails;
