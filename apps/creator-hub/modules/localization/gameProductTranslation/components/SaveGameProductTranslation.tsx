import type { FunctionComponent } from 'react';
import React, { Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Divider } from '@rbx/ui';
import type {
  UpdateBadgeDescriptionTranslationResponse,
  UpdateBadgeNameTranslationResponse,
  UpdateDeveloperProductDescriptionTranslationResponse,
  UpdateDeveloperProductNameTranslationResponse,
  UpdateGamePassDescriptionTranslationResponse,
  UpdateGamePassNameTranslationResponse,
} from '@modules/clients/gameInternationalization';
import gameInternationalizationClient from '@modules/clients/gameInternationalization';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import { updateGameProductTranslationEventModel } from '@modules/eventStream/constants/eventConstants';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import {
  failedToSaveTranslationMessage,
  textFilterErrorCode,
  textFilterErrorMessage,
} from '../../common/constants';
import useShowToastMessage from '../../common/hooks/useShowToastMessage';
import { getProductTranslationType } from '../../common/utils/translationTypeUtils';
import TranslationHistory from '../../gameStringTranslation/components/TranslationHistory';
import useTranslationHistory from '../../gameStringTranslation/hooks/useTranslationHistory';
import TranslationDetails from '../../translation/components/TranslationDetails';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import { descriptionFieldMaxCharacters, nameFieldMaxCharacters } from '../constants';
import selectedItemDetailContext from '../contexts/SelectedItemDetailContext';
import ProductFieldType from '../enums/ProductFieldTypes';
import ProductType from '../enums/ProductTypes';
import type { GameProductTranslationInfo } from '../types';

const SaveGameProductTranslation: FunctionComponent<React.PropsWithChildren> = () => {
  const { trackerClient } = useEventTrackerProvider();
  const { currentLanguageOrLocaleCode, sourceLanguageCode } = useEntryManagementMetadata();
  const { translate } = useTranslation();
  const { showSuccessToast, showFailureToast } = useShowToastMessage();
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { itemDetail, dispatchEvent } = useContext(selectedItemDetailContext);
  const {
    gameContentTranslationHistory,
    gameContentTranslationHistoryFetchingError,
    isGameContentTranslationHistoryLoading,
    getGameContentTranslationHistory,
  } = useTranslationHistory();

  const entryInfo = useMemo(() => {
    if (
      itemDetail &&
      (itemDetail.fieldType === ProductFieldType.Name ||
        itemDetail.fieldType === ProductFieldType.Description)
    ) {
      return {
        ...itemDetail,
        globalTranslation: itemDetail.globalTranslation?.text ?? null,
        currentTranslation: itemDetail.currentTranslation?.text ?? null,
      } as GameProductTranslationInfo;
    }
    return null;
  }, [itemDetail]);

  const getTranslationHistory = useCallback(
    (translationInfo: GameProductTranslationInfo) => {
      const translationProductType = getProductTranslationType(translationInfo);
      getGameContentTranslationHistory(
        translationProductType,
        translationInfo.productId,
        currentLanguageOrLocaleCode ?? 'en',
      );
    },
    [getGameContentTranslationHistory, currentLanguageOrLocaleCode],
  );

  useEffect(() => {
    let isMounted = true;
    if (entryInfo && currentLanguageOrLocaleCode && isMounted) {
      getTranslationHistory(entryInfo);
    }
    return () => {
      isMounted = false;
    };
  }, [entryInfo, currentLanguageOrLocaleCode, getTranslationHistory]);

  const identifier = useMemo(() => {
    return `${entryInfo?.productId}-${entryInfo?.fieldType}-${currentLanguageOrLocaleCode}`;
  }, [entryInfo, currentLanguageOrLocaleCode]);

  const handleSaveGameProductTranslation = useCallback(
    async (currentTranslation: string | null) => {
      const translationToSave = currentTranslation?.trim();
      if (entryInfo?.fieldType === ProductFieldType.Name) {
        trackerClient.sendEvent(
          updateGameProductTranslationEventModel(
            entryInfo.productType,
            entryInfo.productId,
            ProductFieldType.Name,
            translationToSave ?? '',
            currentLanguageOrLocaleCode ?? '',
          ),
        );
      }
      trackerClient.sendEvent(
        updateGameProductTranslationEventModel(
          entryInfo?.productType ?? '',
          entryInfo?.productId ?? '',
          ProductFieldType.Description,
          translationToSave ?? '',
          currentLanguageOrLocaleCode ?? '',
        ),
      );
      try {
        if (!entryInfo) {
          throw new Error('Entry info is null');
        }
        if (!currentLanguageOrLocaleCode) {
          throw new Error('Current language code is undefined');
        }
        setIsSaving(true);
        let nameResponse:
          | UpdateGamePassNameTranslationResponse
          | UpdateBadgeNameTranslationResponse
          | UpdateDeveloperProductNameTranslationResponse
          | null = null;
        let descriptionResponse:
          | UpdateGamePassDescriptionTranslationResponse
          | UpdateBadgeDescriptionTranslationResponse
          | UpdateDeveloperProductDescriptionTranslationResponse
          | null = null;
        if (entryInfo.productType === ProductType.Pass) {
          if (entryInfo.fieldType === ProductFieldType.Name) {
            nameResponse = await gameInternationalizationClient.updateGamePassNameTranslation({
              gamePassId: entryInfo.productId,
              languageCode: currentLanguageOrLocaleCode,
              request: { name: translationToSave },
            });
          }
          if (entryInfo.fieldType === ProductFieldType.Description) {
            descriptionResponse =
              await gameInternationalizationClient.updateGamePassDescriptionTranslation({
                gamePassId: entryInfo.productId,
                languageCode: currentLanguageOrLocaleCode,
                request: { description: translationToSave },
              });
          }
        }
        if (entryInfo.productType === ProductType.Badge) {
          if (entryInfo.fieldType === ProductFieldType.Name) {
            nameResponse = await gameInternationalizationClient.updateBadgeNameTranslation({
              badgeId: entryInfo.productId,
              languageCode: currentLanguageOrLocaleCode,
              request: { name: translationToSave },
            });
          }
          if (entryInfo.fieldType === ProductFieldType.Description) {
            descriptionResponse =
              await gameInternationalizationClient.updateBadgeDescriptionTranslation({
                badgeId: entryInfo.productId,
                languageCode: currentLanguageOrLocaleCode,
                request: { description: translationToSave },
              });
          }
        }
        if (entryInfo.productType === ProductType.DeveloperProduct) {
          if (entryInfo.fieldType === ProductFieldType.Name) {
            nameResponse =
              await gameInternationalizationClient.updateDeveloperProductNameTranslation({
                developerProductId: entryInfo.productId,
                languageCode: currentLanguageOrLocaleCode,
                request: {
                  name: translationToSave,
                },
              });
          }
          if (entryInfo.fieldType === ProductFieldType.Description) {
            descriptionResponse =
              await gameInternationalizationClient.updateDeveloperProductDescriptionTranslation({
                developerProductId: entryInfo.productId,
                languageCode: currentLanguageOrLocaleCode,
                request: {
                  description: translationToSave,
                },
              });
          }
        }
        if (nameResponse) {
          if (translationToSave !== '' && nameResponse.name !== translationToSave) {
            throw new Error(failedToSaveTranslationMessage);
          }
          dispatchEvent({
            fieldType: ProductFieldType.Name,
            productId: entryInfo.productId,
            productType: entryInfo.productType,
            languageCode: currentLanguageOrLocaleCode,
            text: nameResponse.name ?? null,
          });
        } else if (descriptionResponse) {
          if (translationToSave !== '' && descriptionResponse.description !== translationToSave) {
            throw new Error(failedToSaveTranslationMessage);
          }
          dispatchEvent({
            fieldType: ProductFieldType.Description,
            productId: entryInfo.productId,
            productType: entryInfo.productType,
            languageCode: currentLanguageOrLocaleCode,
            text: descriptionResponse.description ?? null,
          });
        } else {
          throw new Error(failedToSaveTranslationMessage);
        }
        getTranslationHistory(entryInfo);
        showSuccessToast(translate('Message.TranslationSaved'));
      } catch (e) {
        const errorResponse = await tryParseResponseError(e);
        if (errorResponse?.code === textFilterErrorCode) {
          showFailureToast(translate(textFilterErrorMessage));
        } else {
          showFailureToast(translate(failedToSaveTranslationMessage));
        }
      } finally {
        setIsSaving(false);
      }
    },
    [
      entryInfo,
      currentLanguageOrLocaleCode,
      trackerClient,
      dispatchEvent,
      getTranslationHistory,
      showFailureToast,
      showSuccessToast,
      translate,
    ],
  );

  return (
    entryInfo && (
      <>
        <TranslationDetails
          entryInfo={entryInfo}
          identifier={identifier}
          sourceLanguageCode={sourceLanguageCode}
          isLoading={isSaving}
          maxCharacters={
            entryInfo.fieldType === ProductFieldType.Name
              ? nameFieldMaxCharacters
              : descriptionFieldMaxCharacters
          }
          onSave={handleSaveGameProductTranslation}
        />
        <Divider />
        <TranslationHistory
          error={gameContentTranslationHistoryFetchingError}
          isLoading={isGameContentTranslationHistoryLoading}
          entries={gameContentTranslationHistory ?? []}
        />
      </>
    )
  );
};

export default SaveGameProductTranslation;
