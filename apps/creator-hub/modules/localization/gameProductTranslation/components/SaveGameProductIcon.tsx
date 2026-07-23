import {
  BadgeIconResponse,
  DeveloperProductIconResponse,
  extractStringValueFromError,
  gameInternationalizationClient,
  GamePassIconResponse,
} from '@modules/clients';
import { ImageDescription } from '@modules/miscellaneous/common/components/uploaders';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { useTranslation } from '@rbx/intl';
import React, { FunctionComponent, useCallback, useContext, useMemo, useState } from 'react';
import CreatorDashboardUserResponse from '@modules/eventStream/enum/CreatorDashboardUserResponse';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { updateGameProductIconEventModel } from '@modules/eventStream/constants/eventConstants';
import useShowToastMessage from '../../common/hooks/useShowToastMessage';
import IconImageUploader from '../../translation/components/IconImageUploader';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import selectedItemDetailContext from '../contexts/SelectedItemDetailContext';
import ProductFieldType from '../enums/ProductFieldTypes';
import ProductType from '../enums/ProductTypes';
import useGetImageStatusString from '../hooks/useGetImageStatusString';
import { ImageTranslation } from '../types';

const SaveGameProductIcon: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { trackerClient } = useEventTrackerProvider();
  const { error } = useMetricsMonitoring();
  const { currentLanguageOrLocaleCode } = useEntryManagementMetadata();
  const { translate } = useTranslation();
  const { getImageStatusString } = useGetImageStatusString();
  const { showSuccessToast, showFailureToast } = useShowToastMessage();
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const { itemDetail, dispatchEvent } = useContext(selectedItemDetailContext);

  const imageInfo = useMemo(() => {
    if (itemDetail && itemDetail.fieldType === ProductFieldType.Icon) {
      const imageTranslation = itemDetail.currentTranslation as ImageTranslation | null;
      return {
        url: imageTranslation?.imageUrl,
        statusText: imageTranslation
          ? getImageStatusString(imageTranslation.imageStatus)
          : undefined,
      } as ImageDescription;
    }
    return null;
  }, [getImageStatusString, itemDetail]);

  const handleSaveImage = useCallback(
    async (imageFile: File | null) => {
      if (imageFile) {
        trackerClient.sendEvent(
          updateGameProductIconEventModel(
            itemDetail?.productType ?? '',
            itemDetail?.productId ?? '',
            CreatorDashboardUserResponse.Delete,
            currentLanguageOrLocaleCode ?? '',
          ),
        );
        trackerClient.sendEvent(
          updateGameProductIconEventModel(
            itemDetail?.productType ?? '',
            itemDetail?.productId ?? '',
            CreatorDashboardUserResponse.Upload,
            currentLanguageOrLocaleCode ?? '',
          ),
        );
      } else {
        trackerClient.sendEvent(
          updateGameProductIconEventModel(
            itemDetail?.productType ?? '',
            itemDetail?.productId ?? '',
            CreatorDashboardUserResponse.Delete,
            currentLanguageOrLocaleCode ?? '',
          ),
        );
      }
      try {
        if (!itemDetail) {
          throw new Error('Selected item is null');
        }
        if (!currentLanguageOrLocaleCode) {
          throw new Error('Current language code is undefined');
        }
        setIsUploading(true);
        if (itemDetail.productType === ProductType.Pass) {
          if (imageFile) {
            await gameInternationalizationClient.updateGamePassIcon({
              gamePassId: itemDetail.productId,
              languageCode: currentLanguageOrLocaleCode,
              files: imageFile,
            });
            showSuccessToast(translate('Message.IconUploaded'));
          } else {
            await gameInternationalizationClient.deleteGamePassIcon({
              gamePassId: itemDetail.productId,
              languageCode: currentLanguageOrLocaleCode,
            });
            showSuccessToast(translate('Message.IconDeleted'));
          }
        }
        if (itemDetail.productType === ProductType.Badge) {
          if (imageFile) {
            await gameInternationalizationClient.updateBadgeIcon({
              badgeId: itemDetail.productId,
              languageCode: currentLanguageOrLocaleCode,
              files: imageFile,
            });
            showSuccessToast(translate('Message.IconUploaded'));
          } else {
            await gameInternationalizationClient.deleteBadgeIcon({
              badgeId: itemDetail.productId,
              languageCode: currentLanguageOrLocaleCode,
            });
            showSuccessToast(translate('Message.IconDeleted'));
          }
        }
        if (itemDetail.productType === ProductType.DeveloperProduct) {
          if (imageFile) {
            await gameInternationalizationClient.updateDeveloperProductIcon({
              developerProductId: itemDetail.productId,
              languageCode: currentLanguageOrLocaleCode,
              files: imageFile,
            });
            showSuccessToast(translate('Message.IconDeleted'));
            showSuccessToast(translate('Message.IconUploaded'));
          } else {
            await gameInternationalizationClient.deleteDeveloperProductIcon({
              developerProductId: itemDetail.productId,
              languageCode: currentLanguageOrLocaleCode,
            });
            showSuccessToast(translate('Message.IconDeleted'));
          }
        }
        let response:
          | GamePassIconResponse
          | BadgeIconResponse
          | DeveloperProductIconResponse
          | null = null;
        if (itemDetail.productType === ProductType.Pass) {
          response = await gameInternationalizationClient.getGamePassIcon({
            gamePassId: itemDetail.productId,
          });
        }
        if (itemDetail.productType === ProductType.Badge) {
          response = await gameInternationalizationClient.getBadgeIcon({
            badgeId: itemDetail.productId,
          });
        }
        if (itemDetail.productType === ProductType.DeveloperProduct) {
          response = await gameInternationalizationClient.getDeveloperProductIcon({
            developerProductId: itemDetail.productId,
          });
        }
        if (!response) {
          showFailureToast(translate('Message.FailedToFetchIconData'));
          error('SaveGameProductIcon: Failed to fetch icon data');
          return;
        }
        dispatchEvent({
          fieldType: ProductFieldType.Icon,
          productId: itemDetail.productId,
          productType: itemDetail.productType,
          response,
        });
      } catch (e) {
        showFailureToast(translate('Message.FailedToUpdateIcon'));
        error(extractStringValueFromError(e, 'message', ''));
      } finally {
        setIsUploading(false);
      }
    },
    [
      trackerClient,
      itemDetail,
      currentLanguageOrLocaleCode,
      dispatchEvent,
      showSuccessToast,
      translate,
      showFailureToast,
      error,
    ],
  );

  return (
    imageInfo && (
      <IconImageUploader imageInfo={imageInfo} isLoading={isUploading} onSave={handleSaveImage} />
    )
  );
};

export default SaveGameProductIcon;
