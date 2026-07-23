import { DownloadReportType, TranslatorType } from '@modules/clients';
/*
 * NOTE(lucaswang 02-15-2023): Part of the task https://roblox.atlassian.net/browse/DSA-900
 * which introduces a new eslint rule to disallow importing private components from other modules.
 * Should refactor to export private component in the corresponding module's index.ts.
 */
// eslint-disable-next-line no-restricted-imports -- see comment above
import GameInfoField from '@modules/localization/gameInfoTranslation/enums/GameInfoField';
// eslint-disable-next-line no-restricted-imports -- see comment above
import ProductFieldType from '@modules/localization/gameProductTranslation/enums/ProductFieldTypes';
// eslint-disable-next-line no-restricted-imports -- see comment above
import ProductType from '@modules/localization/gameProductTranslation/enums/ProductTypes';
// eslint-disable-next-line no-restricted-imports -- see comment above
import TranslatorInviteOptions from '@modules/localization/localization/enums/TranslatorInviteOptions';
import CreatorDashboardContext from '../enum/CreatorDashboardContext';
import CreatorDashboardEventType from '../enum/CreatorDashboardEventType';
import CreatorDashboardSource from '../enum/CreatorDashboardSource';
import CreatorDashboardUserResponse from '../enum/CreatorDashboardUserResponse';

export interface TrackerClientRequest {
  eventType: string;
  context: string;
  additionalProperties?: { [key: string]: string | number };
}

export type NotificationsEventAdditionalProperties = {
  userId?: number;
  universeId?: number;
  notificationContentId?: number;
};

const downloadStudioDirectDownloadEventModel = (
  downloadCode: string = '',
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.DownloadStudio,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    logic: 'directDownload',
    referralUrl: document.referrer,
    downloadCode,
  },
});

const downloadStudioOpenOrDownloadEventModel = (
  downloadCode: string = '',
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.DownloadStudio,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    logic: 'openOrDownload',
    referralUrl: document.referrer,
    downloadCode,
  },
});

const loadPageEventModel = (): TrackerClientRequest => ({
  // NOTE (jcountryman, 04/17/23): Hardcoding this value since no other
  // events should use this event type. This is used for the unified data pipeline.
  eventType: 'loadPage',
  context: CreatorDashboardContext.Load,
  additionalProperties: {
    // TODO (zwang, CRF-1708): follow up on identify UA, potentially using query string
    referralUrl: document.referrer,
  },
});

const viewComputeTab: TrackerClientRequest = {
  eventType: CreatorDashboardEventType.ViewComputeTab,
  context: CreatorDashboardContext.Click,
};

const studioStartAttemptEventModel = (task: string): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.StudioStartAttempt,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    task: task.toLowerCase(),
    referralUrl: document.referrer,
  },
});

const studioStartSuccessEventModel = (task: string): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.StudioStartSuccess,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    task: task.toLowerCase(),
    referralUrl: document.referrer,
  },
});

const manageSupportedLanguageEventModel = (
  languageCodes: string[],
  universeId: number,
  userResponse: CreatorDashboardUserResponse,
  isAddLanguage: boolean,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.ManageSupportedLanguage,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.LocalizationAddSupportedLanguage,
    LanguageCodes: languageCodes.toString(),
    UniverseId: universeId,
    UserResponse: userResponse,
    IsAddLanguage: isAddLanguage ? 'true' : 'false',
  },
});

const inviteTranslatorEventModel = (
  assigneeId: number | null,
  userResponse: CreatorDashboardUserResponse,
  translatorType: TranslatorType | null,
  inviteOptions: TranslatorInviteOptions,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.InviteTranslatorsModel,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.LocalizationTranslatorTab,
    AssigneeId: assigneeId ?? '',
    TranslatorType: translatorType ?? '',
    InviteOptions: inviteOptions,
    UserResponse: userResponse,
  },
});

const downloadContributorReportEventModel = (
  universeId: number,
  startDate: Date,
  endDate: Date,
  reportType: DownloadReportType,
  reportTargetId: number,
  statusCode: number,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.DownloadContributorReport,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.LocalizationContributionReport,
    UniverseId: universeId,
    StartDate: startDate.toISOString(),
    EndDate: endDate.toISOString(),
    ReportType: reportType,
    ReportTargetId: reportTargetId,
    StatusCode: statusCode,
  },
});

const localizationSettingsToggledEventModel = (
  event: CreatorDashboardEventType,
  universeId: number,
  userResponse: CreatorDashboardUserResponse,
  statusCode: number,
): TrackerClientRequest => ({
  eventType: event,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.LocalizationSettingsTab,
    UniverseId: universeId,
    UserResponse: userResponse,
    StatusCode: statusCode,
  },
});

const clearAutoCapturedTableEventModel = (
  selectedTimeFrame: string | null,
  universeId: number,
  statusCode: number,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.ClearAutoCapturedTable,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.LocalizationSettingsTab,
    SelectedTimeFrame: selectedTimeFrame ?? '',
    UniverseId: universeId,
    StatusCode: statusCode,
  },
});

const switchOffAutomaticTranslationEventModel = (
  source: CreatorDashboardSource,
  universeId: number | undefined,
  languageCode: string,
  userResponse: CreatorDashboardUserResponse,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.SwitchOffAutomaticTranslation,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: source,
    LanguageCode: languageCode,
    UniverseId: universeId ?? '',
    UserResponse: userResponse,
  },
});

const switchOnAutomaticTranslationEventModel = (
  source: CreatorDashboardSource,
  universeId: number | undefined,
  languageCode: string,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.SwitchOnAutomaticTranslation,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: source,
    LanguageCode: languageCode,
    UniverseId: universeId ?? '',
  },
});

const updateUniverseInformationEventModel = (
  field: GameInfoField,
  originalString: string,
  translation: string,
  universeId: number | null,
  languageCode: string,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.UpdateUniverseInformation,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.TranslationInformationTab,
    Field: field,
    OriginalString: originalString,
    Translation: translation,
    LanguageCode: languageCode,
    UniverseId: universeId ?? '',
  },
});

const updateUniverseIconAndThumbnailEventModel = (
  universeId: number | null,
  field: GameInfoField,
  languageCode: string | null,
  userResponse: CreatorDashboardUserResponse,
  statusCode: number,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.UpdateUniverseIconAndThumbnail,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.TranslationInformationTab,
    UniverseId: universeId ?? '',
    Field: field,
    LanguageCode: languageCode ?? '',
    UserResponse: userResponse,
    StatusCode: statusCode,
  },
});

const addEntryEventModel = (
  originalString: string | null,
  key: string | null,
  context: string | null,
  example: string | null,
  universeId: number | null,
  userResponse: CreatorDashboardUserResponse,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.AddTranslationEntry,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.TranslationStringsTab,
    UserResponse: userResponse,
    OriginalString: originalString ?? '',
    Key: key ?? '',
    Context: context ?? '',
    Example: example ?? '',
    UniverseId: universeId ?? '',
  },
});

const filterProductListEventModel = (
  universeId: number | null,
  productType: ProductType | string,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.FilterTranslationProductList,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.TranslationProductsTab,
    ProductType: productType,
    UniverseId: universeId ?? '',
  },
});

const updateGameProductTranslationEventModel = (
  productType: ProductType | string,
  productId: number | string,
  fieldType: ProductFieldType,
  translation: string | null,
  languageCode: string,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.UpdateGameProductTranslation,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.TranslationProductsTab,
    ProductType: productType,
    ProductId: productId,
    FieldType: fieldType,
    Translation: translation ?? '',
    LanguageCode: languageCode,
  },
});

const updateGameProductIconEventModel = (
  productType: ProductType | string,
  productId: number | string,
  userResponse: CreatorDashboardUserResponse,
  languageCode: string,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.UpdateGameProductIcon,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.TranslationProductsTab,
    ProductType: productType,
    ProductId: productId,
    UserResponse: userResponse,
    LanguageCode: languageCode,
  },
});

const languageTabSelectedRequestEventModel = (
  universeId: number | null,
  currLanguageCode: string | null,
  newLanguageCode: string | null,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.PageTabSelected,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.LanguageTabSelectedRequest,
    UniverseId: universeId ?? '',
    CurrentTab: currLanguageCode ?? '',
    SelectedTab: newLanguageCode ?? '',
  },
});

const selectInviteTranslatorsEventModel: TrackerClientRequest = {
  eventType: CreatorDashboardEventType.SelectInviteTranslators,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.LocalizationTranslatorTab,
  },
};

const viewNotificationsEventMode = (
  userId: string | number | undefined,
  universeId: string | number | undefined,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.ViewNotifications,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    Source: CreatorDashboardSource.LeftNavigation,
    userId: userId ? `${userId}` : 'unknown',
    universeId: universeId ? `${universeId}` : 'unknown',
  },
});

const loadNotificationCategoryEventModel = (category: string): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.NotificationsSettingsCategoryLoad,
  context: CreatorDashboardContext.Load,
  additionalProperties: {
    category,
  },
});

const notificationSettingsLeftNavEventModel = (from: string, to: string): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.NotificationsSettingsLeftNavClick,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    from,
    to,
  },
});

const notificationsSettingsCategoryCancelEventModel = (category: string): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.NotificationsSettingsCategoryCancelClick,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    category,
  },
});

export {
  downloadStudioDirectDownloadEventModel,
  downloadStudioOpenOrDownloadEventModel,
  loadPageEventModel,
  viewComputeTab,
  studioStartAttemptEventModel,
  studioStartSuccessEventModel,
  manageSupportedLanguageEventModel,
  inviteTranslatorEventModel,
  downloadContributorReportEventModel,
  localizationSettingsToggledEventModel,
  clearAutoCapturedTableEventModel,
  switchOffAutomaticTranslationEventModel,
  switchOnAutomaticTranslationEventModel,
  updateUniverseInformationEventModel,
  addEntryEventModel,
  filterProductListEventModel,
  updateGameProductTranslationEventModel,
  updateGameProductIconEventModel,
  updateUniverseIconAndThumbnailEventModel,
  languageTabSelectedRequestEventModel,
  selectInviteTranslatorsEventModel,
  viewNotificationsEventMode,
  loadNotificationCategoryEventModel,
  notificationSettingsLeftNavEventModel,
  notificationsSettingsCategoryCancelEventModel,
};
