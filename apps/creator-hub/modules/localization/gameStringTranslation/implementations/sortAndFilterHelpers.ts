import { ChangeAgentType } from '@modules/clients/localizationTables';
import { numOfDaysForRecency } from '../constants';
import EntryFilterOptions from '../enums/EntryFilterOptions';
import EntrySortingOptions from '../enums/EntrySortingOptions';
import type { EntryBriefInfo, GameStringTranslationInfo } from '../types';

export function filterEntryList(
  filters: EntryFilterOptions[],
  entries: EntryBriefInfo[],
): EntryBriefInfo[] {
  if (filters.length === 0) {
    return entries;
  }

  const currentDate = new Date();
  const thresholdDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate() - numOfDaysForRecency,
  );

  const filterEntries = (filter: EntryFilterOptions, entry: EntryBriefInfo) => {
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
        return !!(
          entry.entryCreatedTime != null &&
          entry.entryCreatedTime > thresholdDay &&
          entry.entryCreatedTime <= currentDate
        );
      case EntryFilterOptions.RecentlyModifiedTranslations: {
        const latestTranslationUpdatedDate = entry.translationUpdatedTime;
        return !!(
          latestTranslationUpdatedDate != null &&
          latestTranslationUpdatedDate > thresholdDay &&
          latestTranslationUpdatedDate <= currentDate
        );
      }
      case EntryFilterOptions.NoFeedback:
        return !entry.shouldShowFeedback;
      case EntryFilterOptions.FeedbackAvailable:
        return entry.shouldShowFeedback;
      default:
        break;
    }
    return false;
  };

  return entries.filter((entry) => filters.some((filter) => filterEntries(filter, entry)));
}

export function searchEntryList(
  stringToSearch: string,
  entries: EntryBriefInfo[],
  fullEntryInfoMap: Map<string, GameStringTranslationInfo>,
  sourceLanguageCode: string,
  currentLanguageOrLocaleCode: string,
): EntryBriefInfo[] {
  return stringToSearch === ''
    ? entries
    : entries.filter(
        (entry) =>
          // check if source text contains stringToSearch
          entry.sourceText
            .toLocaleLowerCase(sourceLanguageCode)
            .includes(stringToSearch.toLocaleLowerCase(sourceLanguageCode)) ||
          // check if translation text contains stringToSearch
          fullEntryInfoMap
            .get(entry.identifier)
            ?.currentTranslation?.toLocaleLowerCase(currentLanguageOrLocaleCode)
            .includes(stringToSearch.toLocaleLowerCase(sourceLanguageCode)),
      );
}

export function sortEntryList(
  sortingOption: EntrySortingOptions,
  entries: EntryBriefInfo[],
  sourceLanguageCode: string,
): EntryBriefInfo[] {
  let sortedEntryList: EntryBriefInfo[] = [];
  switch (sortingOption) {
    case EntrySortingOptions.Default:
      sortedEntryList = entries;
      break;
    case EntrySortingOptions.Alphabetical:
      sortedEntryList = [...entries]?.sort((a, b) =>
        a.sourceText.localeCompare(b.sourceText, sourceLanguageCode),
      );
      break;
    case EntrySortingOptions.CreatedTime:
      sortedEntryList = [...entries]?.sort((a, b) => {
        if (a.entryCreatedTime === null) {
          return 1;
        }
        if (b.entryCreatedTime === null) {
          return -1;
        }
        if (a.entryCreatedTime === b.entryCreatedTime) {
          return a.sourceText.localeCompare(b.sourceText, sourceLanguageCode);
        }
        return a.entryCreatedTime < b.entryCreatedTime ? 1 : -1;
      });
      break;
    default:
      throw new Error('Invalid Sorting Option!');
  }
  return sortedEntryList;
}
