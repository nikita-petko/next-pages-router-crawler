import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { getPlacePageLayout } from '@modules/creations/places';
import { PlaceVersionHistoryContainer } from '@modules/creations';
/*
 * NOTE(lucaswang 02-15-2023): Part of the task https://roblox.atlassian.net/browse/DSA-900
 * which introduces a new eslint rule to disallow importing private components from other modules.
 * Should refactor to export private component in the corresponding module's index.ts.
 */
// eslint-disable-next-line no-restricted-imports -- see above
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
  getPlacePageLayout(page, { title: 'Heading.VersionHistory' });

export default VersionHistory;
