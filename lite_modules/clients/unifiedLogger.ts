import { UnifiedLogger } from '@rbx/unified-logger';
import { AxiosError } from 'axios';

import { GetLocalStorage, StorageKeys } from '@utils/localStorage';

export enum EventName {
  AccordionToggled = 'accordionToggled',
  AdBlockerIsOn = 'adBlockerIsOn',
  AddCreditCardFromPaymentMethodDrawer = 'addCreditCardFromPaymentMethodDrawer',
  AdsCreationFlowStep = 'adsCreationFlowStep',
  CueCompleted = 'adsCueCompleted',
  CueDismissed = 'adsCueDismissed',
  CueImpression = 'adsCueImpression',
  AdvancedTargetingDrawerClosed = 'advancedTargetingDrawerClosed',
  AdvancedTargetingDrawerOpened = 'advancedTargetingDrawerOpened',
  AiCreativeDontShowClicked = 'aiCreativeDontShowClicked',
  AiCreativeDrawerOpened = 'aiCreativeDrawerOpened',
  AiCreativeGenerateClicked = 'aiCreativeGenerateClicked',
  AiCreativeGenerateFailed = 'aiCreativeGenerateFailed',
  AiCreativeGenerateSuccess = 'aiCreativeGenerateSuccess',
  AiCreativeReportClicked = 'aiCreativeReportClicked',
  AiCreativeReportSubmitFailed = 'aiCreativeReportSubmitFailed',
  AiCreativeReportSubmitSuccess = 'aiCreativeReportSubmitSuccess',
  AiCreativeSavedToLibrary = 'aiCreativeSavedToLibrary',
  AiCreativeSavedToLibraryFailed = 'aiCreativeSavedToLibraryFailed',
  ApiEvent = 'apiEvent',
  AssetsFetched = 'assetsFetched',
  AssetUploadAPIError = 'assetUploadAPIError',
  AssetUploadAPIFailure = 'assetUploadAPIFailure',
  AssetUploadAPISuccess = 'assetUploadAPISuccess',
  AssetUploadFailed = 'assetUploadFailed',
  AssetUploadRequested = 'assetUploadRequested',
  AudienceTargetingFieldChanged = 'audienceTargetingFieldChanged',
  BannerNavigation = 'bannerNavigation',
  BudgetSelectChanged = 'budgetSelectChanged',
  BudgetTypeChanged = 'budgetTypeChanged',
  BuyAdCreditAttempted = 'buyAdCreditAttempted',
  BuyAdCreditCaptchaLaunched = 'buyAdCreditCaptchaLaunched',
  BuyAdCreditFailed = 'buyAdCreditFailed',
  BuyAdCreditSuccess = 'buyAdCreditSuccess',
  CampaignBuilderEarningsGoalShown = 'campaignBuilderEarningsGoalShown',
  CampaignBuilderFormValidationError = 'campaignBuilderFormValidationError',
  CampaignBuilderGoalSelected = 'campaignBuilderGoalSelected',
  CampaignCreativeSourceSelected = 'campaignCreativeSourceSelected',
  CampaignDetailsOpened = 'campaignDetailsOpened',
  CampaignFormCancelButtonClicked = 'campaignFormCancelButtonClicked',
  CampaignSubmitSourceBreakdown = 'campaignSubmitSourceBreakdown',
  CancelCampaign = 'cancelCampaign',
  CancelImageUpload = 'cancelImageUpload',
  ChangeSortColumn = 'changeSortColumn',
  ClaimPromotionClicked = 'claimPromotionClicked',
  CloneCampaign = 'cloneCampaign',
  CreateAdAccountInHeaderClicked = 'createAdAccountInHeaderClicked',
  CreateAdAccountPageClickAccountCreationButton = 'createAdAccountPageClickAccountCreationButton',
  CreateAdAccountPageClickCreationStart = 'createAdAccountPageClickCreationStart',
  CreateAdButtonClicked = 'createAdButtonClicked',
  CreateAdSetButtonClicked = 'createAdSetButtonClicked',
  CreateButtonDisabled = 'createButtonDisabled',
  CreateCampaignButtonClicked = 'createCampaignButtonClicked',
  CreateCampaignButtonInEducationClicked = 'createCampaignButtonInEducationClicked',
  CreateCampaignFromPaymentSettingsClicked = 'createCampaignFromPaymentSettingsClicked',
  CreateCampaignPaymentMethodDropdownOpened = 'createCampaignPaymentMethodDropdownOpened',
  CreativeLibraryAddToCampaign = 'creativeLibraryAddToCampaign',
  CreativeLibraryLoadFailed = 'creativeLibraryLoadFailed',
  CreativeLibraryOpened = 'creativeLibraryOpened',
  CreditCardSectionInPaymentMethodDrawer = 'creditCardSectionInPaymentMethodDrawer',
  CSVDownloadButtonClicked = 'csvDownloadButtonClicked',
  DateFilteringError = 'dateFilteringError',
  DateFilteringOptionClicked = 'dateFilteringOptionClicked',
  DestinationRemoved = 'destinationRemoved',
  DestinationSelected = 'destinationSelected',
  DownloadStudio = 'downloadStudio',
  DurationSelectChanged = 'durationSelectChanged',
  EditAdButtonClicked = 'editAdButtonClicked',
  EditAdSetButtonClicked = 'editAdSetButtonClicked',
  EditButtonClicked = 'editButtonClicked',
  EditCampaignButtonClicked = 'editCampaignButtonClicked',
  EditV1AdSetClicked = 'editV1AdSetClicked',
  EndDateChanged = 'endDateChanged',
  EndTimeChanged = 'endTimeChanged',
  ExperienceChanged = 'experienceChanged',
  ExperienceFilterOptionClicked = 'experienceFilterOptionClicked',
  ExperienceNoLongerEligible = 'experienceNoLongerEligible',
  FilterApplyClicked = 'filterApplyClicked',
  FilterDrawerOpened = 'filterDrawerOpened',
  ForecastEstimatorDrawerOpenedFromLandingButton = 'forecastEstimatorDrawerOpenedFromLandingButton',
  ForecastEstimatorDrawerOpenedFromNavRail = 'forecastEstimatorDrawerOpenedFromNavRail',
  ForecastEstimatorDrawerSubmitted = 'forecastEstimatorDrawerSubmitted',
  GetAdSetStatusError = 'getAdSetStatusError',
  GetAdStatusError = 'getAdStatusError',
  GetCampaignStatusError = 'getCampaignStatusError',
  GetCurrentUserError = 'getCurrentUserError',
  GroupAdAccountCreateFailed = 'groupAdAccountCreateFailed',
  GroupAdAccountCreateSuccess = 'groupAdAccountCreateSuccess',
  GroupAdAccountMissingPageLoaded = 'groupAdAccountMissingPageLoaded',
  ImageUploadClicked = 'imageUploadClicked',
  ImageUploadFailure = 'imageUploadFailure',
  ImageUploadSuccess = 'imageUploadSuccess',
  ListFilteredIdsError = 'listFilteredIdsError',
  LivePreview = 'livePreviewButtonClicked',
  LoadPageLoggedInWithAdAccount = 'loadPageLoggedInWithAdAccount',
  LoadPageLoggedInWithoutAdAccount = 'loadPageLoggedInWithoutAdAccount',
  LoadPageLoggedOut = 'loadPageLoggedOut',
  LocationAutocompleteRegionUndefinedError = 'locationAutocompleteRegionUndefinedError',
  LogIn = 'logIn',
  LogOut = 'logOut',
  ModeratedCampaignBannerCTAClicked = 'moderatedCampaignBannerCTAClicked',
  ModeratedCampaignBannerShown = 'moderatedCampaignBannerShown',
  NewUserFlowCreatePageLoaded = 'newUserFlowCreatePageLoaded',
  NewUserFlowFirstCampaignPublishClicked = 'newUserFlowFirstCampaignPublishClicked',
  NewUserFlowFirstCampaignPublishSuccess = 'newUserFlowFirstCampaignPublishSuccess',
  NewUserFlowManagePageLoaded = 'newUserFlowManagePageLoaded',
  NewUserFlowSetupDrawerCompleted = 'newUserFlowSetupDrawerCompleted',
  NewUserFlowSetupDrawerOpened = 'newUserFlowSetupDrawerOpened',
  NewUserFlowSetupStepCompleted = 'newUserFlowSetupStepCompleted',
  NewUserFlowSetupStepStarted = 'newUserFlowSetupStepStarted',
  NextPageClicked = 'nextPageClicked',
  NoAdvertisedUniversesFetched = 'noAdvertisedUniversesFetched',
  OnboardingBackClicked = 'onboardingBackClicked',
  OnboardingDismissed = 'onboardingDismissed',
  OnboardingNextClicked = 'onboardingNextClicked',
  OnboardingTour = 'onboardingTour',
  OnSubmitManageCampaignsButtonClicked = 'onSubmitManageCampaignsButtonClicked',
  OpenImagePreview = 'openImagePreview',
  OpenVideoPreview = 'openVideoPreview',
  PausedAdCreditBannerCTAClicked = 'pausedAdCreditBannerCTAClicked',
  PausedAdCreditBannerShown = 'pausedAdCreditBannerShown',
  PaymentMethodChanged = 'paymentMethodChanged',
  PaymentSettingsPageClickSaveCard = 'paymentSettingsPageClickSaveCard',
  PaymentSettingsPageVerifiedCard = 'paymentSettingsPageVerifiedCard',
  PlaceJoinRestrictedBannerShown = 'placeJoinRestrictedBannerShown',
  PromotionBannerRendered = 'promotionBannerRendered',
  RecommendationDataFetched = 'recommendationDataFetched',
  RecommendedInvalidBudget = 'recommendedInvalidBudget',
  ReportingViewOptionClicked = 'reportingViewOptionClicked',
  ResetAdvancedTargeting = 'resetAdvancedTargeting',
  RootPlaceIdFetched = 'rootPlaceIdFetched',
  StartDateChanged = 'startDateChanged',
  StartTimeChanged = 'startTimeChanged',
  StudioStartAttempt = 'studioStartAttempt',
  StudioStartSuccess = 'studioStartSuccess',
  SubmitCampaignButtonClicked = 'submitCampaignButtonClicked',
  SubmitCampaignError = 'submitCampaignError',
  SubmitCampaignSuccessModal = 'submitCampaignSuccessModal',
  SubmitEditButtonClicked = 'submitEditButtonClicked',
  ToggleEntity = 'toggleEntity',
  ToggleLogoDrawer = 'toggleLogoDrawer',
  TogglePaymentMethodDrawer = 'togglePaymentMethodDrawer',
  ToggleThumbnailDrawer = 'toggleThumbnailDrawer',
  ToggleVideoDrawer = 'toggleVideoDrawer',
  UserAdAccountAutoCreateFailed = 'userAdAccountAutoCreateFailed',
  UserAdAccountAutoCreateSuccess = 'userAdAccountAutoCreateSuccess',
  VerifyEmailAttempted = 'verifyEmailAttempted',
  VideoUploadClicked = 'videoUploadClicked',
  VideoUploadFailure = 'videoUploadFailure',
  VideoUploadSuccess = 'videoUploadSuccess',
}

export enum ContextName {
  ImageUploadMaxRetriesReachedAndErrorShown = 'imageUploadMaxRetriesReachedAndErrorShown',
  VideoUploadMaxRetriesReachedAndErrorShown = 'videoUploadMaxRetriesReachedAndErrorShown',
}

export interface EventParameters {
  [key: string]: string | undefined;
}

function getBasePath(productionUrl: string, stagingUrl: string, defaultUrl: string): string {
  if (process.env.environment === 'production') {
    return productionUrl;
  }
  if (process.env.environment === 'staging') {
    return stagingUrl;
  }
  return defaultUrl;
}

function getEventStreamPath() {
  return getBasePath(
    'https://ecsv2.roblox.com',
    'https://ecsv2.sitetest1.robloxlabs.com',
    'https://ecsv2.sitetest1.robloxlabs.com',
  );
}

export const unifiedLogger = new UnifiedLogger({
  eventBaseUrl: getEventStreamPath(),
  product: 'ImmersiveAdsWeb',
});

const getBaseEventParameters = () => ({
  adAccountId: GetLocalStorage(StorageKeys.AD_ACCOUNT_ID, ''),
});

const getNativeEventParameters = () => ({
  ...getBaseEventParameters(),
  originatedFrom: 'Native',
});

class UnifiedLoggerMetadata {
  hasAdBlockerOn: boolean;

  hasLoggedAdBlockerOn: boolean;

  private userLocale: string;

  constructor() {
    this.hasAdBlockerOn = false;
    this.hasLoggedAdBlockerOn = false;
    this.userLocale = '';
  }

  logAdBlockerIsOn(isOn: boolean) {
    if (isOn && !this.hasLoggedAdBlockerOn) {
      unifiedLogger.logImpressionEvent({
        eventName: EventName.AdBlockerIsOn,
        parameters: {
          ...getNativeEventParameters(),
          hasAdBlockerOn: this.getAdBlockerStatus(),
        },
      });
      this.hasLoggedAdBlockerOn = true;
    }
  }

  setAdBlockerStatus(on: boolean) {
    this.hasAdBlockerOn = on;
  }

  getAdBlockerStatus() {
    return this.hasAdBlockerOn.toString();
  }

  setLocalizationContext(locale: string) {
    this.userLocale = locale;
  }

  getLocalizationParameters(): EventParameters {
    return {
      userLocale: this.userLocale,
    };
  }
}

export const unifiedLoggerMetadata = new UnifiedLoggerMetadata();

// Universally inject localization and ad-blocker parameters into all log
// methods so that every event carries this context automatically.
const getUniversalEventParams = (): Record<string, string> => {
  const { userLocale = '' } = unifiedLoggerMetadata.getLocalizationParameters();
  return {
    hasAdBlockerOn: unifiedLoggerMetadata.getAdBlockerStatus(),
    userLocale,
  };
};

// Bind the native implementations before wrapping so telemetry still works when
// Next.js resolves duplicate @rbx/unified-logger copies (prototype .call breaks there).
const originalLogImpressionEvent = unifiedLogger.logImpressionEvent.bind(unifiedLogger);
const originalLogClickEvent = unifiedLogger.logClickEvent.bind(unifiedLogger);
const originalLogApiVitalsEvent = unifiedLogger.logApiVitalsEvent.bind(unifiedLogger);
const originalLogErrorEvent = unifiedLogger.logErrorEvent.bind(unifiedLogger);

const withUniversalEventParams = <T extends { parameters?: EventParameters }>(event: T): T => ({
  ...event,
  parameters: { ...getUniversalEventParams(), ...event.parameters },
});

unifiedLogger.logImpressionEvent = (event) =>
  originalLogImpressionEvent(withUniversalEventParams(event));

unifiedLogger.logClickEvent = (event) => originalLogClickEvent(withUniversalEventParams(event));

unifiedLogger.logApiVitalsEvent = (event) =>
  originalLogApiVitalsEvent(withUniversalEventParams(event));

unifiedLogger.logErrorEvent = (event) => originalLogErrorEvent(withUniversalEventParams(event));

export const logNativeImpressionEvent = (eventName: EventName, parameters?: EventParameters) => {
  unifiedLogger.logImpressionEvent({
    eventName,
    parameters: {
      ...getNativeEventParameters(),
      ...(parameters || {}),
    },
  });
};

export const logNativeClickEvent = (eventName: EventName, parameters?: EventParameters) => {
  unifiedLogger.logClickEvent({
    eventName,
    parameters: {
      ...getNativeEventParameters(),
      ...(parameters || {}),
    },
  });
};

export const logNativeApiVitalsEvent = (eventName: EventName, parameters?: EventParameters) => {
  unifiedLogger.logApiVitalsEvent({
    eventName,
    parameters: {
      ...getNativeEventParameters(),
      ...(parameters || {}),
    },
  });
};

export const logNativeErrorEvent = ({
  error,
  eventName,
  parameters = {},
}: {
  error?: AxiosError | unknown;
  eventName: EventName;
  parameters?: EventParameters;
}) => {
  let errorStatus = 'UNKNOWN';
  if (error && error instanceof AxiosError) {
    errorStatus = error.code || errorStatus;
  }
  unifiedLogger.logErrorEvent({
    eventName,
    parameters: {
      error: String(error),
      errorStatus,
      ...getNativeEventParameters(),
      ...parameters,
    },
  });
};
