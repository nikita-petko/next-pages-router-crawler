import React, { FunctionComponent } from 'react';
import { IconButton, ListItemText, ListItemSecondaryAction, ListItemButton } from '@rbx/ui';
import ProductStatus from '../../translation/enums/TranslationStatus';
import useProductListItemStyles from './ProductListItem.styles';
import ProductStatusIcon from './ProductStatusIcon';

export interface ProductListSubItemProps {
  isSelected: boolean;
  isLoading: boolean;
  status: ProductStatus | null;
  title: string;
  onSelect: () => void;
}

const ProductListSubItem: FunctionComponent<React.PropsWithChildren<ProductListSubItemProps>> = (
  props,
) => {
  const { isSelected, isLoading, status, onSelect, title } = props;
  const {
    classes: { buttonListSubItem },
  } = useProductListItemStyles();
  return (
    <ListItemButton className={buttonListSubItem} selected={isSelected} onClick={onSelect}>
      <ListItemText>{title}</ListItemText>
      <ListItemSecondaryAction>
        <IconButton aria-label='status icon' edge='end' disabled size='large'>
          <ProductStatusIcon isLoading={isLoading} status={status} />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItemButton>
  );
};

export default ProductListSubItem;
