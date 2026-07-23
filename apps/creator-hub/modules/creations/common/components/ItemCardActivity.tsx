import React, { FunctionComponent } from 'react';
import { Typography, Skeleton } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useItemCardActivityStyles from './ItemCardActivity.styles';

export interface ItemCardActivityProps {
  isActive: boolean;
  isLoading: boolean;
}

const ItemCardActivity: FunctionComponent<React.PropsWithChildren<ItemCardActivityProps>> = ({
  isActive,
  isLoading,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { typography },
  } = useItemCardActivityStyles();

  return (
    // TODO(@yhe-cn, 2022-06-08): JIRA-1069 once design system updated, update color primary to success color
    <Typography
      variant='body2'
      color={isActive ? 'primary' : 'secondary'}
      className={isActive ? typography : ''}>
      {isLoading ? (
        <Skeleton width='50%' />
      ) : (
        translate(isActive ? 'Label.Active' : 'Label.Inactive')
      )}
    </Typography>
  );
};

export default ItemCardActivity;
