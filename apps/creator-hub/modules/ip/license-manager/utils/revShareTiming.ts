import {
  AgreementStatus,
  HydratedAgreementWithHydratedTargetsResponse,
} from '@rbx/clients/contentLicensingApi/v1';

// Helper to fetch what translation keys should be shown on the agreement tables for rev-share timing
export const getRevShareTimingKey = (
  agreement: HydratedAgreementWithHydratedTargetsResponse,
  isTimeLimitedLicense?: boolean,
) => {
  if (!agreement.license || agreement.license.royaltyRate === 0) {
    return 'Label.NotApplicable';
  }

  if (agreement.enableMonetization || isTimeLimitedLicense) {
    return agreement.status === AgreementStatus.Active ? 'Label.Now' : 'Label.OnActivation';
  }

  return 'Label.Later';
};

// Helper to fetch what translation keys should be shown on the agreement details page > overview tile for rev share timing
export const getRevShareTimingKeys = (
  agreement: HydratedAgreementWithHydratedTargetsResponse,
  isCreator: boolean,
  isTimeLimitedLicense?: boolean,
) => {
  let description = isCreator
    ? 'Description.RevenueShareTimingLaterCardCreator'
    : 'Description.RevenueShareTimingLaterCardIph';

  if (agreement.enableMonetization) {
    if (agreement.status === AgreementStatus.Active) {
      description = isCreator
        ? 'Description.RevenueShareTimingNowCardCreator'
        : 'Description.RevenueShareTimingNowCardIph';
    } else {
      description = isCreator
        ? 'Description.RevenueShareTimingOnActivationCardCreator'
        : 'Description.RevenueShareTimingOnActivationCardIph';
    }
  }

  // Timebound licenses will always have agreement.enableMonetization = true
  if (isTimeLimitedLicense) {
    description = 'Description.RevenueShareTimingTimeLimited';
  }

  const iconLabel = getRevShareTimingKey(agreement, isTimeLimitedLicense);
  return { description, iconLabel };
};
