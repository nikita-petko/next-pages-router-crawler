import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import getPlacePageLayout from '@modules/creations/places/layout/getPlacePageLayout';
import PlaceVersionHistoryContainer from '@modules/creations/placeVersionHistory/components/PlaceVersionHistoryContainer';
/*
 * NOTE(lucaswang 02-15-2023): Part of the task https://roblox.atlassian.net/browse/DSA-900
 * which introduces a new eslint rule to disallow importing private components from other modules.
 * Should refactor to export private component in the corresponding module's index.ts.
 */
import PlaceVersionHistoryProvider from '@modules/creations/placeVersionHistory/provider/PlaceVersionHistoryProvider';

const VersionHistory: NextLayoutPage = () => {
  return (
    <Authenticated>
      <PlaceVersionHistoryProvider>
        <PlaceVersionHistoryContainer />
      </PlaceVersionHistoryProvider>
    </Authenticated>
  );
};

VersionHistory.getPageLayout = (page) =>
  getPlacePageLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.VersionHistory' />
    ),
  });
VersionHistory.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default VersionHistory;
