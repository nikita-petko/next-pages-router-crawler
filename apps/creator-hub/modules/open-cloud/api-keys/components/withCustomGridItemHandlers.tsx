import { useTranslation } from '@rbx/intl';
import { Button, Grid, Typography, Paper } from '@rbx/ui';
import type ItemDetails from '../../common/interfaces/ItemDetails';
import type TargetPartMetadata from '../interfaces/TargetPartMetadata';
import useCustomTargetPartGridItemStyles from './withCustomGridItemHandlers.styles';

interface CustomTargetPartGridItemProps extends ItemDetails<TargetPartMetadata> {
  onSelectItem?: (item: TargetPartMetadata) => void;
  isItemDisabled?: (item: TargetPartMetadata) => void;
}

// create a customized component with specific function handlers needed for the datastores grid
export const CustomTargetPartGridItem = ({
  item,
  onSelectItem,
  isItemDisabled,
}: CustomTargetPartGridItemProps) => {
  const {
    classes: { gridItem, targetValueLabel },
  } = useCustomTargetPartGridItemStyles();
  const { translate } = useTranslation();

  return (
    <Paper className={gridItem}>
      <Grid container justifyContent='space-between' alignItems='center'>
        <Grid item XSmall={6}>
          <Typography className={targetValueLabel} variant='body1'>
            {item.name}
          </Typography>
        </Grid>
        <Grid item>
          <Button
            variant='outlined'
            size='small'
            color='primary'
            disabled={isItemDisabled?.(item) ?? false}
            onClick={() => onSelectItem?.(item)}>
            <Typography variant='body1'>{translate('Action.AddDatastore')}</Typography>
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

// HOC to bind custom parameters to CustomTargetPartGridItem and return a component that takes ItemDetails props
const withCustomGridItemHandlers = (
  onSelectItem?: (item: TargetPartMetadata) => void,
  isItemDisabled?: (item: TargetPartMetadata) => void,
) => {
  const withGridItemHandlersComponent = (
    props: React.PropsWithChildren<ItemDetails<TargetPartMetadata>>,
  ) => {
    return (
      <CustomTargetPartGridItem
        onSelectItem={onSelectItem}
        isItemDisabled={isItemDisabled}
        {...props}
      />
    );
  };

  return withGridItemHandlersComponent;
};

export default withCustomGridItemHandlers;
