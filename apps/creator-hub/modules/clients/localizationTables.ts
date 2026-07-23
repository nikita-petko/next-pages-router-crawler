import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  LocalizationTableApi,
  AutoLocalizationTableApi,
  RobloxLocalizationTablesApiPatchTranslation,
  RobloxInGameContentTablesClientGameLocation,
  RobloxLocalizationTablesApiCursorEntryIdentifierSortOrderEnum,
  V1LocalizationTableTablesTableIdEntriesGetRequest,
  RobloxLocalizationTablesApiGetTableEntriesPagedResponse,
  V1LocalizationTableTablesTableIdPatchRequest,
  RobloxLocalizationTablesApiUpdateTableContentsResponse,
  V1LocalizationTableTablesTableIdEntriesTranslationHistoryPostRequest,
  RobloxLocalizationTablesApiTranslationHistory,
  RobloxLocalizationTablesApiEntry,
  V1AutoLocalizationTableGamesGameIdAutoScrapeCleanupRequestPostRequest,
  V1LocalizationTableTablesTableIdEntryCountGetRequest,
  RobloxLocalizationTablesApiGetTableEntryCountResponse,
  RobloxLocalizationTablesApiEntryTranslationHistoryPaged,
  RobloxLocalizationTablesApiEntryIdentifier,
  RobloxLocalizationTablesApiTranslatorAgentTypeEnum,
  RobloxLocalizationTablesApiModifiedEntry,
  RobloxLocalizationTablesApiFailedEntry,
  RobloxLocalizationTablesApiPatchEntry,
  RobloxLocalizationTablesApiEntryIdentifierWithTranslation,
  RobloxLocalizationTablesApiGetTableEntriesTranslationFeedbackResponse,
  V1LocalizationTableTablesTableIdEntriesTranslationFeedbackPostRequest,
  RobloxLocalizationTablesApiEntryTranslationFeedbackReasonsEnum,
  V1AutolocalizationGamesGameIdSettingsPatchRequest,
  AutolocalizationApi,
  V1AutolocalizationGamesGameIdAutolocalizationtablePostRequest,
  RobloxLocalizationTablesApiGameAutolocalizationInformationResponse,
} from '@rbx/clients/localizationtables';
import { getBEDEV1ServiceBasePath } from './utils';

export { RobloxLocalizationTablesApiCursorEntryIdentifierSortOrderEnum as TranslationHistorySortOrder };

type ModifyEntryRequest = V1LocalizationTableTablesTableIdPatchRequest;
type TranslationEntryRequest = V1LocalizationTableTablesTableIdEntriesGetRequest;
type TranslationHistoryRequest =
  V1LocalizationTableTablesTableIdEntriesTranslationHistoryPostRequest;
type GetTableEntryCountRequest = V1LocalizationTableTablesTableIdEntryCountGetRequest;
type ModifyEntryResponse = RobloxLocalizationTablesApiUpdateTableContentsResponse;
type GetTableEntryCountResponse = RobloxLocalizationTablesApiGetTableEntryCountResponse;
type GetTranslationFeedbackRequest =
  V1LocalizationTableTablesTableIdEntriesTranslationFeedbackPostRequest;

export type autoLocalizationTableRequest =
  V1AutolocalizationGamesGameIdAutolocalizationtablePostRequest;
export type autoLocalizationTableResponse =
  RobloxLocalizationTablesApiGameAutolocalizationInformationResponse;
export type TranslationEntryResponse = RobloxLocalizationTablesApiGetTableEntriesPagedResponse;
export type EntryTranslation = RobloxLocalizationTablesApiPatchTranslation;
export type GameLocation = RobloxInGameContentTablesClientGameLocation;
export type EntryIdentifier = RobloxLocalizationTablesApiEntryIdentifier;
export type EntryIdentifierWithTranslations =
  RobloxLocalizationTablesApiEntryIdentifierWithTranslation;
export type TranslationHistoryResponse = RobloxLocalizationTablesApiTranslationHistory[];
export type BatchTranslationHistoriesResponse =
  RobloxLocalizationTablesApiEntryTranslationHistoryPaged[];
export type TranslationEntryTable = RobloxLocalizationTablesApiEntry[];
export type ModifiedEntriesResponse = RobloxLocalizationTablesApiModifiedEntry[];
export type AutoScrapeCleanupRequest =
  V1AutoLocalizationTableGamesGameIdAutoScrapeCleanupRequestPostRequest;
export type PatchEntry = RobloxLocalizationTablesApiPatchEntry;
export type FailedModifiedEntry = RobloxLocalizationTablesApiFailedEntry;
export type GetTranslationFeedbackResponse =
  RobloxLocalizationTablesApiGetTableEntriesTranslationFeedbackResponse;
export type AutolocalizationSettingsRequest = V1AutolocalizationGamesGameIdSettingsPatchRequest;

export { RobloxLocalizationTablesApiEntryTranslationFeedbackReasonsEnum as FeedbackReasonType };
export { RobloxLocalizationTablesApiTranslatorAgentTypeEnum as ChangeAgentType };

export class LocalizationTableClient {
  private localizationTableApi: LocalizationTableApi;

  private autoLocalizationTableApi: AutoLocalizationTableApi;

  private autolocalizationApi: AutolocalizationApi;

  constructor(basePath: string = getBEDEV1ServiceBasePath('localizationtables')) {
    const configuration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });
    this.localizationTableApi = new LocalizationTableApi(configuration);
    this.autoLocalizationTableApi = new AutoLocalizationTableApi(configuration);
    this.autolocalizationApi = new AutolocalizationApi(configuration);
  }

  async getTranslationEntries(request: TranslationEntryRequest): Promise<TranslationEntryResponse> {
    return this.localizationTableApi.v1LocalizationTableTablesTableIdEntriesGet(request);
  }

  async getTranslationHistory(
    request: TranslationHistoryRequest,
  ): Promise<TranslationHistoryResponse> {
    const response =
      await this.localizationTableApi.v1LocalizationTableTablesTableIdEntriesTranslationHistoryPost(
        request,
      );
    if (Array.isArray(response.failedEntries) && response.failedEntries?.length > 0) {
      throw new Error('Failed to fetch translation history');
    }
    return response.entries?.[0].history ?? [];
  }

  async getBatchTranslationHistories(
    request: TranslationHistoryRequest,
  ): Promise<BatchTranslationHistoriesResponse> {
    const response =
      await this.localizationTableApi.v1LocalizationTableTablesTableIdEntriesTranslationHistoryPost(
        request,
      );
    if (Array.isArray(response.failedEntries) && response.failedEntries?.length > 0) {
      throw new Error('Failed to fetch translation history');
    }
    return response.entries ?? [];
  }

  async modifyEntry(request: ModifyEntryRequest): Promise<ModifyEntryResponse> {
    return this.localizationTableApi.v1LocalizationTableTablesTableIdPatch(request);
  }

  async getAutoScrapeCleanup(request: AutoScrapeCleanupRequest): Promise<unknown> {
    return this.autoLocalizationTableApi.v1AutoLocalizationTableGamesGameIdAutoScrapeCleanupRequestPostRaw(
      request,
    );
  }

  async getTableEntriesCount(
    request: GetTableEntryCountRequest,
  ): Promise<GetTableEntryCountResponse> {
    return this.localizationTableApi.v1LocalizationTableTablesTableIdEntryCountGet(request);
  }

  async getTranslationFeedback(
    request: GetTranslationFeedbackRequest,
  ): Promise<GetTranslationFeedbackResponse> {
    return this.localizationTableApi.v1LocalizationTableTablesTableIdEntriesTranslationFeedbackPost(
      request,
    );
  }

  async patchAutolocalizationSettings(request: AutolocalizationSettingsRequest) {
    return this.autolocalizationApi.v1AutolocalizationGamesGameIdSettingsPatchRaw(request);
  }

  async getAutoLocalizationTable(
    request: autoLocalizationTableRequest,
  ): Promise<autoLocalizationTableResponse> {
    return this.autolocalizationApi.v1AutolocalizationGamesGameIdAutolocalizationtablePost(request);
  }
}

const localizationTableClient = new LocalizationTableClient();

export enum AutoScrapeCleanupRequestOptions {
  ONEDAY = 'P1D',
  THREEDAYS = 'P3D',
  SEVENDAYS = 'P7D',
  THIRTYDAYS = 'P30D',
}

export default localizationTableClient;
