import { resolveUrl } from '@rbx/env-utils';

export const getDataCollectionUrl = () => {
  return resolveUrl(
    'dataCollectionOptInUrl',
    process.env.targetEnvironment,
    process.env.buildTarget,
  );
};

export const getAssetDistributionUrl = () =>
  process.env.buildTarget === 'global'
    ? resolveUrl(
        'robloxCommunityStandardsUrl',
        process.env.targetEnvironment,
        process.env.buildTarget,
      )
    : resolveUrl('robloxTermsOfUseUrl', process.env.targetEnvironment, process.env.buildTarget);

export const getSellerOnboardingLegalAgreementUrl = () =>
  resolveUrl('creatorStoreTermsOfUseUrl', process.env.targetEnvironment, process.env.buildTarget);

export const getAudioDistributionOnboardingLegalAgreementUrl = () =>
  resolveUrl(
    'audioUploadLicenseAgreementUrl',
    process.env.targetEnvironment,
    process.env.buildTarget,
  );

export const getAccountVerificationUrl = () =>
  resolveUrl('accountVerificationUrl', process.env.targetEnvironment, process.env.buildTarget);

export const getGameDetailsPageDocsUrl = () =>
  resolveUrl('gameDetailsPageDocsUrl', process.env.targetEnvironment, process.env.buildTarget);

export const getSongEligibilityDocsUrl = () =>
  resolveUrl('songEligibilityDocsUrl', process.env.targetEnvironment, process.env.buildTarget);

export const getAudioThumbnailModerationUrl = () =>
  resolveUrl('audioThumbnailModerationUrl', process.env.targetEnvironment, process.env.buildTarget);
