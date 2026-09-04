import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import type { AssetTranslationEntryTable } from '@modules/clients/localizationTables';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import useImageEntryInformation from '../hooks/useImageEntryInformation';
import localeToLanguageCode from '../implementations/localeToLanguageCode';
import type { ImageEntryBriefInfo, ImageTranslationInfo } from '../types';
import ImageEntriesMetadataContext from './ImageEntriesMetadataContext';
import type { ImageEntriesMetadataValue } from './ImageEntriesMetadataContext';

// An asset entry is identified by its source asset id (no key/context/source). Each translation's
// `translationText` holds the translated asset id, so the active-language translation gives us the
// translated thumbnail asset (or null when untranslated). The asset-entries endpoint keys
// translations by locale (e.g. `de_de`), so we resolve by mapping each locale to its language code
// and matching the active language code.
function buildEntryInfoMap(
  assetEntries: AssetTranslationEntryTable,
  activeLanguageCode: string | null,
): Map<string, ImageTranslationInfo> {
  const entryInfoMap = new Map<string, ImageTranslationInfo>();
  assetEntries.forEach((entry) => {
    const { sourceAssetId } = entry;
    if (sourceAssetId == null) {
      return;
    }
    const identifier = String(sourceAssetId);
    const currentTranslationText = entry.translations?.find(
      (translation) =>
        translation.locale != null &&
        localeToLanguageCode(translation.locale) === activeLanguageCode,
    )?.translationText;
    const translatedAssetId =
      currentTranslationText != null && currentTranslationText !== ''
        ? Number(currentTranslationText)
        : null;
    const joinedGameLocations = entry.gameLocations
      ?.filter((location) => location?.path)
      .map((location) => location.path)
      .join(', ');
    const gameLocationsForDisplay =
      joinedGameLocations != null && joinedGameLocations !== '' ? joinedGameLocations : null;
    entryInfoMap.set(identifier, {
      identifier,
      sourceAssetId,
      translatedAssetId,
      gameLocationsForDisplay,
    });
  });
  return entryInfoMap;
}

function buildBriefList(
  assetEntries: AssetTranslationEntryTable,
  activeLanguageCode: string | null,
): ImageEntryBriefInfo[] {
  const briefList: ImageEntryBriefInfo[] = [];
  assetEntries.forEach((entry) => {
    const { sourceAssetId } = entry;
    if (sourceAssetId == null) {
      return;
    }
    const currentTranslation = entry.translations?.find(
      (translation) =>
        translation.locale != null &&
        localeToLanguageCode(translation.locale) === activeLanguageCode,
    );
    const translationText = currentTranslation?.translationText;
    const isTranslated = translationText != null && translationText !== '';
    briefList.push({
      identifier: String(sourceAssetId),
      sourceAssetId,
      isTranslated,
      shouldShowFeedback: (currentTranslation?.feedbackCount ?? 0) > 0,
      changeAgentType: currentTranslation?.translator?.agentType ?? null,
      entryCreatedTime: entry.createdTime ?? null,
      translationUpdatedTime: currentTranslation?.updatedTime ?? null,
    });
  });
  return briefList;
}

// Converts the fetched asset-entries table (from ImageLocalizationTableEntriesProvider) into the
// per-locale display model consumed by the list/updater.
const ImageEntriesMetadataProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const { fullEntryTable } = useImageEntryInformation();
  const { activeTranslationTarget } = useEntryManagementMetadata();
  const activeLanguageCode = activeTranslationTarget?.languageCode ?? null;

  const fullEntryInfoMap = useMemo(
    () => buildEntryInfoMap(fullEntryTable, activeLanguageCode),
    [fullEntryTable, activeLanguageCode],
  );

  const fullEntryList = useMemo(
    () => buildBriefList(fullEntryTable, activeLanguageCode),
    [fullEntryTable, activeLanguageCode],
  );

  const metadataValue: ImageEntriesMetadataValue = useMemo(
    () => ({ fullEntryList, fullEntryInfoMap }),
    [fullEntryList, fullEntryInfoMap],
  );

  return (
    <ImageEntriesMetadataContext.Provider value={metadataValue}>
      {children}
    </ImageEntriesMetadataContext.Provider>
  );
};

export default ImageEntriesMetadataProvider;
