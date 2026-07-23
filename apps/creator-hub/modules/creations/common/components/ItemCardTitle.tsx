import type { FunctionComponent } from 'react';
import React, { Fragment } from 'react';
import { Typography, Skeleton } from '@rbx/ui';

export interface ItemCardTitleProps {
  name: string;
  isLoading: boolean;
}

const ItemCardTitle: FunctionComponent<React.PropsWithChildren<ItemCardTitleProps>> = ({
  name,
  isLoading,
}) => {
  return (
    <Typography variant='subtitle2'>
      {isLoading ? (
        <>
          <Skeleton />
          <Skeleton width='66%' />
        </>
      ) : (
        name
      )}
    </Typography>
  );
};

export default ItemCardTitle;
