import { useMemo } from 'react';
import type { GameNameAndDescriptionData } from '@modules/clients/gameInternationalization';
import gameInternationalizationClient from '@modules/clients/gameInternationalization';
import TranslationStatus from '../../translation/enums/TranslationStatus';
import GameInfoField from '../enums/GameInfoField';
import type { GameInfoTranslationInfo } from '../types';
import useGeneralTranslation from './useGeneralTranslation';

const useNameAndDescriptionTranslation = () => {
  const {
    sourceText,
    globalTranslation,
    translation,
    fetchDataError,
    isTranslationLoading,
    getTranslation,
  } = useGeneralTranslation(gameInternationalizationClient.getGameNameAndDescription);

  const nameTranslation = useMemo(() => {
    if (typeof translation !== 'undefined') {
      const textTranslation = translation as GameNameAndDescriptionData;
      return {
        sourceText: sourceText?.name ?? '',
        fieldType: GameInfoField.Name,
        currentTranslation: textTranslation?.name ?? null,
        globalTranslation: globalTranslation?.name ?? null,
        complementaryTranslation: textTranslation?.description ?? null,
      } as GameInfoTranslationInfo;
    }
    return;
  }, [sourceText, globalTranslation, translation]);

  const descriptionTranslation = useMemo(() => {
    if (typeof translation !== 'undefined') {
      const textTranslation = translation as GameNameAndDescriptionData;
      return {
        sourceText: sourceText?.description ?? '',
        fieldType: GameInfoField.Description,
        currentTranslation: textTranslation?.description ?? null,
        globalTranslation: globalTranslation?.description ?? null,
        complementaryTranslation: textTranslation?.name ?? null,
      } as GameInfoTranslationInfo;
    }
    return;
  }, [sourceText, globalTranslation, translation]);

  const nameTranslationStatus = useMemo(() => {
    if (typeof translation === 'undefined') {
      return null;
    }
    const nameString = (translation as GameNameAndDescriptionData)?.name;
    if (translation === null || typeof nameString === 'undefined' || nameString.length === 0) {
      return TranslationStatus.Unfinished;
    }
    return TranslationStatus.Done;
  }, [translation]);

  const descriptionTranslationStatus = useMemo(() => {
    if (typeof translation === 'undefined') {
      return null;
    }
    const descriptionString = (translation as GameNameAndDescriptionData)?.description;
    if (
      translation === null ||
      typeof descriptionString === 'undefined' ||
      descriptionString.length === 0
    ) {
      return TranslationStatus.Unfinished;
    }
    return TranslationStatus.Done;
  }, [translation]);

  return {
    nameTranslation,
    descriptionTranslation,
    nameTranslationStatus,
    descriptionTranslationStatus,
    fetchNameAndDescriptionError: fetchDataError,
    isNameAndDescriptionTranslationLoading: isTranslationLoading,
    getNameAndDescriptionTranslation: getTranslation,
  };
};

export default useNameAndDescriptionTranslation;
