import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import type { GameThumbnailsData } from '@modules/clients/gameInternationalization';
import gameInternationalizationClient, {
  ThumbnailImageStatus,
} from '@modules/clients/gameInternationalization';
import type { ImageDescription } from '@modules/miscellaneous/components/uploaders/types';
import TranslationStatus from '../../translation/enums/TranslationStatus';
import getThumbnailReviewStatusTranslationKey from '../utils/getThumbnailReviewStatusTranslationKey';
import useGeneralTranslation from './useGeneralTranslation';

const useThumbnailsTranslation = () => {
  const { translation, fetchDataError, isTranslationLoading, getTranslation } =
    useGeneralTranslation(gameInternationalizationClient.getGameThumbnails);
  const { translate } = useTranslation();

  const thumbnailsTranslation = useMemo(() => {
    if (typeof translation !== 'undefined') {
      const innerThumbnailsTranslation = translation as GameThumbnailsData;
      const imagesInfoList = innerThumbnailsTranslation?.mediaAssets?.map((image) => {
        return {
          name: image.mediaAssetId,
          url: image.mediaAssetUrl,
          key: image.mediaAssetId,
          altText: image.mediaAssetAltText,
          statusText: translate(getThumbnailReviewStatusTranslationKey(image.state)),
        } as ImageDescription;
      });
      if (!imagesInfoList) {
        return [];
      }
      return imagesInfoList;
    }
    return;
  }, [translation, translate]);

  const thumbnailsTranslationStatus = useMemo(() => {
    if (typeof translation === 'undefined') {
      return null;
    }
    if (translation === null) {
      return TranslationStatus.Unfinished;
    }
    const innerThumbnailsTranslation = translation as GameThumbnailsData;
    if (
      innerThumbnailsTranslation?.mediaAssets?.every(
        (image) => image.state === ThumbnailImageStatus.Approved,
      )
    ) {
      return TranslationStatus.Done;
    }
    return TranslationStatus.Unfinished;
  }, [translation]);

  return {
    thumbnailsTranslation,
    thumbnailsTranslationStatus,
    fetchThumbnailsError: fetchDataError,
    isThumbnailsTranslationLoading: isTranslationLoading,
    getThumbnailsTranslation: getTranslation,
  };
};

export default useThumbnailsTranslation;
