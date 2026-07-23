// Add a new flag to the enum below, following steps 1, 2, and 3

export enum FrontendFlagName {
  // 1. Declare PublicFrontendFlags here: i.e. PublicFrontendMyTestFlag
  // PublicFrontendMyTestFlag = 'PublicFrontendMyTestFlag'
  // IMPORTANT NOTE: Frontend Flag names are visible to the public!
  // NOTE: MUST prefix with 'PublicFrontend'
  FrontendFlagEnableAudioDistributionOnboarding = 'PublicFrontendADO',
  FrontendFlagEnableNonPluginDistributionRestrictions = 'PublicFrontendMDR',
  FrontendFlagEnableModelPricingTransition = 'PublicFrontendEMPT',
  FrontendFlagEnableSocialLinkCustomTitles = 'PublicFrontendSLCT',
  FrontendFlagEnableAudioWavUpload = 'PublicFrontendAWU',
  FrontendFlagEnableAudioFlacUpload = 'PublicFrontendAFU',
  FrontendFlagEnableCreatorInsightsPage = 'PublicFrontendCIP',
  FrontendFlagEnableAssetAccessForm = 'PublicFrontendAAF',
  FrontendFlagEnableAssetAccessControl = 'PublicFrontendAAC',
  FrontendFlagEnableAssetPrivacyOptOutSurvey = 'PublicFrontendAPOS',
  FrontendFlagEnablePermissionPageRedesign = 'PublicFrontendPPR',
  FrontendFlagEnablePermissionSharingWithGroups = 'PublicFrontendPSG',
  FrontendFlagEnableAssetEligibilityChecks = 'PublicFrontendAEC',
  FrontendFlagEnableAssetAccessControlCallToAction = 'PublicFrontendCTA',
  FrontendFlagEnableTryAssetSocialLink = 'PublicFrontendETIR',
  FrontendFlagEnableTryAssetDefaultExperience = 'PublicFrontendETADE',
  FrontendFlagEnableAnimationPermissionPage = 'PublicFrontendAPP',
  FrontendFlagEnablePaidModelDependenciesModal = 'PublicFrontendPMDM',
  FrontendFlagTaxonomyExperiment = 'PublicFrontendTE',
  FrontendFlagUniverseBansManagerLabelUpdate = 'PublicFrontendUBMLU',
  FrontendFlagEnableHiddenFromSearchVisibilityAlert = 'PublicFrontendHFS',
}
export type FrontendFlags = Record<FrontendFlagName, boolean>;

export const FRONTEND_FLAG_NAMES = Object.values(FrontendFlagName);

// Sets all enumerated flag names to false by default
export const DEFAULT_FRONTEND_FLAGS: FrontendFlags = Object.assign(
  {},
  ...FRONTEND_FLAG_NAMES.map((flagName) => ({ [flagName]: false })),
);
// 2. Use FrontendFlags in code as such, with example PublicFrontendMyTestFlag:
// import { FrontendFlagName, useToolboxServiceApiProvider } from '@modules/toolboxService';
// ...
// const { frontendFlags } = useToolboxServiceApiProvider();
// if (frontendFlags[FrontendFlagName.PublicFrontendMyTestFlag]) { Your new feature here... }

// 3. Flags are added and managed under 'Feature Management' group in studio-toolbox-search Obelix for each environment
// studio-toolbox-search: https://obelix.simulprod.com/project/studio-toolbox-search/runtime-configuration/group/toolbox-service
// Declared flag name in enum (string value) must match Obelix flag name
