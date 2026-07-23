import { FunctionComponent } from 'react';
import GameProvider from '@modules/providers/game/GameProvider';
import SingleAssociatedItemTypeContent, {
  SingleAssociatedItemTypeContentSpec,
} from './SingleAssociatedItemTypeContent';

const AssociatedItemsTabContentContainer: FunctionComponent<
  React.PropsWithChildren<SingleAssociatedItemTypeContentSpec>
> = (spec: React.PropsWithChildren<SingleAssociatedItemTypeContentSpec>) => (
  <GameProvider>
    <SingleAssociatedItemTypeContent {...spec} />
  </GameProvider>
);

export default AssociatedItemsTabContentContainer;
