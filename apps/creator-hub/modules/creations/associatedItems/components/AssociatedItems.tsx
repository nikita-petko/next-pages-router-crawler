import { Item } from '@modules/miscellaneous/common';
import { Grid } from '@rbx/ui';
import AssociatedItemsGridContainer from '../containers/AssociatedItemsGridContainer';
import { RedirectedAssociatedItem } from '../constants';

export interface AssociatedItemsProps {
  universeId: number;
  activeItemType: Exclude<Item, RedirectedAssociatedItem>;
}

/**
 * This component is responsible for rendering the associated-items page.
 * It is deprecated and will be removed in the future.
 */
const AssociatedItems = ({ universeId, activeItemType }: AssociatedItemsProps) => {
  return (
    <Grid container justifyContent='space-between'>
      <AssociatedItemsGridContainer universeId={universeId} itemType={activeItemType} />
    </Grid>
  );
};

export default AssociatedItems;
