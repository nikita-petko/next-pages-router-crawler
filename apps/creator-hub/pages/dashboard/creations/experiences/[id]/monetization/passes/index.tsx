import type { NextLayoutPage } from 'next';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import GamePassesPageContentContainer from '@modules/experience-monetization/pages/GamePasses/GamePassesPageContentContainer';
import GamePassesPageTitle from '@modules/experience-monetization/pages/GamePasses/GamePassesPageTitle';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';

const GamePassesPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  if (!universeId) {
    return null;
  }

  return <GamePassesPageContentContainer universeId={universeId} />;
};

GamePassesPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    noNavigationItem: true,
    context: { title: <GamePassesPageTitle /> },
  });
GamePassesPage.loggerConfig = { rosId: RosTeams.MonetizationProducts };

export default GamePassesPage;
