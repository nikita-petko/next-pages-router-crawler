import React, { FunctionComponent, useCallback, useContext, useEffect, useMemo } from 'react';
import {
  BadgeIconResponse,
  DeveloperProductIconResponse,
  extractStringValueFromError,
  gameInternationalizationClient,
  GamePassIconResponse,
} from '@modules/clients';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { useTranslation } from '@rbx/intl';
import useTranslationMap from '../hooks/useTranslationMap';
import ProductStatus from '../../translation/enums/TranslationStatus';
import ProductListSubItem from './ProductListSubItem';
import ImageStatus from '../enums/ImageStatus';
import ProductFieldType from '../enums/ProductFieldTypes';
import ProductType from '../enums/ProductTypes';
import { IconField, ImageTranslation } from '../types';
import selectedItemDetailContext from '../contexts/SelectedItemDetailContext';
import iconResponseToMap from '../utils/iconResponseToMap';

export interface ProductListItemIconProps {
  productId: number;
  productType: ProductType;
  isSelected: boolean;
  iconLoading: boolean;
  currentLanguageOrLocaleCode: string | null;
  onIconLoading: (loading: boolean) => void;
  onFetchTranslationError: (error: Error) => void;
  onTranslationStatusChange: (status: ProductStatus) => void;
  onSelect: () => void;
}

const ProductListItemIcon: FunctionComponent<React.PropsWithChildren<ProductListItemIconProps>> = (
  props,
) => {
  const {
    isSelected,
    iconLoading,
    productType,
    productId,
    currentLanguageOrLocaleCode,
    onIconLoading,
    onFetchTranslationError,
    onTranslationStatusChange,
    onSelect,
  } = props;
  const { error } = useMetricsMonitoring();
  const { translate } = useTranslation();
  const { setSelectedItem, addEventListener, removeEventListener } =
    useContext(selectedItemDetailContext);
  const { setTranslationMap, translationMap } = useTranslationMap<ImageTranslation>();

  const currentIconTranslationStatus = useMemo(() => {
    const status = (() => {
      const translation = currentLanguageOrLocaleCode
        ? translationMap.get(currentLanguageOrLocaleCode)
        : null;
      if (
        !translation ||
        !translation.imageUrl ||
        translation.imageStatus !== ImageStatus.Approved
      ) {
        return ProductStatus.Unfinished;
      }
      return ProductStatus.Done;
    })();
    onTranslationStatusChange(status);
    return status;
  }, [currentLanguageOrLocaleCode, translationMap, onTranslationStatusChange]);

  const getIconTranslation = useCallback(
    async (itemId: number, itemProductType: ProductType) => {
      onIconLoading(true);
      let response: GamePassIconResponse | BadgeIconResponse | DeveloperProductIconResponse | null =
        null;
      try {
        if (itemProductType === ProductType.Pass) {
          response = await gameInternationalizationClient.getGamePassIcon({
            gamePassId: itemId,
          });
        }
        if (itemProductType === ProductType.Badge) {
          response = await gameInternationalizationClient.getBadgeIcon({ badgeId: itemId });
        }
        if (itemProductType === ProductType.DeveloperProduct) {
          response = await gameInternationalizationClient.getDeveloperProductIcon({
            developerProductId: itemId,
          });
        }
        if (!response || !response.data) {
          error('ProductListItem: Icon response or data should not be null or undefined');
          return;
        }
      } catch (e) {
        if (e instanceof Error) {
          onFetchTranslationError(e);
          error(e.message);
        }
        onIconLoading(false);
        return;
      }
      try {
        setTranslationMap(iconResponseToMap(response));
      } catch (e) {
        error(extractStringValueFromError(e, 'message', ''));
      }
      onIconLoading(false);
    },
    [error, onFetchTranslationError, onIconLoading, setTranslationMap],
  );

  useEffect(() => {
    getIconTranslation(productId, productType);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: refactor to decouple call from useEffect
  }, [productId, productType]);
  useEffect(() => {
    const identifier = {
      productType,
      id: productId,
      fieldType: ProductFieldType.Icon,
    };

    if (currentLanguageOrLocaleCode) {
      addEventListener((event) => {
        if (
          event.productType !== productType ||
          event.productId !== productId ||
          event.fieldType !== ProductFieldType.Icon
        ) {
          return;
        }
        try {
          setTranslationMap(iconResponseToMap(event.response));
        } catch (e) {
          error(extractStringValueFromError(e, 'message', ''));
        }
      }, identifier);
    }
    return () => {
      removeEventListener(identifier);
    };
  }, [
    addEventListener,
    currentLanguageOrLocaleCode,
    error,
    productId,
    productType,
    removeEventListener,
    setTranslationMap,
  ]);
  useEffect(() => {
    if (isSelected && currentLanguageOrLocaleCode) {
      setSelectedItem({
        productId,
        productType,
        fieldType: ProductFieldType.Icon,
        currentTranslation:
          (currentLanguageOrLocaleCode && translationMap?.get(currentLanguageOrLocaleCode)) ?? null,
      } as IconField);
    }
  }, [
    currentLanguageOrLocaleCode,
    translationMap,
    isSelected,
    productId,
    productType,
    setSelectedItem,
    addEventListener,
    removeEventListener,
  ]);
  return (
    <ProductListSubItem
      isSelected={isSelected}
      status={currentIconTranslationStatus}
      title={translate('Label.Icon')}
      isLoading={iconLoading}
      onSelect={onSelect}
    />
  );
};

export default ProductListItemIcon;
