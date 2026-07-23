import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ListItemButton,
  Collapse,
  IconButton,
  ListItemSecondaryAction,
  ListItemText,
} from '@rbx/ui';
import ProductStatus from '../../translation/enums/TranslationStatus';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import ProductFieldType from '../enums/ProductFieldTypes';
import type ProductType from '../enums/ProductTypes';
import useProductListItemStyles from './ProductListItem.styles';
import ProductListItemIcon from './ProductListItemIcon';
import ProductListItemNameAndDescription from './ProductListItemNameAndDescription';
import ProductStatusIcon from './ProductStatusIcon';

export interface ProductListItemProps {
  shouldShow: boolean;
  productId: number;
  productType: ProductType;
  title: string;
  selectedField: ProductFieldType | null;
  onSelect: (selectedField: ProductFieldType) => void;
  onShouldShowErrorToast: (shouldShowToast: boolean) => void;
}

const ProductListItem: FunctionComponent<React.PropsWithChildren<ProductListItemProps>> = ({
  shouldShow,
  productId,
  productType,
  title,
  selectedField,
  onSelect,
  onShouldShowErrorToast,
}) => {
  const {
    classes: { buttonListItem, displayNone },

    cx,
  } = useProductListItemStyles();
  const { currentLanguageOrLocaleCode } = useEntryManagementMetadata();
  const [fetchTranslationError, setFetchTranslationError] = useState<Error | null>(null);
  const [iconLoading, setIconLoading] = useState<boolean>(false);
  const [nameLoading, setNameLoading] = useState<boolean>(false);
  const [descriptionLoading, setDescriptionLoading] = useState<boolean>(false);
  const [iconStatus, setIconStatus] = useState<ProductStatus>(ProductStatus.Unfinished);
  const [nameStatus, setNameStatus] = useState<ProductStatus>(ProductStatus.Unfinished);
  const [descriptionStatus, setDescriptionStatus] = useState<ProductStatus>(
    ProductStatus.Unfinished,
  );

  const [isCollapseOpen, setIsCollapseOpen] = useState<boolean>(true);

  const currentItemStatus = useMemo(() => {
    return [iconStatus, nameStatus, descriptionStatus].includes(ProductStatus.Unfinished)
      ? ProductStatus.Unfinished
      : ProductStatus.Done;
  }, [iconStatus, nameStatus, descriptionStatus]);

  const handleClickMainItem = useCallback(() => {
    if (selectedField === null) {
      onSelect(ProductFieldType.Name);
      setIsCollapseOpen(true);
    } else {
      setIsCollapseOpen((prev) => !prev);
    }
  }, [onSelect, selectedField]);

  if (fetchTranslationError) {
    onShouldShowErrorToast(true);
  }

  return (
    <div className={cx({ [displayNone]: !shouldShow })}>
      <ListItemButton className={buttonListItem} onClick={handleClickMainItem}>
        <ListItemText>{title}</ListItemText>
        <ListItemSecondaryAction>
          <IconButton aria-label='product-status-icon' edge='end' disabled size='large'>
            <ProductStatusIcon
              isLoading={iconLoading || descriptionLoading || nameLoading}
              status={currentItemStatus}
            />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItemButton>
      <Collapse in={isCollapseOpen && selectedField !== null}>
        <ProductListItemNameAndDescription
          productId={productId}
          productType={productType}
          nameLoading={nameLoading}
          onNameLoading={setNameLoading}
          descriptionLoading={descriptionLoading}
          onDescriptionLoading={setDescriptionLoading}
          selectedField={selectedField}
          currentLanguageOrLocaleCode={currentLanguageOrLocaleCode}
          onSelect={onSelect}
          onFetchTranslationError={setFetchTranslationError}
          onNameTranslationStatusChange={setNameStatus}
          onDescriptionTranslationStatusChange={setDescriptionStatus}
        />
        <ProductListItemIcon
          productId={productId}
          productType={productType}
          onTranslationStatusChange={setIconStatus}
          onFetchTranslationError={setFetchTranslationError}
          onSelect={() => onSelect(ProductFieldType.Icon)}
          isSelected={selectedField === ProductFieldType.Icon}
          currentLanguageOrLocaleCode={currentLanguageOrLocaleCode}
          iconLoading={iconLoading}
          onIconLoading={setIconLoading}
        />
      </Collapse>
    </div>
  );
};

export default ProductListItem;
