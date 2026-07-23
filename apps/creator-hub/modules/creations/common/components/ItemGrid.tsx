import type { FunctionComponent, ReactElement, ReactNode } from 'react';
import React, { useCallback } from 'react';
import { Grid, Typography } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/components';
import type { ItemDetails } from '../interfaces/ItemDetails';
import useItemGridStyles from './Items.styles';

export interface ItemGridProps<T> {
  data: T[];
  getItemKey: (item: T) => number | string;
  GridItemComponent: FunctionComponent<React.PropsWithChildren<ItemDetails<T>>>;
  removeItemAtIndex: (index: number) => void;
  updateItemAtIndex: (index: number, item: T) => void;
  isLoading: boolean;
  emptyMessage: ReactNode;
  useWideIcons?: boolean;
  toggleEnableItem?: (item: T, enable: boolean) => void;
}

function ItemGrid<T>({
  data,
  getItemKey,
  GridItemComponent,
  removeItemAtIndex,
  updateItemAtIndex,
  isLoading,
  emptyMessage,
  useWideIcons,
  toggleEnableItem,
}: ItemGridProps<T>) {
  const {
    classes: { itemGrid, itemGridContent },
  } = useItemGridStyles({ useWideIcons: useWideIcons ?? false });
  const updateItem = useCallback(
    (index: number): ((item: T) => void) => {
      return (item: T) => {
        updateItemAtIndex(index, item);
      };
    },
    [updateItemAtIndex],
  );

  if (isLoading && data.length === 0) {
    return <PageLoading />;
  }

  if (data.length === 0) {
    if (typeof emptyMessage === 'string') {
      return (
        <Grid
          className={itemGridContent}
          item
          container
          justifyContent='center'
          alignItems='center'>
          <Typography color='secondary' align='center'>
            {emptyMessage}
          </Typography>
        </Grid>
      );
    }
    return emptyMessage as ReactElement;
  }

  return (
    <Grid container className={itemGrid}>
      {data.map((item, index) => (
        <GridItemComponent
          key={getItemKey(item)}
          item={item}
          removeItem={() => removeItemAtIndex(index)}
          updateItem={updateItem(index)}
          isLoading={isLoading}
          toggleEnableItem={(enable: boolean) => toggleEnableItem && toggleEnableItem(item, enable)}
        />
      ))}
    </Grid>
  );
}

export default ItemGrid;
