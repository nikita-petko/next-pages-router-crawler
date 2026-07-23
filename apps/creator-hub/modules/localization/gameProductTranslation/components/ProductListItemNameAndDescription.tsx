import type { FunctionComponent } from 'react';
import React, { Fragment, useCallback, useContext, useEffect, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import type { ProductNameAndDescriptionResponse } from '@modules/clients/gameInternationalization';
import gameInternationalizationClient from '@modules/clients/gameInternationalization';
import { extractStringValueFromError } from '@modules/clients/utils/errorHelpers';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import ProductStatus from '../../translation/enums/TranslationStatus';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import selectedItemDetailContext from '../contexts/SelectedItemDetailContext';
import ProductFieldType from '../enums/ProductFieldTypes';
import ProductType from '../enums/ProductTypes';
import useTranslationMap from '../hooks/useTranslationMap';
import type { DescriptionField, NameField, ProductFieldTypeText, TextTranslation } from '../types';
import ProductListSubItem from './ProductListSubItem';

export interface ProductListItemNameAndDescriptionProps {
  productId: number;
  productType: ProductType;
  selectedField: ProductFieldType | null;
  currentLanguageOrLocaleCode: string | null;
  nameLoading: boolean;
  onNameLoading: (loading: boolean) => void;
  descriptionLoading: boolean;
  onDescriptionLoading: (loading: boolean) => void;
  onFetchTranslationError: (error: Error) => void;
  onSelect: (field: ProductFieldType.Name | ProductFieldType.Description) => void;
  onNameTranslationStatusChange: (status: ProductStatus) => void;
  onDescriptionTranslationStatusChange: (status: ProductStatus) => void;
}

export type NameAndDescriptionState = {
  nameTranslations: Map<string, TextTranslation>;
  descriptionTranslations: Map<string, TextTranslation>;
};

const ProductListItemNameAndDescription: FunctionComponent<
  React.PropsWithChildren<ProductListItemNameAndDescriptionProps>
> = (props) => {
  const {
    productId,
    productType,
    selectedField,
    currentLanguageOrLocaleCode,
    nameLoading,
    onNameLoading,
    descriptionLoading,
    onDescriptionLoading,
    onFetchTranslationError,
    onSelect,
    onNameTranslationStatusChange,
    onDescriptionTranslationStatusChange,
  } = props;
  const { error } = useMetricsMonitoring();
  const { sourceLanguageCode, activeTranslationTarget } = useEntryManagementMetadata();
  const nameTranslationManager = useTranslationMap<TextTranslation>();
  const descriptionTranslationManager = useTranslationMap<TextTranslation>();
  const { setSelectedItem, addEventListener, removeEventListener } =
    useContext(selectedItemDetailContext);
  const { translate } = useTranslation();

  const currentNameTranslationStatus = useMemo(() => {
    const status = (() => {
      const translation = currentLanguageOrLocaleCode
        ? nameTranslationManager.translationMap.get(currentLanguageOrLocaleCode)
        : null;
      if (!translation || !translation.text) {
        return ProductStatus.Unfinished;
      }
      return ProductStatus.Done;
    })();
    onNameTranslationStatusChange(status);
    return status;
  }, [currentLanguageOrLocaleCode, nameTranslationManager, onNameTranslationStatusChange]);

  const currentDescriptionTranslationStatus = useMemo(() => {
    const status = (() => {
      const translation = currentLanguageOrLocaleCode
        ? descriptionTranslationManager.translationMap.get(currentLanguageOrLocaleCode)
        : null;
      if (!translation || !translation.text) {
        return ProductStatus.Unfinished;
      }
      return ProductStatus.Done;
    })();
    onDescriptionTranslationStatusChange(status);
    return status;
  }, [
    currentLanguageOrLocaleCode,
    descriptionTranslationManager,
    onDescriptionTranslationStatusChange,
  ]);

  const getProductNameAndDescriptionTranslation = useCallback(
    async (itemId: number, itemProductType: ProductType) => {
      onNameLoading(true);
      onDescriptionLoading(true);
      let response: ProductNameAndDescriptionResponse | null = null;
      try {
        if (itemProductType === ProductType.Pass) {
          response = await gameInternationalizationClient.getGamePassNameAndDescription({
            gamePassId: itemId,
          });
        }
        if (itemProductType === ProductType.Badge) {
          response = await gameInternationalizationClient.getBadgeNameAndDescription({
            badgeId: itemId,
          });
        }
        if (itemProductType === ProductType.DeveloperProduct) {
          response = await gameInternationalizationClient.getDeveloperProductNameAndDescription({
            developerProductId: itemId,
          });
        }
        if (!response) {
          error('ProductListItem: Name and description response should not be null');
          return;
        }
      } catch (e) {
        if (e instanceof Error) {
          onFetchTranslationError(e);
        }
        onNameLoading(false);
        onDescriptionLoading(false);
        error(extractStringValueFromError(e, 'message', ''));
        return;
      }
      const nameTranslationMap = new Map<string, TextTranslation>();
      const descriptionTranslationMap = new Map<string, TextTranslation>();
      response.data.forEach((item) => {
        nameTranslationMap.set(item.languageCode, {
          text: item.name,
          languageCode: item.languageCode,
        });
        descriptionTranslationMap.set(item.languageCode, {
          text: item.description,
          languageCode: item.languageCode,
        });
      });
      nameTranslationManager.setTranslationMap(nameTranslationMap);
      descriptionTranslationManager.setTranslationMap(descriptionTranslationMap);
      onNameLoading(false);
      onDescriptionLoading(false);
    },
    [
      descriptionTranslationManager,
      error,
      nameTranslationManager,
      onDescriptionLoading,
      onFetchTranslationError,
      onNameLoading,
    ],
  );

  const setEventListener = useCallback(
    (fieldType: ProductFieldTypeText) => {
      const identifier = {
        productType,
        id: productId,
        fieldType,
      };

      if (currentLanguageOrLocaleCode) {
        addEventListener((event) => {
          if (event.productType !== productType || event.productId !== productId) {
            return;
          }
          if (event.fieldType === ProductFieldType.Name) {
            nameTranslationManager.setTranslation(
              event.languageCode,
              event.text
                ? {
                    languageCode: event.languageCode,
                    text: event.text,
                  }
                : null,
            );
          } else if (event.fieldType === ProductFieldType.Description) {
            descriptionTranslationManager.setTranslation(
              event.languageCode,
              event.text
                ? {
                    languageCode: event.languageCode,
                    text: event.text,
                  }
                : null,
            );
          }
        }, identifier);
      }
      return () => {
        removeEventListener(identifier);
      };
    },
    [
      addEventListener,
      currentLanguageOrLocaleCode,
      descriptionTranslationManager,
      nameTranslationManager,
      productId,
      productType,
      removeEventListener,
    ],
  );

  useEffect(() => {
    getProductNameAndDescriptionTranslation(productId, productType);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: decouple call from useEffect hook
  }, [productId, productType]);

  useEffect(() => {
    if (selectedField === null || !currentLanguageOrLocaleCode || !activeTranslationTarget) {
      return;
    }
    let globalTranslation: TextTranslation | null = null;
    let currentTranslation: TextTranslation | null = null;
    let sourceText: string | null = null;
    if (selectedField === ProductFieldType.Name) {
      sourceText = nameTranslationManager.translationMap.get(sourceLanguageCode)?.text ?? null;
      globalTranslation =
        nameTranslationManager.translationMap.get(activeTranslationTarget.languageCode) ?? null;
      currentTranslation =
        nameTranslationManager.translationMap.get(activeTranslationTarget.translationKey) ?? null;
    } else if (selectedField === ProductFieldType.Description) {
      sourceText =
        descriptionTranslationManager.translationMap.get(sourceLanguageCode)?.text ?? null;
      globalTranslation =
        descriptionTranslationManager.translationMap.get(activeTranslationTarget.languageCode) ??
        null;
      currentTranslation =
        descriptionTranslationManager.translationMap.get(activeTranslationTarget.translationKey) ??
        null;
    } else {
      return;
    }
    setSelectedItem({
      productId,
      productType,
      fieldType: selectedField,
      sourceText,
      globalTranslation,
      currentTranslation,
    } as NameField | DescriptionField);
  }, [
    activeTranslationTarget,
    currentLanguageOrLocaleCode,
    descriptionTranslationManager.translationMap,
    nameTranslationManager.translationMap,
    productId,
    productType,
    selectedField,
    setSelectedItem,
    sourceLanguageCode,
  ]);

  useEffect(() => {
    const nameDeferFunc = setEventListener(ProductFieldType.Name);
    const descriptionDeferFunc = setEventListener(ProductFieldType.Description);
    return () => {
      nameDeferFunc();
      descriptionDeferFunc();
    };
  }, [setEventListener]);

  return (
    <>
      <ProductListSubItem
        isSelected={selectedField === ProductFieldType.Name || false}
        status={currentNameTranslationStatus}
        title={translate('Label.Name')}
        isLoading={nameLoading}
        onSelect={() => onSelect(ProductFieldType.Name)}
      />
      <ProductListSubItem
        isSelected={selectedField === ProductFieldType.Description || false}
        status={currentDescriptionTranslationStatus}
        title={translate('Label.Description')}
        isLoading={descriptionLoading}
        onSelect={() => onSelect(ProductFieldType.Description)}
      />
    </>
  );
};

export default ProductListItemNameAndDescription;
