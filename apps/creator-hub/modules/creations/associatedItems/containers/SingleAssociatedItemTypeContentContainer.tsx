import type { FunctionComponent } from 'react';
import GameProvider from '@modules/providers/game/GameProvider';
import type { SingleAssociatedItemTypeContentSpec } from './SingleAssociatedItemTypeContent';
import SingleAssociatedItemTypeContent from './SingleAssociatedItemTypeContent';

const AssociatedItemsTabContentContainer: FunctionComponent<
  React.PropsWithChildren<SingleAssociatedItemTypeContentSpec>
> = (spec: React.PropsWithChildren<SingleAssociatedItemTypeContentSpec>) => (
  <GameProvider>
    <SingleAssociatedItemTypeContent {...spec} />
  </GameProvider>
);

export default AssociatedItemsTabContentContainer;
