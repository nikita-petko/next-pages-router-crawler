import GameProvider from '@modules/providers/game/GameProvider';
import AssociatedItemsContainer from './AssociatedItemsContainer';

const AssociatedItemsMetadataContainer = () => (
  <GameProvider>
    <AssociatedItemsContainer />
  </GameProvider>
);

export default AssociatedItemsMetadataContainer;
