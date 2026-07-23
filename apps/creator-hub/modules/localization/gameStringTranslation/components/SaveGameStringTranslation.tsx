import React, { FunctionComponent, useMemo } from 'react';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import getIdentifier from '../../translation/utils/getIdentifier';
import TranslationDetails from '../../translation/components/TranslationDetails';
import { maxCharacterNumber } from '../constants';
import { GameStringTranslationInfo } from '../types';

export interface SaveGameStringTranslationProps {
  entryInfo: GameStringTranslationInfo;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (currentTranslation: string | null, isTranslationManual: boolean) => void;
}

const SaveGameStringTranslation: FunctionComponent<
  React.PropsWithChildren<SaveGameStringTranslationProps>
> = ({ entryInfo, isLoading, isSaving, onSave }) => {
  const { gameId, currentLanguageOrLocaleCode, sourceLanguageCode } = useEntryManagementMetadata();

  const identifier = useMemo(() => {
    return getIdentifier(entryInfo.sourceText, entryInfo.context) + currentLanguageOrLocaleCode;
  }, [entryInfo, currentLanguageOrLocaleCode]);

  return gameId && currentLanguageOrLocaleCode ? (
    <TranslationDetails
      entryInfo={entryInfo}
      identifier={identifier}
      sourceLanguageCode={sourceLanguageCode}
      isLoading={isSaving || isLoading}
      maxCharacters={maxCharacterNumber}
      onSave={onSave}
    />
  ) : null;
};

export default SaveGameStringTranslation;
