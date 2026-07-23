import type { FunctionComponent, ReactNode } from 'react';
import React from 'react';
import { Grid, Typography } from '@rbx/ui';
import {
  type EmptyStateIllustrationKey,
  EmptyStateIllustration,
} from '@modules/miscellaneous/components/EmptyState/EmptyState';
import useItemGridEmptyViewStyles from './ItemGridEmptyView.styles';

export interface ItemGridEmptyViewProp {
  emptyMessage: ReactNode;
  createItemButton?: ReactNode;
  itemDescription?: ReactNode;
  emptyHeader?: ReactNode;
  illustration?: EmptyStateIllustrationKey;
}

const ItemGridEmptyView: FunctionComponent<React.PropsWithChildren<ItemGridEmptyViewProp>> = ({
  emptyHeader,
  emptyMessage,
  createItemButton,
  itemDescription,
  illustration,
}) => {
  const {
    classes: {
      emptyStateGridContainer,
      emptyStateTextContainer,
      emptyStateText,
      emptyStateCreateItemButtonContainer,
    },
  } = useItemGridEmptyViewStyles();

  return (
    <Grid container alignItems='center' justifyContent='center' className={emptyStateGridContainer}>
      <Grid
        item
        container
        direction='column'
        alignItems='center'
        justifyContent='center'
        className={emptyStateTextContainer}>
        <EmptyStateIllustration illustration={illustration} />
        <Grid item className={emptyStateText}>
          {emptyHeader}
          <Typography variant='body1' color='secondary'>
            {emptyMessage}
          </Typography>
          {itemDescription && (
            <Typography variant='body1' color='secondary'>
              <br />
              <br />
              {itemDescription}
            </Typography>
          )}
        </Grid>

        <Grid item className={emptyStateCreateItemButtonContainer}>
          {createItemButton}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ItemGridEmptyView;
