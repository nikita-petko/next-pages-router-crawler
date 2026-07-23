import React, { FunctionComponent } from 'react';
import { Typography, Skeleton } from '@rbx/ui';
import { getFormattedDate } from '@rbx/core';
import { useTranslation } from '@rbx/intl';

export interface ItemCardCreatedDateProps {
  date: Date;
  isLoading: boolean;
}

const ItemCardCreatedDate: FunctionComponent<React.PropsWithChildren<ItemCardCreatedDateProps>> = ({
  date,
  isLoading,
}) => {
  const { translate } = useTranslation();
  return (
    <Typography variant='body2' color='secondary' noWrap>
      {isLoading ? <Skeleton /> : `${translate('Label.Created')} ${getFormattedDate(date)}`}
    </Typography>
  );
};

export default ItemCardCreatedDate;
