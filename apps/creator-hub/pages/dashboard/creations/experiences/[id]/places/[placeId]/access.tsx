import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
/*
 * NOTE(lucaswang 02-15-2023): Part of the task https://roblox.atlassian.net/browse/DSA-900
 * which introduces a new eslint rule to disallow importing private components from other modules.
 * Should refactor to export private component in the corresponding module's index.ts.
 */
// eslint-disable-next-line no-restricted-imports -- see above
import getPlacePageLayout from '@modules/creations/places/layout/getPlacePageLayout';
// eslint-disable-next-line no-restricted-imports -- see above
import PlaceAccessContainer from '@modules/creations/placeAccess/containers/PlaceAccessContainer';

const Access: NextLayoutPage = () => (
  <Authenticated>
    <PlaceAccessContainer />
  </Authenticated>
);

Access.getPageLayout = (page) => getPlacePageLayout(page, { title: 'Heading.Access' });

export default Access;
