import type { NextLayoutPage } from 'next';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import GamePassesPageTitle from '@modules/experience-monetization/pages/GamePasses/GamePassesPageTitle';
import GamePassesPageContentContainer from '@modules/experience-monetization/pages/GamePasses/GamePassesPageContentContainer';

const GamePassesPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  if (!universeId) return null;

  return <GamePassesPageContentContainer universeId={universeId} />;
};

GamePassesPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    noNavigationItem: true,
    context: { title: <GamePassesPageTitle /> },
  });

export default GamePassesPage;
