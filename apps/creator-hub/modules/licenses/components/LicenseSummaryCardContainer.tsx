import React, { FunctionComponent } from 'react';
import { Grid, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { ContentTile, ContentType } from '@modules/ip/license-manager/components/ContentTile';
import {
  KeyValuePair,
  KeyValuePairContainer,
} from '@modules/ip/license-manager/components/KeyValuePair';
import { getDauLicenseLabelFromEnum } from '@modules/ip/license-manager/utils/dauEnum';
import { getMaturityRatingLabel } from '@modules/ip/license-manager/utils/maturityRating';
import { LicenseResponse } from '@rbx/clients/contentLicensingApi/v1';
import { formatRoyaltyRate } from '../utils/format';
import useGetIPListing from '../hooks/useGetIPListing';
import CommonSummaryCardContainerSkeleton from './CommonSummaryCardContainerSkeleton';
import useCommonSummaryCardContainerStyles from './CommonSummaryCardContainer.styles';
import { getIsNonZeroRevShareFromLicense } from '../utils/revShare';

interface LicenseSummaryCardContainerProps {
  license: LicenseResponse;
  listingId: string;
}

const LicenseSummaryCardContainer: FunctionComponent<
  React.PropsWithChildren<LicenseSummaryCardContainerProps>
> = ({ license, listingId }) => {
  const { translate } = useTranslation();
  const {
    classes: { summaryContainer },
  } = useCommonSummaryCardContainerStyles();

  const { isPending, isError, data: listing } = useGetIPListing({ listingId });

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
          thumbnailTargetId={listing.thumbnailAssetIds![0]!}
          header={license.name!}
          subheader={listing.name!}
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
          <KeyValuePair
            label={translate('Label.MaximumContentMaturity')}
            value={translate(getMaturityRatingLabel(license.maxAgeRating))}
          />
          <KeyValuePair
            label={translate('Label.MinimumAverageL7DAU')}
            value={translate(getDauLicenseLabelFromEnum(license.dau7DayThreshold))}
          />
        </KeyValuePairContainer>
      </Grid>
    </Grid>
  );
};

export default LicenseSummaryCardContainer;
