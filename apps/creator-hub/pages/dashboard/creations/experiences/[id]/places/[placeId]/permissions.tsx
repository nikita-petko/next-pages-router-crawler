import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import PlacePermissionsContainer from '@modules/creations/placePermissions/PlacePermissionsContainer/PlacePermissionsContainer';
/*
 * NOTE(lucaswang 02-15-2023): Part of the task https://roblox.atlassian.net/browse/DSA-900
 * which introduces a new eslint rule to disallow importing private components from other modules.
 * Should refactor to export private component in the corresponding module's index.ts.
 */
import getPlacePageLayout from '@modules/creations/places/layout/getPlacePageLayout';

const Permissions: NextLayoutPage = () => (
  <Authenticated>
    <PlacePermissionsContainer />
  </Authenticated>
);
Permissions.getPageLayout = (page) =>
  getPlacePageLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Permissions' />
    ),
  });
Permissions.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default Permissions;
