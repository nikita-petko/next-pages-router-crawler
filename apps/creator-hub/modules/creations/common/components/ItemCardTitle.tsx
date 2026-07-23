import React, { Fragment, FunctionComponent } from 'react';
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
        <Fragment>
          <Skeleton />
          <Skeleton width='66%' />
        </Fragment>
      ) : (
        name
      )}
    </Typography>
  );
};

export default ItemCardTitle;
