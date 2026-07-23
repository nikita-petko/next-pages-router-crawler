import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography, Skeleton } from '@rbx/ui';

export interface ItemCardActiveSubscribersProps {
  subscribers: number;
  isLoading: boolean;
}

const ItemCardActiveSubscribers: FunctionComponent<
  React.PropsWithChildren<ItemCardActiveSubscribersProps>
> = ({ subscribers, isLoading }) => {
  const { translate } = useTranslation();

  return (
    <Typography color='primary' noWrap variant='body2'>
      {isLoading ? (
        <Skeleton />
      ) : (
        `${translate('Label.Subscribers')}: ${subscribers.toLocaleString()}`
      )}
    </Typography>
  );
};

export default ItemCardActiveSubscribers;
