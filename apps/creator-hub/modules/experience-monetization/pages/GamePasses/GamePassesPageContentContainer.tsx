import ItemAnalyticsPageContext from '../../context/ItemAnalyticsPageContext';
import GamePassesPageContent from './GamePassesPageContent';

const GamePassesPageContentContainer = ({ universeId }: { universeId: number }) => {
  return (
    <ItemAnalyticsPageContext>
      <GamePassesPageContent universeId={universeId} />
    </ItemAnalyticsPageContext>
  );
};

export default GamePassesPageContentContainer;
