import { ChangeAgentType } from '@modules/clients/localizationTables';
import EntryFilterOptions from '../../gameStringTranslation/enums/EntryFilterOptions';
import EntrySortingOptions from '../../gameStringTranslation/enums/EntrySortingOptions';
import { numOfDaysForRecency } from '../constants';
import type { ImageTranslationInfo, ImageEntryBriefInfo } from '../types';

export function filterImageEntryList(
  filters: EntryFilterOptions[],
  entries: ImageEntryBriefInfo[],
): ImageEntryBriefInfo[] {
  if (filters.length === 0) {
    return entries;
  }

  const currentDate = new Date();
  const thresholdDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate() - numOfDaysForRecency,
  );

  const matchesFilter = (filter: EntryFilterOptions, entry: ImageEntryBriefInfo): boolean => {
    switch (filter) {
      case EntryFilterOptions.Translated:
        return entry.isTranslated;
      case EntryFilterOptions.Untranslated:
        return !entry.isTranslated;
      case EntryFilterOptions.AutomaticTranslated:
        return entry.changeAgentType === ChangeAgentType.Automation;
      case EntryFilterOptions.UserTranslated:
        return entry.changeAgentType === ChangeAgentType.User;
      case EntryFilterOptions.RecentlyAddedEntries:
        return (
          entry.entryCreatedTime != null &&
          entry.entryCreatedTime > thresholdDay &&
          entry.entryCreatedTime <= currentDate
        );
      case EntryFilterOptions.RecentlyModifiedTranslations:
        return (
          entry.translationUpdatedTime != null &&
          entry.translationUpdatedTime > thresholdDay &&
          entry.translationUpdatedTime <= currentDate
        );
      case EntryFilterOptions.FeedbackAvailable:
        return !!entry.shouldShowFeedback;
      case EntryFilterOptions.NoFeedback:
        return !entry.shouldShowFeedback;
      default:
        return false;
    }
  };

  return entries.filter((entry) => filters.some((filter) => matchesFilter(filter, entry)));
}

export function searchImageEntryList(
  stringToSearch: string,
  entries: ImageEntryBriefInfo[],
  fullEntryInfoMap: Map<string, ImageTranslationInfo>,
  locale: string,
): ImageEntryBriefInfo[] {
  if (stringToSearch === '') {
    return entries;
  }
  const q = stringToSearch.toLocaleLowerCase(locale);
  return entries.filter((entry) => {
    const info = fullEntryInfoMap.get(entry.identifier);
    return (
      String(entry.sourceAssetId).includes(q) ||
      (info?.translatedAssetId != null && String(info.translatedAssetId).includes(q))
    );
  });
}

export function sortImageEntryList(
  sortingOption: EntrySortingOptions,
  entries: ImageEntryBriefInfo[],
): ImageEntryBriefInfo[] {
  switch (sortingOption) {
    case EntrySortingOptions.Default:
      return entries;
    case EntrySortingOptions.Alphabetical:
      return [...entries].sort((a, b) => a.sourceAssetId - b.sourceAssetId);
    case EntrySortingOptions.CreatedTime:
      return [...entries].sort((a, b) => {
        if (a.entryCreatedTime === null) {
          return 1;
        }
        if (b.entryCreatedTime === null) {
          return -1;
        }
        const timeDiff = b.entryCreatedTime.getTime() - a.entryCreatedTime.getTime();
        return timeDiff !== 0 ? timeDiff : a.sourceAssetId - b.sourceAssetId;
      });
    default:
      return entries;
  }
}
