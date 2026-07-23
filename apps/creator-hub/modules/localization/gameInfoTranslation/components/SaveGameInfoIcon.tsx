import {
  extractStringValueFromError,
  gameInternationalizationClient,
  getErrorStatus,
} from '@modules/clients';
import { ImageDescription } from '@modules/miscellaneous/common/components/uploaders';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { useTranslation } from '@rbx/intl';
import React, { FunctionComponent, useCallback, useState } from 'react';
import CreatorDashboardUserResponse from '@modules/eventStream/enum/CreatorDashboardUserResponse';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { updateUniverseIconAndThumbnailEventModel } from '@modules/eventStream/constants/eventConstants';
import useShowToastMessage from '../../common/hooks/useShowToastMessage';
import IconImageUploader from '../../translation/components/IconImageUploader';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import GameInfoField from '../enums/GameInfoField';

export interface SaveGameInfoIconProps {
  imageInfo: ImageDescription;
  isLoading: boolean;
  onSaveSuccess: () => void;
}

const SaveGameInfoIcon: FunctionComponent<React.PropsWithChildren<SaveGameInfoIconProps>> = ({
  imageInfo,
  isLoading,
  onSaveSuccess,
}) => {
  const { trackerClient } = useEventTrackerProvider();
  const { translate } = useTranslation();
  const { error } = useMetricsMonitoring();
  const { gameId, currentLanguageOrLocaleCode } = useEntryManagementMetadata();
  const { showSuccessToast, showFailureToast } = useShowToastMessage();
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleSaveImage = useCallback(
    async (imageFile: File | null) => {
      try {
        if (!currentLanguageOrLocaleCode) {
          throw new Error('Current language code is undefined');
        }
        if (!gameId) {
          throw new Error('Game Id is null');
        }
        setIsUploading(true);
        if (imageFile !== null) {
          await gameInternationalizationClient.updateGameIcon({
            gameId,
            languageCode: currentLanguageOrLocaleCode,
            files: imageFile,
          });
          trackerClient.sendEvent(
            updateUniverseIconAndThumbnailEventModel(
              gameId,
              GameInfoField.Icon,
              currentLanguageOrLocaleCode,
              CreatorDashboardUserResponse.Upload,
              200,
            ),
          );
          showSuccessToast(translate('Message.IconUploaded'));
        } else {
          await gameInternationalizationClient.deleteGameIcon({
            gameId,
            languageCode: currentLanguageOrLocaleCode,
          });
          trackerClient.sendEvent(
            updateUniverseIconAndThumbnailEventModel(
              gameId,
              GameInfoField.Icon,
              currentLanguageOrLocaleCode,
              CreatorDashboardUserResponse.Delete,
              200,
            ),
          );
          showSuccessToast(translate('Message.IconDeleted'));
        }
        onSaveSuccess();
      } catch (e) {
        error(extractStringValueFromError(e, 'message', ''));
        const errorStatus = getErrorStatus(e, 500);
        if (imageFile !== null) {
          trackerClient.sendEvent(
            updateUniverseIconAndThumbnailEventModel(
              gameId,
              GameInfoField.Icon,
              currentLanguageOrLocaleCode,
              CreatorDashboardUserResponse.Upload,
              errorStatus,
            ),
          );
        } else {
          trackerClient.sendEvent(
            updateUniverseIconAndThumbnailEventModel(
              gameId,
              GameInfoField.Icon,
              currentLanguageOrLocaleCode,
              CreatorDashboardUserResponse.Delete,
              errorStatus,
            ),
          );
        }
        showFailureToast(translate('Message.FailedToUpdateIcon'));
      } finally {
        setIsUploading(false);
      }
    },
    [
      currentLanguageOrLocaleCode,
      error,
      gameId,
      onSaveSuccess,
      showFailureToast,
      showSuccessToast,
      trackerClient,
      translate,
    ],
  );

  return gameId && currentLanguageOrLocaleCode ? (
    <IconImageUploader
      imageInfo={imageInfo}
      isLoading={isLoading || isUploading}
      onSave={handleSaveImage}
    />
  ) : null;
};

export default SaveGameInfoIcon;
