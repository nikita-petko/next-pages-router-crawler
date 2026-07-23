import { GameIconData, gameInternationalizationClient, IconImageStatus } from '@modules/clients';
import { ImageDescription } from '@modules/miscellaneous/common/components/uploaders';
import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import TranslationStatus from '../../translation/enums/TranslationStatus';
import useGeneralTranslation from './useGeneralTranslation';
import getIconReviewStatusTranslationKey from '../utils/getIconReviewStatusTranslationKey';

const useIconTranslation = () => {
  const { translation, fetchDataError, isTranslationLoading, getTranslation } =
    useGeneralTranslation(gameInternationalizationClient.getGameIcon);
  const { translate } = useTranslation();

  const iconTranslation = useMemo(() => {
    if (typeof translation !== 'undefined') {
      const innerIconTranslation = translation as GameIconData;
      return {
        url: innerIconTranslation?.imageUrl ?? null,
        key: innerIconTranslation?.imageId,
        statusText: innerIconTranslation
          ? translate(getIconReviewStatusTranslationKey(innerIconTranslation.state))
          : '',
      } as ImageDescription;
    }
    return undefined;
  }, [translation, translate]);

  const iconTranslationStatus = useMemo(() => {
    if (typeof translation === 'undefined') {
      return null;
    }
    if (
      translation === null ||
      !((translation as GameIconData).state === IconImageStatus.Approved)
    ) {
      return TranslationStatus.Unfinished;
    }
    return TranslationStatus.Done;
  }, [translation]);

  return {
    iconTranslation,
    fetchIconError: fetchDataError,
    iconTranslationStatus,
    isIconTranslationLoading: isTranslationLoading,
    getIconTranslation: getTranslation,
  };
};

export default useIconTranslation;
