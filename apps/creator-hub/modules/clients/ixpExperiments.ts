import { getBEDEV2ServiceBasePath } from './utils';
import arrayMemoize from './utils/arrayMemoize';
import mapMemoizeSingleParamFunction from './utils/mapMemoizeSingleParamFunction';

/**
 * See ../../docs/EXPERIMENTATION.md for instructions
 */
export enum CreatorDashboardParameters {
  ShowVrDeviceOption = 'showVrDeviceOption',
  ShowIXPClientTest = 'showIXPClientTest',
  ShowMemoryStoresDashboard = 'showMemoryStoresDashboard',
  ShowAdvancedSettingsPage = 'showAdvancedSettingsPage',
  EnableIA = 'enableIA',
  EnableSubscriptionActivationTest = 'enableSubscriptionActivationTest',
  EnableDevexEarnedRobux = 'enableDevexEarnedRobux',
  EnableExperienceGenre = 'enableExperienceGenre',
  EnablePlayerFeedbackTranslationsWeb = 'EnablePlayerFeedbackTranslationsWeb',
  EnablePlayerFeedbackTranslationRetries = 'EnablePlayerFeedbackTranslationRetries',
  EnablePlayerFeedbackDetailedFilter = 'enablePlayerFeedbackDetailedFilter',
  EnableEventRequestFeaturing = 'enableEventRequestFeaturing',
  EnableCollaboratorsPageV2 = 'enableCollaboratorsPageV2',
}

export type CreatorDashboardParameterResults = {
  [CreatorDashboardParameters.ShowVrDeviceOption]: boolean | null;
  [CreatorDashboardParameters.ShowIXPClientTest]: boolean | null;
  [CreatorDashboardParameters.ShowMemoryStoresDashboard]: boolean | null;
  [CreatorDashboardParameters.ShowAdvancedSettingsPage]: boolean | null;
  [CreatorDashboardParameters.EnableIA]: boolean | null;
  [CreatorDashboardParameters.EnableSubscriptionActivationTest]: boolean | null;
  [CreatorDashboardParameters.EnableDevexEarnedRobux]: boolean | null;
  [CreatorDashboardParameters.EnableExperienceGenre]: boolean | null;
  [CreatorDashboardParameters.EnablePlayerFeedbackTranslationsWeb]: boolean | null;
  [CreatorDashboardParameters.EnablePlayerFeedbackTranslationRetries]: boolean | null;
  [CreatorDashboardParameters.EnablePlayerFeedbackDetailedFilter]: boolean | null;
  [CreatorDashboardParameters.EnableEventRequestFeaturing]: boolean | null;
  [CreatorDashboardParameters.EnableCollaboratorsPageV2]: boolean | null;
};

export enum RightsManagerParameters {
  EnableRightsManager = 'enableRightsManager',
  EnableBulkFiling = 'enableBulkFiling',
  EnableOnDemandSearch = 'enableOnDemandSearch',
  EnableEditRegistration = 'enableEditRegistration',
  EnableImageSearch = 'enableImageSearch',
  EnableClaimsAgainstMe = 'enableClaimsAgainstMe',
  EnableGenAiOptOut = 'enableGenAiOptOut',
  EnableInExperienceIpReporting = 'enableInExperienceIpReporting',
  EnableIpContentSearch = 'enableIpContentSearch',
  EnableTrademark = 'enableTrademark',
}

export type RightsManagerParameterResults = {
  [RightsManagerParameters.EnableRightsManager]: boolean | null;
  [RightsManagerParameters.EnableBulkFiling]: boolean | null;
  [RightsManagerParameters.EnableOnDemandSearch]: boolean | null;
  [RightsManagerParameters.EnableEditRegistration]: boolean | null;
  [RightsManagerParameters.EnableImageSearch]: boolean | null;
  [RightsManagerParameters.EnableClaimsAgainstMe]: boolean | null;
  [RightsManagerParameters.EnableGenAiOptOut]: boolean | null;
  [RightsManagerParameters.EnableInExperienceIpReporting]: boolean | null;
  [RightsManagerParameters.EnableIpContentSearch]: boolean | null;
  [RightsManagerParameters.EnableTrademark]: boolean | null;
};

export enum LicenseManagerParameters {
  EnableIPRecommender = 'enableIPRecommender',
}

export type LicenseManagerParameterResults = {
  [LicenseManagerParameters.EnableIPRecommender]: boolean | null;
};

enum CreatorHubHomePageParameters {
  EnableVideoOnboarding = 'enableVideoOnboarding',
}

export type CreatorHubHomePageParameterResults = {
  [CreatorHubHomePageParameters.EnableVideoOnboarding]: boolean;
};

enum CreatorHubHomePageOpportunitiesSectionParameters {
  EnableSignalLookup = 'enableSignalLookup',
  AlwaysShow = 'alwaysShow',
}

export type CreatorHubHomePageOpportunitiesSectionParameterResults = {
  [CreatorHubHomePageOpportunitiesSectionParameters.EnableSignalLookup]: boolean;
  [CreatorHubHomePageOpportunitiesSectionParameters.AlwaysShow]: boolean;
};

enum CreatorHubLandingPageParameters {}

export type CreatorHubLandingPageParametersResults = Record<string, boolean | null>;

enum CreatorHubLandingPageUserIdParameters {
  mobileVariant = 'mobileVariant',
}

export type CreatorHubLandingPageUserIdParametersResults = {
  [CreatorHubLandingPageUserIdParameters.mobileVariant]: 'A' | 'B' | null;
};

enum CreatorHubNavigationParameters {}

export type CreatorHubNavigationParameterResults = Record<string, never>;

export enum CreatorHubNavigationUserParameters {
  ShowEditInStudioButton = 'showEditInStudioButton',
  EnableCreationsNavLayout = 'enableCreationsIPNavLayout',
}

export type CreatorHubNavigationUserParameterResults = {
  [CreatorHubNavigationUserParameters.ShowEditInStudioButton]: boolean | null;
  [CreatorHubNavigationUserParameters.EnableCreationsNavLayout]: boolean | null;
};

export enum CreatorHubCreationsPermissionParameters {
  EnableAudienceReachOnOverview = 'enableAudienceReachOnOverviewPage',
  EnableAudienceReachGrowthOpportunitiesBanner = 'enableAudienceReachGrowthOpportunitiesBanner',
  EnableAudienceControls = 'enableAudienceControls',
  EnableNewBadgePattern = 'enableNewBadgePattern',
  EnableAtRiskAnnotationOnExperiences = 'enableAtRiskAnnotationOnExperiences',
  EnableAudiencesReplacement = 'enableAudiencesReplacement',
}

export type CreatorHubCreationsPermissionParameterResults = {
  [CreatorHubCreationsPermissionParameters.EnableAudienceReachOnOverview]: boolean | null;
  [CreatorHubCreationsPermissionParameters.EnableAudienceReachGrowthOpportunitiesBanner]:
    | boolean
    | null;
  [CreatorHubCreationsPermissionParameters.EnableAudienceControls]: boolean | null;
  [CreatorHubCreationsPermissionParameters.EnableNewBadgePattern]: boolean | null;
  [CreatorHubCreationsPermissionParameters.EnableAtRiskAnnotationOnExperiences]: boolean | null;
  [CreatorHubCreationsPermissionParameters.EnableAudiencesReplacement]: boolean | null;
};

export enum TalentHubParameters {
  EnableTalentHubV2 = 'enableTalentHubV2',
  EnableTalentHubV2M2 = 'enableTalentHubV2M2',
}

export type TalentHubParameterResults = {
  [TalentHubParameters.EnableTalentHubV2]: number | boolean | null;
  [TalentHubParameters.EnableTalentHubV2M2]: number | boolean | null;
};

export enum StarterPlaceParameters {
  StarterPlaceTemplateId = 'starterPlaceTemplateId',
}

export type StarterPlaceParameterResults = {
  [StarterPlaceParameters.StarterPlaceTemplateId]: number | null;
};

export enum CreatorSuccessOrganizationsParameters {}

export type CreatorSuccessOrganizationsParameterResults = {};

enum CreatorHubExperienceWebhooksParameters {
  EnableExperienceWebhooks = 'enableExperienceWebhooks',
}

export type CreatorHubExperienceWebhooksParameterResults = {
  [CreatorHubExperienceWebhooksParameters.EnableExperienceWebhooks]: boolean | null;
};

enum CreatorHubHomePageExperienceTileParameters {
  EnableExperienceDataTileV2 = 'enableExperienceDataTileV2',
}

export type CreatorHubHomePageExperienceTileParameterResults = {
  [CreatorHubHomePageExperienceTileParameters.EnableExperienceDataTileV2]: boolean | null;
};

enum CreatorHubChangelogParameters {
  EnableChangelogCMS = 'enableChangelogCMS',
}

export type CreatorHubChangelogParameterResults = {
  [CreatorHubChangelogParameters.EnableChangelogCMS]: boolean | null;
};

export enum IXPLayers {
  CreatorDashboard = 'CreatorDashboard',
  CreatorHubHomePage = 'CreatorHub.HomePage.UserId',
  CreatorHubHomePageExperienceTile = 'CreatorHub.HomePage.ExperienceTile.UserId',
  CreatorHubHomePageOpportunitiesSection = 'CreatorHub.HomePage.OpportunitiesSection.UserId',
  CreatorHubLandingPage = 'CreatorHub.LandingPage',
  CreatorHubLandingPageUserId = 'CreatorHub.LandingPage.UserId',
  CreatorHubNavigation = 'CreatorHub.Navigation',
  CreatorHubNavigationUser = 'CreatorHub.Navigation.User',
  LicenseManager = 'CreatorDashboard.LicenseManager',
  RightsManager = 'CreatorDashboard.RightsManager',
  StarterPlaceCreation = 'CRK.StarterPlace.StarterPlaceCreation',
  CreatorSuccessOrganizations = 'CreatorSuccess.OrganizationsV2',
  CreatorHubDocumentation = 'CreatorHub.CreatorDocumentation.UserId',
  CreatorHubDocumentationSearch = 'CreatorHub.CreatorDocumentation.Search.UserId',
  CreatorHubCreationsPermission = 'CreatorHub.Creations.Permission',
  CreatorHubExperienceWebhooks = 'CreatorHub.ExperienceWebhooks.UserId',
  CreatorHubChangelog = 'CreatorHub.Changelog',
  TalentHub = 'CreatorHub.TalentHub.UserId',
}

export enum IXPUniverseLayers {
  CreatorDashboardUniverses = 'CreatorDashboardUniverses',
}

enum CreatorDashboardUniversesParameters {
  ShowMemoryStoresDashboard = 'showMemoryStoresDashboard',
  EnableSubscriptionActivationTest = 'enableSubscriptionActivationTest',
  ShowSecrets = 'showSecrets',
  ShowQualitySignalCards = 'showQualitySignalCards',
}

export type CreatorDashboardUniversesParameterResults = {
  [CreatorDashboardUniversesParameters.ShowMemoryStoresDashboard]: boolean | null;
  [CreatorDashboardUniversesParameters.EnableSubscriptionActivationTest]: boolean | null;
  [CreatorDashboardUniversesParameters.ShowSecrets]: boolean | null;
  [CreatorDashboardUniversesParameters.ShowQualitySignalCards]: boolean | null;
};

export enum CreatorHubDocumentationUserIdParameters {
  EnableCourses = 'enableCourses',
}

export type CreatorHubDocumentationUserIdParameterResults = {
  [CreatorHubDocumentationUserIdParameters.EnableCourses]: boolean | null;
};

export enum CreatorHubDocumentationSearchUserIdParameters {
  SearchVersion = 'searchVersion',
}

export type CreatorHubDocumentationSearchUserIdParameterResults = {
  [CreatorHubDocumentationSearchUserIdParameters.SearchVersion]: number | null; // 1 = MiniSearch, 2 = BackendSearch
};

type IXPParamEnum = Record<string, string>;
// NOTE(gperkins@ 20221026): For layers with universe units, we don't need to send the params -- we get all of them back by default
export const IXPParameters: Record<IXPLayers, IXPParamEnum> = {
  [IXPLayers.CreatorDashboard]: CreatorDashboardParameters,
  [IXPLayers.CreatorHubHomePage]: CreatorHubHomePageParameters,
  [IXPLayers.CreatorHubHomePageOpportunitiesSection]:
    CreatorHubHomePageOpportunitiesSectionParameters,
  [IXPLayers.CreatorHubLandingPage]: CreatorHubLandingPageParameters,
  [IXPLayers.CreatorHubLandingPageUserId]: CreatorHubLandingPageUserIdParameters,
  [IXPLayers.CreatorHubNavigation]: CreatorHubNavigationParameters,
  [IXPLayers.CreatorHubNavigationUser]: CreatorHubNavigationUserParameters,
  [IXPLayers.LicenseManager]: LicenseManagerParameters,
  [IXPLayers.RightsManager]: RightsManagerParameters,
  [IXPLayers.StarterPlaceCreation]: StarterPlaceParameters,
  [IXPLayers.CreatorSuccessOrganizations]: CreatorSuccessOrganizationsParameters,
  [IXPLayers.CreatorHubDocumentation]: CreatorHubDocumentationUserIdParameters,
  [IXPLayers.CreatorHubDocumentationSearch]: CreatorHubDocumentationSearchUserIdParameters,
  [IXPLayers.CreatorHubCreationsPermission]: CreatorHubCreationsPermissionParameters,
  [IXPLayers.CreatorHubExperienceWebhooks]: CreatorHubExperienceWebhooksParameters,
  [IXPLayers.CreatorHubHomePageExperienceTile]: CreatorHubHomePageExperienceTileParameters,
  [IXPLayers.CreatorHubChangelog]: CreatorHubChangelogParameters,
  [IXPLayers.TalentHub]: TalentHubParameters,
};

export type TIXPParameterResults = {
  [IXPLayers.CreatorDashboard]: CreatorDashboardParameterResults;
  [IXPLayers.CreatorHubHomePage]: CreatorHubHomePageParameterResults;
  [IXPLayers.CreatorHubHomePageOpportunitiesSection]: CreatorHubHomePageOpportunitiesSectionParameterResults;
  [IXPLayers.CreatorHubLandingPage]: CreatorHubLandingPageParametersResults;
  [IXPLayers.CreatorHubLandingPageUserId]: CreatorHubLandingPageUserIdParametersResults;
  [IXPUniverseLayers.CreatorDashboardUniverses]: CreatorDashboardUniversesParameterResults;
  [IXPLayers.CreatorHubNavigation]: CreatorHubNavigationParameterResults;
  [IXPLayers.CreatorHubNavigationUser]: CreatorHubNavigationUserParameterResults;
  [IXPLayers.LicenseManager]: LicenseManagerParameterResults;
  [IXPLayers.RightsManager]: RightsManagerParameterResults;
  [IXPLayers.StarterPlaceCreation]: StarterPlaceParameterResults;
  [IXPLayers.CreatorSuccessOrganizations]: CreatorSuccessOrganizationsParameterResults;
  [IXPLayers.CreatorHubDocumentation]: CreatorHubDocumentationUserIdParameterResults;
  [IXPLayers.CreatorHubDocumentationSearch]: CreatorHubDocumentationSearchUserIdParameterResults;
  [IXPLayers.CreatorHubCreationsPermission]: CreatorHubCreationsPermissionParameterResults;
  [IXPLayers.CreatorHubExperienceWebhooks]: CreatorHubExperienceWebhooksParameterResults;
  [IXPLayers.CreatorHubHomePageExperienceTile]: CreatorHubHomePageExperienceTileParameterResults;
  [IXPLayers.CreatorHubChangelog]: CreatorHubChangelogParameterResults;
  [IXPLayers.TalentHub]: TalentHubParameterResults;
};

async function fetchIXPParametersForCurrentUserUncached<Layer extends IXPLayers>(
  layer: Layer,
): Promise<TIXPParameterResults[Layer]> {
  const baseURL = getBEDEV2ServiceBasePath('product-experimentation-platform');
  const paramList = Object.values(IXPParameters[layer]).join(',');
  const url = `${baseURL}/v1/projects/1/layers/${layer}/values?parameters=${paramList}`;
  const response = await fetch(url, {
    // NOTE(gperkins@ 20220901): the IXP layer is based on userid, so we need to send cookies cross-origin
    credentials: 'include',
  });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- response.json() is untyped
  return response.json() as Promise<TIXPParameterResults[Layer]>;
}

export const fetchIXPParametersForCurrentUser = mapMemoizeSingleParamFunction(
  fetchIXPParametersForCurrentUserUncached,
);

/** For universes we need to POST the universeID to a different endpoint */
async function fetchIXPParametersForUniverseUncached<Layer extends IXPUniverseLayers>(
  layerID: Layer,
  universeID: number,
): Promise<TIXPParameterResults[Layer]> {
  const baseURL = getBEDEV2ServiceBasePath('product-experimentation-platform');
  const payload = { layers: { [layerID]: { universeid: universeID } } };
  const url = `${baseURL}/v1/projects/1/values`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- response.json() is untyped
  const body = (await response.json()) as {
    layers: Record<string, { parameters: TIXPParameterResults[Layer] }>;
  };
  return body.layers[layerID].parameters;
}
export const fetchIXPParametersForUniverse = arrayMemoize(fetchIXPParametersForUniverseUncached);
