import React, { FunctionComponent } from 'react';
import { Typography, Skeleton } from '@rbx/ui';

export interface ItemCardItemIdProps {
  id: number;
  isLoading: boolean;
}

const ItemCardItemId: FunctionComponent<React.PropsWithChildren<ItemCardItemIdProps>> = ({
  id,
  isLoading,
}) => {
  return (
    <Typography color='secondary' noWrap>
      {isLoading ? <Skeleton /> : id}
    </Typography>
  );
};

export default ItemCardItemId;
