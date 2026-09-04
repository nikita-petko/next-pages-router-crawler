import type { FunctionComponent } from 'react';
import React from 'react';
import type { LicenseResponse, LicenseType } from '@rbx/client-content-licensing-api/v1';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { ContentTile, ContentType } from '@modules/ip/license-manager/components/ContentTile';
import {
  KeyValuePair,
  KeyValuePairContainer,
} from '@modules/ip/license-manager/components/KeyValuePair';
import { getDauLicenseLabelFromEnum } from '@modules/ip/license-manager/utils/dauEnum';
import { getMaturityRatingLabel } from '@modules/ip/license-manager/utils/maturityRating';
import useGetIPListing from '../hooks/useGetIPListing';
import { getCreatorEarningsRequirementText } from '../utils/creatorEarningsRequirementText';
import { formatRoyaltyRate } from '../utils/format';
import { licenseUsesExperienceMaturityRating } from '../utils/licenseUsesExperienceMaturityRating';
import { getIsNonZeroRevShareFromLicense } from '../utils/revShare';
import useCommonSummaryCardContainerStyles from './CommonSummaryCardContainer.styles';
import CommonSummaryCardContainerSkeleton from './CommonSummaryCardContainerSkeleton';

interface LicenseSummaryCardContainerProps {
  license: LicenseResponse;
  listingId: string;
  effectiveLicenseType: LicenseType;
}

const LicenseSummaryCardContainer: FunctionComponent<
  React.PropsWithChildren<LicenseSummaryCardContainerProps>
> = ({ license, listingId, effectiveLicenseType }) => {
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const {
    classes: { summaryContainer },
  } = useCommonSummaryCardContainerStyles();

  const { isPending, isError, data: listing } = useGetIPListing({ listingId });
  const creatorEarningsRequirementText = getCreatorEarningsRequirementText(
    license,
    effectiveLicenseType,
    translate,
    tPendingTranslation,
  );

  if (isPending) {
    return <CommonSummaryCardContainerSkeleton testId='license-summary-skeleton' />;
  }

  if (isError || !listing) {
    return (
      <Grid
        container
        className={summaryContainer}
        marginTop={1}
        alignContent='center'
        justifyContent='center'>
        <Typography variant='body1' color='secondary'>
          {translate('Description.FailedToLoadLicense')}
        </Typography>
      </Grid>
    );
  }

  const getRevShareTimingLabel = () => {
    if (getIsNonZeroRevShareFromLicense(license)) {
      if (license.enableMonetization) {
        return 'Label.RevShareOnActivation';
      }
      return 'Label.RevShareLater';
    }
    return 'Label.NotApplicable';
  };

  return (
    <Grid container flexDirection='column' width='auto'>
      <Grid item>
        <ContentTile
          thumbnailTargetId={listing.thumbnailAssetIds?.[0] ?? 0}
          header={license.name ?? ''}
          subheader={listing.name ?? ''}
          type={ContentType.License}
        />
      </Grid>
      <Grid item>
        <KeyValuePairContainer>
          <KeyValuePair
            label={translate('Label.RevenueShare')}
            value={formatRoyaltyRate(license.royaltyRate)}
          />
          <KeyValuePair
            label={translate('Label.RevShareTiming')}
            value={translate(getRevShareTimingLabel())}
          />
          {licenseUsesExperienceMaturityRating(effectiveLicenseType) && (
            <KeyValuePair
              label={translate('Label.MaximumContentMaturity')}
              value={translate(getMaturityRatingLabel(license.maxAgeRating))}
            />
          )}
          {creatorEarningsRequirementText ? (
            <KeyValuePair
              label={creatorEarningsRequirementText.label}
              value={creatorEarningsRequirementText.value}
            />
          ) : (
            <KeyValuePair
              label={translate('Label.MinimumAverageL7DAU')}
              value={translate(getDauLicenseLabelFromEnum(license.dau7DayThreshold))}
            />
          )}
        </KeyValuePairContainer>
      </Grid>
    </Grid>
  );
};

export default LicenseSummaryCardContainer;
