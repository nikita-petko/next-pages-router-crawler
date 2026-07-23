import { AutoScrapeCleanupRequestOptions } from '@modules/clients/localizationTables';

const defaultSelectedTime = '24Hours';
const LOCALIZATION_LOADER_SIZE = 28;

const clearUntranslatedStringTimes: { [key: string]: string | null } = {
  '24Hours': AutoScrapeCleanupRequestOptions.ONEDAY,
  '3Days': AutoScrapeCleanupRequestOptions.THREEDAYS,
  '7Days': AutoScrapeCleanupRequestOptions.SEVENDAYS,
  '30Days': AutoScrapeCleanupRequestOptions.THIRTYDAYS,
  All: null,
};

const clearUntranslatedStringTimesTranslation: Record<string, string> = {
  '24Hours': 'Description.TwentyFourHours',
  '3Days': 'Description.ThreeDays',
  '7Days': 'Description.SevenDays',
  '30Days': 'Description.ThirtyDays',
  All: 'All',
};

const chineseSimplifiedLanguageCode = 'zh-hans';

export {
  defaultSelectedTime,
  clearUntranslatedStringTimes,
  clearUntranslatedStringTimesTranslation,
  LOCALIZATION_LOADER_SIZE,
  chineseSimplifiedLanguageCode,
};
