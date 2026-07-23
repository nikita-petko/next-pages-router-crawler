import type { ChangeEvent, FunctionComponent } from 'react';
import React, { Fragment, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, List, Select, MenuItem, Pagination } from '@rbx/ui';
import { filterProductListEventModel } from '@modules/eventStream/constants/eventConstants';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { PageLoading } from '@modules/miscellaneous/components';
import useShowToastMessage from '../../common/hooks/useShowToastMessage';
import ListStateMessage from '../../translation/components/ListStateMessage';
import { productListPageSize } from '../constants';
import useGameProductsTranslationManagementContainerStyles from '../container/GameProductsTranslationManagementContainer.styles';
import selectedItemDetailContext from '../contexts/SelectedItemDetailContext';
import ProductFieldType from '../enums/ProductFieldTypes';
import ProductType from '../enums/ProductTypes';
import useProductInformation from '../hooks/useProductInformation';
import type { ProductFieldIdentifier } from '../types';
import ProductListItem from './ProductListItem';

export interface ProductListProps {
  universeId: number | null;
  onFetchProductListError: (error: Error) => void;
}
const allProductTypes = [ProductType.Pass, ProductType.DeveloperProduct, ProductType.Badge];

const ProductList: FunctionComponent<React.PropsWithChildren<ProductListProps>> = ({
  universeId,
  onFetchProductListError,
}) => {
  const { trackerClient } = useEventTrackerProvider();
  const { showFailureToast } = useShowToastMessage();
  const { setSelectedItem } = useContext(selectedItemDetailContext);
  const { productList, fetchedProductListError, productListLoading } = useProductInformation();
  const [shouldShowErrorToastOnce, setShouldShowErrorToastOnce] = useState<boolean>(false);
  const { translate } = useTranslation();
  const [currentFilter, setCurrentFilter] = useState<ProductType[]>(allProductTypes);
  const [selectedProductIdentifier, setSelectedProductIdentifier] =
    useState<ProductFieldIdentifier | null>(null);
  const {
    classes: { list, topGrid, selectBar },
  } = useGameProductsTranslationManagementContainerStyles();
  const [currentPage, setCurrentPage] = useState(1);

  const filteredList = useMemo(() => {
    setCurrentPage(1);
    return productList.filter((product) => currentFilter.includes(product.productType));
  }, [productList, currentFilter]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredList.length / productListPageSize);
  }, [filteredList]);

  const handleChangePage = (e: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const currentList = useMemo(() => {
    // check list to see if the results are less than a full page
    // if so just return the entire list
    if (filteredList.length < productListPageSize) {
      return filteredList;
    }
    // else, slice the list into pages of 20 entries each
    return filteredList.slice(
      (currentPage - 1) * productListPageSize,
      currentPage * productListPageSize,
    );
  }, [currentPage, filteredList]);

  useEffect(() => {
    if (currentList.length === 0) {
      setSelectedProductIdentifier(null);
      setSelectedItem(null);
    } else if (!currentList.some((product) => product.id === selectedProductIdentifier?.id)) {
      const firstItem = currentList[0];
      setSelectedProductIdentifier({
        id: firstItem.id,
        productType: firstItem.productType,
        fieldType: ProductFieldType.Name,
      });
    }
  }, [currentList, selectedProductIdentifier, setSelectedItem]);

  useEffect(() => {
    if (fetchedProductListError) {
      onFetchProductListError(fetchedProductListError);
    }
    if (shouldShowErrorToastOnce) {
      showFailureToast(translate('Message.FailedToFetchProduct'));
    }
  }, [
    shouldShowErrorToastOnce,
    fetchedProductListError,
    onFetchProductListError,
    showFailureToast,
    translate,
  ]);

  return (
    <List className={list}>
      {productListLoading ? (
        <PageLoading />
      ) : (
        <>
          <Grid className={topGrid}>
            <Select
              className={selectBar}
              value={currentFilter === allProductTypes ? 'All' : currentFilter}
              onChange={(event: ChangeEvent<{ value: unknown }>) => {
                if ((event.target.value as string) === 'All') {
                  setCurrentFilter(allProductTypes);
                  trackerClient.sendEvent(filterProductListEventModel(universeId, 'All'));
                } else {
                  const selectedProductType = event.target.value as ProductType;
                  setCurrentFilter([selectedProductType]);
                  trackerClient.sendEvent(
                    filterProductListEventModel(universeId, selectedProductType),
                  );
                }
              }}>
              <MenuItem value='All'>{translate('Label.OptionShowAll')}</MenuItem>
              <MenuItem value={ProductType.Badge}>{translate('Label.OptionBadges')}</MenuItem>
              <MenuItem value={ProductType.Pass}>{translate('Label.OptionPasses')}</MenuItem>
              <MenuItem value={ProductType.DeveloperProduct}>
                {translate('Label.OptionDeveloperProducts')}
              </MenuItem>
            </Select>
          </Grid>
          {currentList.map((product) => (
            <ProductListItem
              key={`${product.productType}-${product.id}`}
              shouldShow={currentFilter.includes(product.productType)}
              onShouldShowErrorToast={setShouldShowErrorToastOnce}
              productId={product.id}
              productType={product.productType}
              title={product.title}
              selectedField={
                selectedProductIdentifier &&
                selectedProductIdentifier.productType === product.productType &&
                selectedProductIdentifier.id === product.id
                  ? selectedProductIdentifier.fieldType
                  : null
              }
              onSelect={(selectedField) => {
                setSelectedProductIdentifier({
                  id: product.id,
                  productType: product.productType,
                  fieldType: selectedField,
                });
              }}
            />
          ))}
          {currentList.length > 0 && (
            <Grid container justifyContent='center' alignItems='center'>
              <Pagination
                color='primary'
                count={totalPages}
                onChange={handleChangePage}
                page={currentPage}
              />
            </Grid>
          )}
          {!productListLoading && currentList.length === 0 && (
            <ListStateMessage title={translate('Label.NoContent')}>
              {translate('Message.NoProductsFound')}
            </ListStateMessage>
          )}
        </>
      )}
    </List>
  );
};

export default ProductList;
