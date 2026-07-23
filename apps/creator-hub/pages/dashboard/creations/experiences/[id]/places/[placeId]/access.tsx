import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import PlaceAccessContainer from '@modules/creations/placeAccess/containers/PlaceAccessContainer';
/*
 * NOTE(lucaswang 02-15-2023): Part of the task https://roblox.atlassian.net/browse/DSA-900
 * which introduces a new eslint rule to disallow importing private components from other modules.
 * Should refactor to export private component in the corresponding module's index.ts.
 */
import getPlacePageLayout from '@modules/creations/places/layout/getPlacePageLayout';

const Access: NextLayoutPage = () => (
  <Authenticated>
    <PlaceAccessContainer />
  </Authenticated>
);

Access.getPageLayout = (page) =>
  getPlacePageLayout(page, {
    title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Access' />,
  });
Access.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default Access;
