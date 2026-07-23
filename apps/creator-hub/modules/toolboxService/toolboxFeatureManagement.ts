// Add a new flag to the enum below, following steps 1, 2, and 3

export enum FrontendFlagName {
  // 1. Declare PublicFrontendFlags here: i.e. PublicFrontendMyTestFlag
  // PublicFrontendMyTestFlag = 'PublicFrontendMyTestFlag'
  // IMPORTANT NOTE: Frontend Flag names are visible to the public!
  // NOTE: MUST prefix with 'PublicFrontend'
  FrontendFlagEnableNonPluginDistributionRestrictions = 'PublicFrontendMDR',
  FrontendFlagEnableModelPricingTransition = 'PublicFrontendEMPT',
  FrontendFlagEnableSocialLinkCustomTitles = 'PublicFrontendSLCT',
  FrontendFlagEnableAudioWavUpload = 'PublicFrontendAWU',
  FrontendFlagEnableAudioFlacUpload = 'PublicFrontendAFU',
  FrontendFlagEnableCreatorInsightsPage = 'PublicFrontendCIP',
  FrontendFlagEnableTryAssetSocialLink = 'PublicFrontendETIR',
  FrontendFlagEnableTryAssetDefaultExperience = 'PublicFrontendETADE',
  FrontendFlagEnablePaidModelDependenciesModal = 'PublicFrontendPMDM',
  FrontendFlagTaxonomyExperiment = 'PublicFrontendTE',
  FrontendFlagUniverseBansManagerLabelUpdate = 'PublicFrontendUBMLU',
  FrontendFlagEnableHiddenFromSearchVisibilityAlert = 'PublicFrontendHFS',
  FrontendFlagEnableCreatorCollaborationLicensing = 'PublicFrontendCCL',
  FrontendFlagEnableMarketplaceSalesLicensing = 'PublicFrontendMSL',
}
export type FrontendFlags = Record<FrontendFlagName, boolean>;

export const FRONTEND_FLAG_NAMES: readonly FrontendFlagName[] = Object.values(FrontendFlagName);

const isCompleteFrontendFlags = (flags: Partial<FrontendFlags>): flags is FrontendFlags =>
  FRONTEND_FLAG_NAMES.every((flagName) => Object.hasOwn(flags, flagName));

const buildFrontendFlags = (
  resolveValue: (flagName: FrontendFlagName) => boolean,
): FrontendFlags => {
  const flags: Partial<FrontendFlags> = {};

  for (const flagName of FRONTEND_FLAG_NAMES) {
    flags[flagName] = resolveValue(flagName);
  }

  if (!isCompleteFrontendFlags(flags)) {
    throw new Error('Failed to build frontend flags.');
  }

  return flags;
};

// Sets all enumerated flag names to false by default
export const DEFAULT_FRONTEND_FLAGS: FrontendFlags = buildFrontendFlags(() => false);
// 2. Use FrontendFlags in code as such, with example PublicFrontendMyTestFlag:
// import { FrontendFlagName, useToolboxServiceApiProvider } from '@modules/toolboxService';
// ...
// const { frontendFlags } = useToolboxServiceApiProvider();
// if (frontendFlags[FrontendFlagName.PublicFrontendMyTestFlag]) { Your new feature here... }

// 3. Flags are added and managed under 'Feature Management' group in studio-toolbox-search Obelix for each environment
// studio-toolbox-search: https://obelix.simulprod.com/project/studio-toolbox-search/runtime-configuration/group/toolbox-service
// Declared flag name in enum (string value) must match Obelix flag name
