import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  TranslationAnalyticsApi,
  RobloxGameInternationalizationApiTranslationAnalyticsMetadataResponse,
  V1TranslationAnalyticsGamesGameIdRequestTranslationAnalyticsReportPostRequest,
  RobloxGameInternationalizationApiRequestTranslationAnalyticsReportResponse,
  V1TranslationAnalyticsGamesGameIdDownloadTranslationAnalyticsReportGetRequest,
  AutomaticTranslationApi,
  SourceLanguageApi,
  SupportedLanguagesApi as SupportedLanguagesApiV1,
  GameLocalizationStatusApi,
  GamePassApi,
  BadgeApi,
  DeveloperProductApi,
  NameDescriptionApi,
  GameIconApi,
  GameThumbnailsApi,
  V1AutomaticTranslationGamesGameIdFeatureStatusGetRequest,
  V1AutomaticTranslationGamesGameIdQuotaGetRequest,
  V1SourceLanguageGamesGameIdGetRequest,
  V1AutomaticTranslationLanguagesLanguageCodeTargetLanguagesGetRequest,
  V1SupportedLanguagesGamesGameIdAutomaticTranslationStatusGetRequest,
  V1SupportedLanguagesGamesGameIdLanguagesLanguageCodeAutomaticTranslationStatusPatchRequest,
  V1SupportedLanguagesGamesGameIdPatchRequest,
  V1SupportedLanguagesGamesGameIdUniverseDisplayInfoAutomaticTranslationSettingsGetRequest,
  RobloxWebWebAPIModelsApiArrayResponseRobloxGameInternationalizationApiUniverseDisplayInfoAutomaticTranslationSettings,
  V1SupportedLanguagesGamesGameIdLanguagesLanguageCodeUniverseDisplayInfoAutomaticTranslationSettingsPatchRequest,
  RobloxGameInternationalizationApiUpdateUniverseDisplayInfoAutomaticTranslationSettingsResponse,
  V1SourceLanguageGamesGameIdPatchRequest,
  V1GameLocalizationStatusGameIdTranslationCountsGetRequest,
  RobloxGameInternationalizationApiGetAutomaticTranslationFeatureStatusForGameResponse,
  RobloxGameInternationalizationApiGetAutomaticTranslationQuotaForGameResponse,
  RobloxGameInternationalizationApiLanguage,
  RobloxGameInternationalizationApiGetAllowedAutomaticTranslationStatusForLanguagesResponse,
  RobloxWebWebAPIModelsApiArrayResponseRobloxGameInternationalizationApiLanguageOrLocaleSettings,
  RobloxGameInternationalizationApiEditAutomaticTranslationStatusForGameAndLanguageResponse,
  RobloxGameInternationalizationApiGetTranslationCountsForGameResponse,
  RobloxGameInternationalizationApiTranslationCountLanguageOrLocaleResponse,
  V1GamePassesGamePassIdNameDescriptionGetRequest,
  V1BadgesBadgeIdNameDescriptionGetRequest,
  V1DeveloperProductsDeveloperProductIdNameDescriptionGetRequest,
  V1GamePassesGamePassIdNameLanguageCodesLanguageCodePatchRequest,
  RobloxGameInternationalizationApiUpdateGamePassNameResponse,
  V1GamePassesGamePassIdDescriptionLanguageCodesLanguageCodePatchRequest,
  RobloxGameInternationalizationApiUpdateGamePassDescriptionResponse,
  V1BadgesBadgeIdNameLanguageCodesLanguageCodePatchRequest,
  RobloxGameInternationalizationApiUpdateBadgeNameResponse,
  V1BadgesBadgeIdDescriptionLanguageCodesLanguageCodePatchRequest,
  RobloxGameInternationalizationApiUpdateBadgeDescriptionResponse,
  V1DeveloperProductsDeveloperProductIdNameLanguageCodesLanguageCodePatchRequest,
  RobloxGameInternationalizationApiUpdateDeveloperProductNameResponse,
  V1DeveloperProductsDeveloperProductIdDescriptionLanguageCodesLanguageCodePatchRequest,
  RobloxGameInternationalizationApiUpdateDeveloperProductDescriptionResponse,
  V1GamePassesGamePassIdIconsGetRequest,
  V1BadgesBadgeIdIconsGetRequest,
  V1DeveloperProductsDeveloperProductIdIconsGetRequest,
  V1GamePassesGamePassIdIconsLanguageCodesLanguageCodePostRequest,
  V1GamePassesGamePassIdIconsLanguageCodesLanguageCodeDeleteRequest,
  V1BadgesBadgeIdIconsLanguageCodesLanguageCodePostRequest,
  V1BadgesBadgeIdIconsLanguageCodesLanguageCodeDeleteRequest,
  V1DeveloperProductsDeveloperProductIdIconsLanguageCodesLanguageCodePostRequest,
  V1DeveloperProductsDeveloperProductIdIconsLanguageCodesLanguageCodeDeleteRequest,
  V1NameDescriptionGamesGameIdGetRequest,
  RobloxWebWebAPIModelsApiArrayResponseRobloxGameInternationalizationApiNameDescription,
  V1GameIconGamesGameIdGetRequest,
  RobloxWebWebAPIModelsApiArrayResponseRobloxGameInternationalizationApiGetGameIconResponse,
  V1GameThumbnailsGamesGameIdImagesGetRequest,
  RobloxWebWebAPIModelsApiArrayResponseRobloxGameInternationalizationApiGetGameThumbnailsResponse,
  V1NameDescriptionGamesGameIdPatchRequest,
  RobloxGameInternationalizationApiUpdateNameDescriptionsResponse,
  V1GameIconGamesGameIdLanguageCodesLanguageCodePostRequest,
  V1GameIconGamesGameIdLanguageCodesLanguageCodeDeleteRequest,
  V1GameThumbnailsGamesGameIdLanguageCodesLanguageCodeImagePostRequest,
  RobloxGameInternationalizationApiModelsResponseUploadImageForGameThumbnailResponse,
  V1GameThumbnailsGamesGameIdLanguageCodesLanguageCodeAltTextPostRequest,
  V1GameThumbnailsGamesGameIdLanguageCodesLanguageCodeImagesImageIdDeleteRequest,
  V1GameThumbnailsGamesGameIdLanguageCodesLanguageCodeImagesOrderPostRequest,
  RobloxGameInternationalizationApiNameDescription,
  RobloxGameInternationalizationApiGetGameIconResponse,
  RobloxGameInternationalizationApiGetGameThumbnailsResponse,
  RobloxGameInternationalizationApiGetBadgeIconResponse,
  RobloxGameInternationalizationApiGetDeveloperProductIconResponse,
  RobloxGameInternationalizationApiGetGamePassIconResponse,
  V1NameDescriptionGamesTranslationHistoryPostRequest,
  RobloxGameInternationalizationApiGetNameDescriptionHistoryResponse,
  RobloxGameInternationalizationApiTranslationHistory,
  V1SourceLanguageGamesGameIdLanguageWithLocalesGetRequest,
  RobloxGameInternationalizationApiSourceLanguageWithLocales,
} from '@rbx/clients/gameinternationalization/v1';
import {
  SupportedLanguagesV2Api,
  V2SupportedLanguagesGamesGameIdGetRequest,
  RobloxWebWebAPIModelsApiArrayResponseRobloxGameInternationalizationApiLanguageWithLocales,
  RobloxGameInternationalizationApiLanguageWithLocales,
  RobloxLocalizationClientSupportedLocale,
} from '@rbx/clients/gameinternationalization/v2';
import { getBEDEV1ServiceBasePath } from './utils';

export {
  RobloxGameInternationalizationApiRequestTranslationAnalyticsReportRequestReportTypeEnum as RequestReportType,
  V1TranslationAnalyticsGamesGameIdDownloadTranslationAnalyticsReportGetReportTypeEnum as DownloadReportType,
  RobloxGameInternationalizationApiRequestTranslationAnalyticsReportResponseReportGenerationStatusEnum as ReportStatus,
  RobloxGameInternationalizationApiGetGameIconResponseStateEnum as IconImageStatus,
  RobloxGameInternationalizationApiMediaAssetResponseStateEnum as ThumbnailImageStatus,
  RobloxGameInternationalizationApiGetGamePassIconResponseStateEnum as GamePassImageStatus,
  RobloxGameInternationalizationApiGetBadgeIconResponseStateEnum as BadgeImageStatus,
  RobloxGameInternationalizationApiGetDeveloperProductIconResponseStateEnum as DeveloperProductImageStatus,
} from '@rbx/clients/gameinternationalization/v1';

const basePath = getBEDEV1ServiceBasePath('gameinternationalization');
const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const automaticTranslationApi = new AutomaticTranslationApi(configuration);
const translationAnalyticsApi = new TranslationAnalyticsApi(configuration);
const supportedLanguagesV2Api = new SupportedLanguagesV2Api(configuration);
const supportedLanguagesApiV1 = new SupportedLanguagesApiV1(configuration);
const sourceLanguageApi = new SourceLanguageApi(configuration);
const gameLocalizationStatusApi = new GameLocalizationStatusApi(configuration);
const gamePassApi = new GamePassApi(configuration);
const badgeApi = new BadgeApi(configuration);
const developerProductApi = new DeveloperProductApi(configuration);
const nameDescriptionApi = new NameDescriptionApi(configuration);
const gameIconApi = new GameIconApi(configuration);
const gameThumbnailsApi = new GameThumbnailsApi(configuration);

export type TranslationQuotaRequest = V1AutomaticTranslationGamesGameIdQuotaGetRequest;
export type TranslationQuotaResponse =
  RobloxGameInternationalizationApiGetAutomaticTranslationQuotaForGameResponse;
export type TranslationFeatureStatusRequest =
  V1AutomaticTranslationGamesGameIdFeatureStatusGetRequest;
export type TranslationFeatureStatusResponse =
  RobloxGameInternationalizationApiGetAutomaticTranslationFeatureStatusForGameResponse;
export type TranslationAnalyticsMetadataResponse =
  RobloxGameInternationalizationApiTranslationAnalyticsMetadataResponse;
export type TranslationAnalyticsReportRequest =
  V1TranslationAnalyticsGamesGameIdRequestTranslationAnalyticsReportPostRequest;
export type TranslationAnalyticsReportResponse =
  RobloxGameInternationalizationApiRequestTranslationAnalyticsReportResponse;
export type TranslationAnalyticsReportDownloadRequest =
  V1TranslationAnalyticsGamesGameIdDownloadTranslationAnalyticsReportGetRequest;
export type SupportedLanguagesRequest = V2SupportedLanguagesGamesGameIdGetRequest;
export type SupportedLanguagesResponse =
  RobloxWebWebAPIModelsApiArrayResponseRobloxGameInternationalizationApiLanguageWithLocales;
export type SupportedLanguagesDataResponse = RobloxGameInternationalizationApiLanguageWithLocales;
export type SourceLanguageWithLocaleResponse =
  RobloxGameInternationalizationApiSourceLanguageWithLocales;
export type SupportedLanguagesDataResponseSubLocale = RobloxLocalizationClientSupportedLocale;
export type SourceLanguageRequest = V1SourceLanguageGamesGameIdGetRequest;
export type SourceLanguageWithLocalesRequest =
  V1SourceLanguageGamesGameIdLanguageWithLocalesGetRequest;
export type SourceLanguageResponse = RobloxGameInternationalizationApiLanguage;
export type TargetLanguagesRequest =
  V1AutomaticTranslationLanguagesLanguageCodeTargetLanguagesGetRequest;
export type TargetLanguagesResponse =
  RobloxGameInternationalizationApiGetAllowedAutomaticTranslationStatusForLanguagesResponse;
export type AutoTranslationStatusRequest =
  V1SupportedLanguagesGamesGameIdAutomaticTranslationStatusGetRequest;
export type AutoTranslationStatusResponse =
  RobloxWebWebAPIModelsApiArrayResponseRobloxGameInternationalizationApiLanguageOrLocaleSettings;
export type AutoTranslationStatusPatchRequest =
  V1SupportedLanguagesGamesGameIdLanguagesLanguageCodeAutomaticTranslationStatusPatchRequest;
export type AutoTranslationStatusPatchResponse =
  RobloxGameInternationalizationApiEditAutomaticTranslationStatusForGameAndLanguageResponse;
export type DisplayInfoAutoTranslationSettingsGetRequest =
  V1SupportedLanguagesGamesGameIdUniverseDisplayInfoAutomaticTranslationSettingsGetRequest;
export type DisplayInfoAutoTranslationSettingsGetResponse =
  RobloxWebWebAPIModelsApiArrayResponseRobloxGameInternationalizationApiUniverseDisplayInfoAutomaticTranslationSettings;
export type DisplayInfoAutoTranslationSettingsPatchRequest =
  V1SupportedLanguagesGamesGameIdLanguagesLanguageCodeUniverseDisplayInfoAutomaticTranslationSettingsPatchRequest;
export type DisplayInfoAutoTranslationSettingsPatchResponse =
  RobloxGameInternationalizationApiUpdateUniverseDisplayInfoAutomaticTranslationSettingsResponse;
export type SupportedLanguagePatchRequest = V1SupportedLanguagesGamesGameIdPatchRequest;
export type SourceLanguagePatchRequest = V1SourceLanguageGamesGameIdPatchRequest;
export type TranslationCountsRequest = V1GameLocalizationStatusGameIdTranslationCountsGetRequest;
export type TranslationCountsResponse =
  RobloxGameInternationalizationApiGetTranslationCountsForGameResponse;
export type TransaltionCountsDataResponse =
  RobloxGameInternationalizationApiTranslationCountLanguageOrLocaleResponse;
export type GamePassNameAndDescriptionRequest = V1GamePassesGamePassIdNameDescriptionGetRequest;
export type BadgeNameAndDescriptionRequest = V1BadgesBadgeIdNameDescriptionGetRequest;
export type DeveloperProductNameAndDescriptionRequest =
  V1DeveloperProductsDeveloperProductIdNameDescriptionGetRequest;
export type ProductNameAndDescriptionResponse = {
  data: Array<Required<RobloxGameInternationalizationApiNameDescription>>;
};
export type UpdateGamePassNameTranslationRequest =
  V1GamePassesGamePassIdNameLanguageCodesLanguageCodePatchRequest;
export type UpdateGamePassNameTranslationResponse =
  RobloxGameInternationalizationApiUpdateGamePassNameResponse;
export type UpdateGamePassDescriptionTranslationRequest =
  V1GamePassesGamePassIdDescriptionLanguageCodesLanguageCodePatchRequest;
export type UpdateGamePassDescriptionTranslationResponse =
  RobloxGameInternationalizationApiUpdateGamePassDescriptionResponse;
export type UpdateBadgeNameTranslationRequest =
  V1BadgesBadgeIdNameLanguageCodesLanguageCodePatchRequest;
export type UpdateBadgeNameTranslationResponse =
  RobloxGameInternationalizationApiUpdateBadgeNameResponse;
export type UpdateBadgeDescriptionTranslationRequest =
  V1BadgesBadgeIdDescriptionLanguageCodesLanguageCodePatchRequest;
export type UpdateBadgeDescriptionTranslationResponse =
  RobloxGameInternationalizationApiUpdateBadgeDescriptionResponse;
export type UpdateDeveloperProductNameTranslationRequest =
  V1DeveloperProductsDeveloperProductIdNameLanguageCodesLanguageCodePatchRequest;
export type UpdateDeveloperProductNameTranslationResponse =
  RobloxGameInternationalizationApiUpdateDeveloperProductNameResponse;
export type UpdateDeveloperProductDescriptionTranslationRequest =
  V1DeveloperProductsDeveloperProductIdDescriptionLanguageCodesLanguageCodePatchRequest;
export type UpdateDeveloperProductDescriptionTranslationResponse =
  RobloxGameInternationalizationApiUpdateDeveloperProductDescriptionResponse;
export type GamePassIconRequest = V1GamePassesGamePassIdIconsGetRequest;
export type GamePassIconResponse = {
  data?: Array<Required<RobloxGameInternationalizationApiGetGamePassIconResponse>>;
};
export type BadgeIconRequest = V1BadgesBadgeIdIconsGetRequest;
export type BadgeIconResponse = {
  data?: Array<Required<RobloxGameInternationalizationApiGetBadgeIconResponse>>;
};
export type DeveloperProductIconRequest = V1DeveloperProductsDeveloperProductIdIconsGetRequest;
export type DeveloperProductIconResponse = {
  data?: Array<Required<RobloxGameInternationalizationApiGetDeveloperProductIconResponse>>;
};
export type UpdateGamePassIconRequest =
  V1GamePassesGamePassIdIconsLanguageCodesLanguageCodePostRequest;
export type DeleteGamePassIconRequest =
  V1GamePassesGamePassIdIconsLanguageCodesLanguageCodeDeleteRequest;
export type UpdateBadgeIconRequest = V1BadgesBadgeIdIconsLanguageCodesLanguageCodePostRequest;
export type DeleteBadgeIconRequest = V1BadgesBadgeIdIconsLanguageCodesLanguageCodeDeleteRequest;
export type UpdateDeveloperProductIconRequest =
  V1DeveloperProductsDeveloperProductIdIconsLanguageCodesLanguageCodePostRequest;
export type DeleteDeveloperProductIconRequest =
  V1DeveloperProductsDeveloperProductIdIconsLanguageCodesLanguageCodeDeleteRequest;
export type GameNameAndDescriptionRequest = V1NameDescriptionGamesGameIdGetRequest;
export type GameNameAndDescriptionResponse =
  RobloxWebWebAPIModelsApiArrayResponseRobloxGameInternationalizationApiNameDescription;
export type GameIconRequest = V1GameIconGamesGameIdGetRequest;
export type GameIconResponse =
  RobloxWebWebAPIModelsApiArrayResponseRobloxGameInternationalizationApiGetGameIconResponse;
export type GameThumbnailsRequest = V1GameThumbnailsGamesGameIdImagesGetRequest;
export type GameThumbnailsResponse =
  RobloxWebWebAPIModelsApiArrayResponseRobloxGameInternationalizationApiGetGameThumbnailsResponse;
export type UpdateGameNameAndDescriptionRequest = V1NameDescriptionGamesGameIdPatchRequest;
export type UpdateGameNameAndDescriptionResponse =
  RobloxGameInternationalizationApiUpdateNameDescriptionsResponse;
export type UpdateGameIconRequest = V1GameIconGamesGameIdLanguageCodesLanguageCodePostRequest;
export type DeleteGameIconRequest = V1GameIconGamesGameIdLanguageCodesLanguageCodeDeleteRequest;
export type UpdateGameThumbnailsRequest =
  V1GameThumbnailsGamesGameIdLanguageCodesLanguageCodeImagePostRequest;
export type UpdateGameThumbnailsResponse =
  RobloxGameInternationalizationApiModelsResponseUploadImageForGameThumbnailResponse;
export type UpdateGameThumbnailAltTextRequest =
  V1GameThumbnailsGamesGameIdLanguageCodesLanguageCodeAltTextPostRequest;
export type DeleteGameThumbnailsRequest =
  V1GameThumbnailsGamesGameIdLanguageCodesLanguageCodeImagesImageIdDeleteRequest;
export type OrderThumbnailImagesRequest =
  V1GameThumbnailsGamesGameIdLanguageCodesLanguageCodeImagesOrderPostRequest;
export type GameNameAndDescriptionData = RobloxGameInternationalizationApiNameDescription;
export type GameIconData = RobloxGameInternationalizationApiGetGameIconResponse;
export type GameThumbnailsData = RobloxGameInternationalizationApiGetGameThumbnailsResponse;

export type NameDescriptionTranslationHistoryRequest =
  V1NameDescriptionGamesTranslationHistoryPostRequest;
export type NameDescriptionTranslationHistoryResponse =
  RobloxGameInternationalizationApiGetNameDescriptionHistoryResponse;
export type GameContentTranslationHistory = RobloxGameInternationalizationApiTranslationHistory[];

export interface GameInternationalizationClient {
  getTranslationQuota(request: TranslationQuotaRequest): Promise<TranslationQuotaResponse>;
  getTranslationFeatureStatus(
    request: TranslationFeatureStatusRequest,
  ): Promise<TranslationFeatureStatusResponse>;
  getTranslationAnalyticsMetadata(): Promise<TranslationAnalyticsMetadataResponse>;
  requestTranslationAnalyticsReport(
    request: TranslationAnalyticsReportRequest,
  ): Promise<TranslationAnalyticsReportResponse>;
  downloadTranslationAnalyticsReport(
    request: TranslationAnalyticsReportDownloadRequest,
  ): Promise<Blob>;
  getSupportedLanguages(request: SupportedLanguagesRequest): Promise<SupportedLanguagesResponse>;
  getSourceLanguage(request: SourceLanguageRequest): Promise<SourceLanguageResponse>;
  getSourceLanguageWithLocales(
    request: SourceLanguageWithLocalesRequest,
  ): Promise<SourceLanguageWithLocaleResponse>;
  getTargetLanguages(request: TargetLanguagesRequest): Promise<TargetLanguagesResponse>;
  getAutoTranslationStatus(
    request: AutoTranslationStatusRequest,
  ): Promise<AutoTranslationStatusResponse>;
  patchAutoTranslationStatus(
    request: AutoTranslationStatusPatchRequest,
  ): Promise<AutoTranslationStatusPatchResponse>;
  getDisplayInfoAutomaticTranslationSettings(
    request: DisplayInfoAutoTranslationSettingsGetRequest,
  ): Promise<DisplayInfoAutoTranslationSettingsGetResponse>;
  patchDisplayInfoAutomaticTranslationSettings(
    request: DisplayInfoAutoTranslationSettingsPatchRequest,
  ): Promise<DisplayInfoAutoTranslationSettingsPatchResponse>;
  patchSupportedLanguage(request: SupportedLanguagePatchRequest): Promise<void>;
  patchSourceLanguage(request: SourceLanguagePatchRequest): Promise<void>;
  getTranslationCounts(request: TranslationCountsRequest): Promise<TranslationCountsResponse>;
  getGamePassNameAndDescription(
    request: GamePassNameAndDescriptionRequest,
  ): Promise<ProductNameAndDescriptionResponse>;
  getBadgeNameAndDescription(
    request: V1BadgesBadgeIdNameDescriptionGetRequest,
  ): Promise<ProductNameAndDescriptionResponse>;
  getDeveloperProductNameAndDescription(
    request: DeveloperProductNameAndDescriptionRequest,
  ): Promise<ProductNameAndDescriptionResponse>;
  updateGamePassNameTranslation(
    request: UpdateGamePassNameTranslationRequest,
  ): Promise<UpdateGamePassNameTranslationResponse>;
  updateGamePassDescriptionTranslation(
    request: UpdateGamePassDescriptionTranslationRequest,
  ): Promise<UpdateGamePassDescriptionTranslationResponse>;
  updateBadgeNameTranslation(
    request: UpdateBadgeNameTranslationRequest,
  ): Promise<UpdateBadgeNameTranslationResponse>;
  updateBadgeDescriptionTranslation(
    request: UpdateBadgeDescriptionTranslationRequest,
  ): Promise<UpdateBadgeDescriptionTranslationResponse>;
  updateDeveloperProductNameTranslation(
    request: UpdateDeveloperProductNameTranslationRequest,
  ): Promise<UpdateDeveloperProductNameTranslationResponse>;
  updateDeveloperProductDescriptionTranslation(
    request: UpdateDeveloperProductDescriptionTranslationRequest,
  ): Promise<UpdateDeveloperProductDescriptionTranslationResponse>;
  getGamePassIcon(request: GamePassIconRequest): Promise<GamePassIconResponse>;
  getBadgeIcon(request: BadgeIconRequest): Promise<BadgeIconResponse>;
  getDeveloperProductIcon(
    request: DeveloperProductIconRequest,
  ): Promise<DeveloperProductIconResponse>;
  updateGamePassIcon(request: UpdateGamePassIconRequest): Promise<void>;
  deleteGamePassIcon(request: DeleteGamePassIconRequest): Promise<void>;
  updateBadgeIcon(request: UpdateBadgeIconRequest): Promise<void>;
  deleteBadgeIcon(request: DeleteBadgeIconRequest): Promise<void>;
  updateDeveloperProductIcon(request: UpdateDeveloperProductIconRequest): Promise<void>;
  deleteDeveloperProductIcon(request: DeleteDeveloperProductIconRequest): Promise<void>;
  getGameNameAndDescription(
    request: GameNameAndDescriptionRequest,
  ): Promise<GameNameAndDescriptionResponse>;
  getGameIcon(request: GameIconRequest): Promise<GameIconResponse>;
  getGameThumbnails(request: GameThumbnailsRequest): Promise<GameThumbnailsResponse>;
  updateGameNameAndDescription(
    request: UpdateGameNameAndDescriptionRequest,
  ): Promise<UpdateGameNameAndDescriptionResponse>;
  updateGameIcon(request: UpdateGameIconRequest): Promise<void>;
  deleteGameIcon(request: DeleteGameIconRequest): Promise<void>;
  updateGameThumbnail(request: UpdateGameThumbnailsRequest): Promise<UpdateGameThumbnailsResponse>;
  updateGameThumbnailAltText(request: UpdateGameThumbnailAltTextRequest): Promise<string>;
  deleteGameThumbnail(request: DeleteGameThumbnailsRequest): Promise<void>;
  orderGameThumbnails(request: OrderThumbnailImagesRequest): Promise<void>;
  getGameContentTranslationHistory(
    request: NameDescriptionTranslationHistoryRequest,
  ): Promise<NameDescriptionTranslationHistoryResponse>;
}

const gameInternationalizationClient: GameInternationalizationClient = {
  async getTranslationQuota(request: TranslationQuotaRequest) {
    return automaticTranslationApi.v1AutomaticTranslationGamesGameIdQuotaGet(request);
  },
  async getTranslationFeatureStatus(request: TranslationFeatureStatusRequest) {
    return automaticTranslationApi.v1AutomaticTranslationGamesGameIdFeatureStatusGet(request);
  },
  async getTranslationAnalyticsMetadata() {
    return translationAnalyticsApi.v1TranslationAnalyticsMetadataGet();
  },
  async requestTranslationAnalyticsReport(request) {
    return translationAnalyticsApi.v1TranslationAnalyticsGamesGameIdRequestTranslationAnalyticsReportPost(
      request,
    );
  },
  async downloadTranslationAnalyticsReport(request) {
    return translationAnalyticsApi.v1TranslationAnalyticsGamesGameIdDownloadTranslationAnalyticsReportGet(
      request,
    );
  },
  async getSupportedLanguages(request: SupportedLanguagesRequest) {
    return supportedLanguagesV2Api.v2SupportedLanguagesGamesGameIdGet(request);
  },
  async getSourceLanguage(request: SourceLanguageRequest) {
    return sourceLanguageApi.v1SourceLanguageGamesGameIdGet(request);
  },
  async getSourceLanguageWithLocales(request: SourceLanguageWithLocalesRequest) {
    return sourceLanguageApi.v1SourceLanguageGamesGameIdLanguageWithLocalesGet(request);
  },
  async getTargetLanguages(request: TargetLanguagesRequest) {
    return automaticTranslationApi.v1AutomaticTranslationLanguagesLanguageCodeTargetLanguagesGet(
      request,
    );
  },
  async getAutoTranslationStatus(request: AutoTranslationStatusRequest) {
    return supportedLanguagesApiV1.v1SupportedLanguagesGamesGameIdAutomaticTranslationStatusGet(
      request,
    );
  },
  async patchAutoTranslationStatus(request: AutoTranslationStatusPatchRequest) {
    return supportedLanguagesApiV1.v1SupportedLanguagesGamesGameIdLanguagesLanguageCodeAutomaticTranslationStatusPatch(
      request,
    );
  },
  async getDisplayInfoAutomaticTranslationSettings(
    request: DisplayInfoAutoTranslationSettingsGetRequest,
  ) {
    return supportedLanguagesApiV1.v1SupportedLanguagesGamesGameIdUniverseDisplayInfoAutomaticTranslationSettingsGet(
      request,
    );
  },
  async patchDisplayInfoAutomaticTranslationSettings(
    request: DisplayInfoAutoTranslationSettingsPatchRequest,
  ) {
    return supportedLanguagesApiV1.v1SupportedLanguagesGamesGameIdLanguagesLanguageCodeUniverseDisplayInfoAutomaticTranslationSettingsPatch(
      request,
    );
  },
  async patchSupportedLanguage(request: SupportedLanguagePatchRequest) {
    await supportedLanguagesApiV1.v1SupportedLanguagesGamesGameIdPatch(request);
  },
  async patchSourceLanguage(request: SourceLanguagePatchRequest) {
    await sourceLanguageApi.v1SourceLanguageGamesGameIdPatch(request);
  },
  async getTranslationCounts(request: TranslationCountsRequest) {
    return gameLocalizationStatusApi.v1GameLocalizationStatusGameIdTranslationCountsGet(request);
  },
  async getGamePassNameAndDescription(request: GamePassNameAndDescriptionRequest) {
    return (await gamePassApi.v1GamePassesGamePassIdNameDescriptionGet(
      request,
    )) as ProductNameAndDescriptionResponse;
  },
  async getBadgeNameAndDescription(request: V1BadgesBadgeIdNameDescriptionGetRequest) {
    return (await badgeApi.v1BadgesBadgeIdNameDescriptionGet(
      request,
    )) as ProductNameAndDescriptionResponse;
  },
  async getDeveloperProductNameAndDescription(request: DeveloperProductNameAndDescriptionRequest) {
    return (await developerProductApi.v1DeveloperProductsDeveloperProductIdNameDescriptionGet(
      request,
    )) as ProductNameAndDescriptionResponse;
  },
  async updateGamePassNameTranslation(request: UpdateGamePassNameTranslationRequest) {
    return gamePassApi.v1GamePassesGamePassIdNameLanguageCodesLanguageCodePatch(request);
  },
  async updateGamePassDescriptionTranslation(request: UpdateGamePassDescriptionTranslationRequest) {
    return gamePassApi.v1GamePassesGamePassIdDescriptionLanguageCodesLanguageCodePatch(request);
  },
  async updateBadgeNameTranslation(request: UpdateBadgeNameTranslationRequest) {
    return badgeApi.v1BadgesBadgeIdNameLanguageCodesLanguageCodePatch(request);
  },
  async updateBadgeDescriptionTranslation(request: UpdateBadgeDescriptionTranslationRequest) {
    return badgeApi.v1BadgesBadgeIdDescriptionLanguageCodesLanguageCodePatch(request);
  },
  async updateDeveloperProductNameTranslation(
    request: UpdateDeveloperProductNameTranslationRequest,
  ) {
    return developerProductApi.v1DeveloperProductsDeveloperProductIdNameLanguageCodesLanguageCodePatch(
      request,
    );
  },
  async updateDeveloperProductDescriptionTranslation(
    request: UpdateDeveloperProductDescriptionTranslationRequest,
  ) {
    return developerProductApi.v1DeveloperProductsDeveloperProductIdDescriptionLanguageCodesLanguageCodePatch(
      request,
    );
  },
  async getGamePassIcon(request: GamePassIconRequest) {
    return (await gamePassApi.v1GamePassesGamePassIdIconsGet(request)) as GamePassIconResponse;
  },
  async getBadgeIcon(request: BadgeIconRequest) {
    return (await badgeApi.v1BadgesBadgeIdIconsGet(request)) as BadgeIconResponse;
  },
  async getDeveloperProductIcon(request: DeveloperProductIconRequest) {
    return (await developerProductApi.v1DeveloperProductsDeveloperProductIdIconsGet(
      request,
    )) as DeveloperProductIconResponse;
  },
  async updateGamePassIcon(request: UpdateGamePassIconRequest) {
    await gamePassApi.v1GamePassesGamePassIdIconsLanguageCodesLanguageCodePost(request);
  },
  async deleteGamePassIcon(request: DeleteGamePassIconRequest) {
    await gamePassApi.v1GamePassesGamePassIdIconsLanguageCodesLanguageCodeDelete(request);
  },
  async updateBadgeIcon(request: UpdateBadgeIconRequest) {
    await badgeApi.v1BadgesBadgeIdIconsLanguageCodesLanguageCodePost(request);
  },
  async deleteBadgeIcon(request: DeleteBadgeIconRequest) {
    await badgeApi.v1BadgesBadgeIdIconsLanguageCodesLanguageCodeDelete(request);
  },
  async updateDeveloperProductIcon(request: UpdateDeveloperProductIconRequest) {
    await developerProductApi.v1DeveloperProductsDeveloperProductIdIconsLanguageCodesLanguageCodePost(
      request,
    );
  },
  async deleteDeveloperProductIcon(request: DeleteDeveloperProductIconRequest) {
    await developerProductApi.v1DeveloperProductsDeveloperProductIdIconsLanguageCodesLanguageCodeDelete(
      request,
    );
  },
  async getGameNameAndDescription(request: GameNameAndDescriptionRequest) {
    return nameDescriptionApi.v1NameDescriptionGamesGameIdGet(request);
  },
  async getGameIcon(request: GameIconRequest) {
    return gameIconApi.v1GameIconGamesGameIdGet(request);
  },
  async getGameThumbnails(request: GameThumbnailsRequest) {
    return gameThumbnailsApi.v1GameThumbnailsGamesGameIdImagesGet(request);
  },
  async updateGameNameAndDescription(request: UpdateGameNameAndDescriptionRequest) {
    return nameDescriptionApi.v1NameDescriptionGamesGameIdPatch(request);
  },
  async updateGameIcon(request: UpdateGameIconRequest) {
    await gameIconApi.v1GameIconGamesGameIdLanguageCodesLanguageCodePost(request);
  },
  async deleteGameIcon(request: DeleteGameIconRequest) {
    await gameIconApi.v1GameIconGamesGameIdLanguageCodesLanguageCodeDelete(request);
  },
  async updateGameThumbnail(request: UpdateGameThumbnailsRequest) {
    return gameThumbnailsApi.v1GameThumbnailsGamesGameIdLanguageCodesLanguageCodeImagePost(request);
  },
  async updateGameThumbnailAltText(request: UpdateGameThumbnailAltTextRequest) {
    return gameThumbnailsApi.v1GameThumbnailsGamesGameIdLanguageCodesLanguageCodeAltTextPost(
      request,
    );
  },
  async deleteGameThumbnail(request: DeleteGameThumbnailsRequest) {
    await gameThumbnailsApi.v1GameThumbnailsGamesGameIdLanguageCodesLanguageCodeImagesImageIdDelete(
      request,
    );
  },
  async orderGameThumbnails(request: OrderThumbnailImagesRequest) {
    await gameThumbnailsApi.v1GameThumbnailsGamesGameIdLanguageCodesLanguageCodeImagesOrderPost(
      request,
    );
  },
  async getGameContentTranslationHistory(request: NameDescriptionTranslationHistoryRequest) {
    return (await nameDescriptionApi.v1NameDescriptionGamesTranslationHistoryPost(
      request,
    )) as NameDescriptionTranslationHistoryResponse;
  },
};

export default gameInternationalizationClient;
