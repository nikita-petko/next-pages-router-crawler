import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import type { GameIconData } from '@modules/clients/gameInternationalization';
import gameInternationalizationClient, {
  IconImageStatus,
} from '@modules/clients/gameInternationalization';
import type { ImageDescription } from '@modules/miscellaneous/components/uploaders/types';
import TranslationStatus from '../../translation/enums/TranslationStatus';
import getIconReviewStatusTranslationKey from '../utils/getIconReviewStatusTranslationKey';
import useGeneralTranslation from './useGeneralTranslation';

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
    return;
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
