import { Grid, CircularProgress, Typography, Button, AutorenewIcon } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/components';
import type ItemDetails from '../interfaces/ItemDetails';
import type ItemGridCSSProperties from '../interfaces/ItemGridCSSProperties';
import useItemGridStyles from './ItemGrid.styles';

interface ItemGridProps<T> {
  data: T[];
  getItemKey: (item: T) => number | string;
  GridItemComponent: React.FunctionComponent<React.PropsWithChildren<ItemDetails<T>>>;
  removeItemAtIndex: (index: number) => void;
  isLoading: boolean;
  hasError: boolean;
  emptyMessage: string; // no items returned from API OR error message
  retryBtnMessage: string; // button text for retrying current page in the case of an API error
  reloadCurrentPage: () => void; // in case of an error, reload current page
  itemGridCSSProperties: ItemGridCSSProperties;
}

function ItemGrid<T>({
  data,
  getItemKey,
  GridItemComponent,
  removeItemAtIndex,
  isLoading,
  emptyMessage,
  retryBtnMessage,
  hasError,
  reloadCurrentPage,
  itemGridCSSProperties,
}: ItemGridProps<T>) {
  const {
    classes: { itemGrid, errorBtn, retryMessage },
  } = useItemGridStyles(itemGridCSSProperties)();

  if (isLoading && data.length === 0) {
    return (
      <EmptyGrid>
        <CircularProgress size={20} />
      </EmptyGrid>
    );
  }

  if (data.length === 0 && !hasError) {
    return (
      <EmptyGrid>
        <Typography color='secondary' align='center'>
          {emptyMessage}
        </Typography>
      </EmptyGrid>
    );
  }

  if (data.length === 0 && hasError) {
    return (
      <EmptyGrid>
        <Grid container direction='column' alignItems='center'>
          <Typography>{emptyMessage}</Typography>
          <Button
            className={errorBtn}
            onClick={reloadCurrentPage}
            variant='outlined'
            color='primary'>
            <span className={retryMessage}>{retryBtnMessage}</span>
            <AutorenewIcon />
          </Button>
        </Grid>
      </EmptyGrid>
    );
  }

  return (
    <Grid container className={itemGrid}>
      {data.map((item, index) => (
        <GridItemComponent
          key={getItemKey(item)}
          index={index}
          item={item}
          removeItem={() => removeItemAtIndex(index)}
          isLoading={isLoading}
        />
      ))}
    </Grid>
  );
}

export default ItemGrid;
