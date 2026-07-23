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
  EnableExperienceReleases = 'enableExperienceReleases',
  EnablePlayerFeedbackDetailedFilter = 'enablePlayerFeedbackDetailedFilter',
  EnableEventRequestFeaturing = 'enableEventRequestFeaturing',
  EnableImpactedExperiencesView = 'enableImpactedExperiencesView',
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
  [CreatorDashboardParameters.EnableExperienceReleases]: boolean | null;
  [CreatorDashboardParameters.EnablePlayerFeedbackDetailedFilter]: boolean | null;
  [CreatorDashboardParameters.EnableEventRequestFeaturing]: boolean | null;
  [CreatorDashboardParameters.EnableImpactedExperiencesView]: boolean | null;
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
};

/** Control will point to the legacy design - explicily renaming this. */
export const AlertAnnouncementRedesignVariants = {
  LegacyAlertsAndAnnouncement: 'Control',
  AlertAndAnnouncement: 'AlertAndAnnouncement',
  AnnouncementOnly: 'AnnouncementOnly',
} as const;

export type TAlertAnnouncementRedesignVariants =
  (typeof AlertAnnouncementRedesignVariants)[keyof typeof AlertAnnouncementRedesignVariants];

enum CreatorHubHomePageParameters {
  EnableVideoOnboarding = 'enableVideoOnboarding',
  AlertAnnouncementRedesign = 'AlertAnnouncementRedesign',
}

export type CreatorHubHomePageParameterResults = {
  [CreatorHubHomePageParameters.EnableVideoOnboarding]: boolean;
  [CreatorHubHomePageParameters.AlertAnnouncementRedesign]: TAlertAnnouncementRedesignVariants | null;
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

enum CreatorHubNavigationUserParameters {
  EnableIAM2 = 'enableIAM2',
  ShowEditInStudioButton = 'showEditInStudioButton',
}

export type CreatorHubNavigationUserParameterResults = {
  [CreatorHubNavigationUserParameters.EnableIAM2]: boolean | null;
  [CreatorHubNavigationUserParameters.ShowEditInStudioButton]: boolean | null;
};

enum CreatorHubCreationsPermissionParameters {}

export type CreatorHubCreationsPermissionParameterResults = Record<string, never>;

export enum TalentHubParameters {
  EnableTalentHubV2 = 'enableTalentHubV2',
}

export type TalentHubParameterResults = {
  [TalentHubParameters.EnableTalentHubV2]: number | boolean | null;
};

export enum StarterPlaceParameters {
  StarterPlaceTemplateId = 'starterPlaceTemplateId',
}

export type StarterPlaceParameterResults = {
  [StarterPlaceParameters.StarterPlaceTemplateId]: number | null;
};

export enum CreatorSuccessOrganizationsParameters {
  EnableGroupInvitationsPrefetch = 'enableGroupInvitationsPrefetch',
}

export type CreatorSuccessOrganizationsParameterResults = {
  [CreatorSuccessOrganizationsParameters.EnableGroupInvitationsPrefetch]: boolean | null;
};

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

export enum IXPLayers {
  CreatorDashboard = 'CreatorDashboard',
  CreatorHubHomePage = 'CreatorHub.HomePage.UserId',
  CreatorHubHomePageExperienceTile = 'CreatorHub.HomePage.ExperienceTile.UserId',
  CreatorHubLandingPage = 'CreatorHub.LandingPage',
  CreatorHubLandingPageUserId = 'CreatorHub.LandingPage.UserId',
  CreatorHubNavigation = 'CreatorHub.Navigation',
  CreatorHubNavigationUser = 'CreatorHub.Navigation.User',
  RightsManager = 'CreatorDashboard.RightsManager',
  StarterPlaceCreation = 'CRK.StarterPlace.StarterPlaceCreation',
  CreatorSuccessOrganizations = 'CreatorSuccess.OrganizationsV2',
  CreatorHubDocumentation = 'CreatorHub.CreatorDocumentation.UserId',
  CreatorHubCreationsPermission = 'CreatorHub.Creations.Permission',
  CreatorHubExperienceWebhooks = 'CreatorHub.ExperienceWebhooks.UserId',
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

type IXPParamEnum = Record<string, string>;
// NOTE(gperkins@ 20221026): For layers with universe units, we don't need to send the params -- we get all of them back by default
export const IXPParameters: Record<IXPLayers, IXPParamEnum> = {
  [IXPLayers.CreatorDashboard]: CreatorDashboardParameters,
  [IXPLayers.CreatorHubHomePage]: CreatorHubHomePageParameters,
  [IXPLayers.CreatorHubLandingPage]: CreatorHubLandingPageParameters,
  [IXPLayers.CreatorHubLandingPageUserId]: CreatorHubLandingPageUserIdParameters,
  [IXPLayers.CreatorHubNavigation]: CreatorHubNavigationParameters,
  [IXPLayers.CreatorHubNavigationUser]: CreatorHubNavigationUserParameters,
  [IXPLayers.RightsManager]: RightsManagerParameters,
  [IXPLayers.StarterPlaceCreation]: StarterPlaceParameters,
  [IXPLayers.CreatorSuccessOrganizations]: CreatorSuccessOrganizationsParameters,
  [IXPLayers.CreatorHubDocumentation]: CreatorHubDocumentationUserIdParameters,
  [IXPLayers.CreatorHubCreationsPermission]: CreatorHubCreationsPermissionParameters,
  [IXPLayers.CreatorHubExperienceWebhooks]: CreatorHubExperienceWebhooksParameters,
  [IXPLayers.CreatorHubHomePageExperienceTile]: CreatorHubHomePageExperienceTileParameters,
  [IXPLayers.TalentHub]: TalentHubParameters,
};

export type TIXPParameterResults = {
  [IXPLayers.CreatorDashboard]: CreatorDashboardParameterResults;
  [IXPLayers.CreatorHubHomePage]: CreatorHubHomePageParameterResults;
  [IXPLayers.CreatorHubLandingPage]: CreatorHubLandingPageParametersResults;
  [IXPLayers.CreatorHubLandingPageUserId]: CreatorHubLandingPageUserIdParametersResults;
  [IXPUniverseLayers.CreatorDashboardUniverses]: CreatorDashboardUniversesParameterResults;
  [IXPLayers.CreatorHubNavigation]: CreatorHubNavigationParameterResults;
  [IXPLayers.CreatorHubNavigationUser]: CreatorHubNavigationUserParameterResults;
  [IXPLayers.RightsManager]: RightsManagerParameterResults;
  [IXPLayers.StarterPlaceCreation]: StarterPlaceParameterResults;
  [IXPLayers.CreatorSuccessOrganizations]: CreatorSuccessOrganizationsParameterResults;
  [IXPLayers.CreatorHubDocumentation]: CreatorHubDocumentationUserIdParameterResults;
  [IXPLayers.CreatorHubCreationsPermission]: CreatorHubCreationsPermissionParameterResults;
  [IXPLayers.CreatorHubExperienceWebhooks]: CreatorHubExperienceWebhooksParameterResults;
  [IXPLayers.CreatorHubHomePageExperienceTile]: CreatorHubHomePageExperienceTileParameterResults;
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
  return response.json();
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
  const { layers } = await response.json();
  const layer = layers[layerID];
  const { parameters } = layer;
  return parameters;
}
export const fetchIXPParametersForUniverse = arrayMemoize(fetchIXPParametersForUniverseUncached);
