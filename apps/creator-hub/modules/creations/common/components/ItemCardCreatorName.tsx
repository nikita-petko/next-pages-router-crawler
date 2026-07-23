import type { FunctionComponent } from 'react';
import React from 'react';
import { Typography, Skeleton } from '@rbx/ui';

export interface ItemCardCreatorNameProps {
  creatorName: string;
  isLoading: boolean;
}

const ItemCardCreatorName: FunctionComponent<React.PropsWithChildren<ItemCardCreatorNameProps>> = ({
  creatorName,
  isLoading,
}) => {
  return (
    <Typography variant='body2' color='secondary' noWrap>
      {isLoading ? <Skeleton /> : creatorName}
    </Typography>
  );
};

export default ItemCardCreatorName;
