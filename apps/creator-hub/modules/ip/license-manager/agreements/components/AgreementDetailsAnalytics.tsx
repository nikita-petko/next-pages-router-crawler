import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import type {
  HydratedAgreementWithHydratedTargetsResponse,
  LicenseResponse,
  ListingResponse,
} from '@rbx/client-content-licensing-api/v1';
import { AgreementStatus } from '@rbx/client-content-licensing-api/v1';
import type { RobloxApiDevelopModelsUniverseModel } from '@rbx/client-develop/v1';
import type { IPFamily } from '@rbx/client-rights/v1';
import { getPrettifiedNumber, number } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { ThumbnailTypes } from '@rbx/thumbnails';
import { Typography, Grid, PeopleOutlineOutlinedIcon, makeStyles } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/components';
import Flex from '@modules/miscellaneous/components/Flex';
import IpLoadError from '../../../components/error/IpLoadError';
import AmDivider from '../../components/AmDivider';
import OverviewCard from '../../components/OverviewCard';
import { NO_GAME_FOUND_FOR_ID, useDebouncedGameDetails } from '../hooks/games';
import RevShareColorHexes from '../utils/constants';
import RevenueShareChart from './RevenueShareChart';
import RevSplitRow from './RevSplitRow';

interface AgreementDetailsAnalyticsProps {
  universe: RobloxApiDevelopModelsUniverseModel;
  ipFamily: IPFamily;
  ipListing: ListingResponse;
  license: LicenseResponse;
  agreement: HydratedAgreementWithHydratedTargetsResponse;
  transactionsCard: React.ReactNode;
}

const useStyles = makeStyles()(() => ({
  iconContainer: {
    height: '40px',
  },
}));

const AgreementDetailsAnalytics: FunctionComponent<AgreementDetailsAnalyticsProps> = ({
  universe,
  ipFamily,
  ipListing,
  license,
  agreement,
  transactionsCard,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { iconContainer },
  } = useStyles();
  const { data: gameData, isPending, isError } = useDebouncedGameDetails(universe.id);

  const revenueShares = useMemo(() => {
    if (!license || !universe || !ipFamily) {
      return [];
    }
    // Use double == to check for null or undefined
    if (license.royaltyRate == null || universe.name == null || ipFamily.name == null) {
      return [];
    }

    const iphSpliltPercentage = license.royaltyRate;
    return [
      {
        splitName: universe.name,
        percentage: 100 - iphSpliltPercentage,
        color: RevShareColorHexes[0],
      },
      { splitName: ipFamily.name, percentage: iphSpliltPercentage, color: RevShareColorHexes[1] },
    ];
  }, [license, ipFamily, universe]);

  if (isPending) {
    return <PageLoading />;
  }

  if (isError || gameData === NO_GAME_FOUND_FOR_ID) {
    return <IpLoadError />;
  }

  return (
    <>
      <Grid container spacing={3}>
        <Grid item Small={12} Medium={4}>
          <OverviewCard heading='Heading.DAU' subheading='Label.AvgL7DAU'>
            <Flex alignItems='center' gap={4}>
              <Flex justifyContent='center' alignItems='center' classes={{ root: iconContainer }}>
                <PeopleOutlineOutlinedIcon fontSize='large' />
              </Flex>
              <Typography variant='h2'>
                {getPrettifiedNumber(
                  Math.floor(agreement.agreementTargets?.[0].universeMetrics?.averageDau7Day ?? 0),
                  number.suffixNames.withPlus,
                )}
              </Typography>
            </Flex>
          </OverviewCard>
        </Grid>

        <Grid item Small={12} Medium={4}>
          <OverviewCard heading='Heading.Visits' subheading='Label.NumberExperienceVisitors'>
            <Flex alignItems='center' gap={4}>
              <Flex justifyContent='center' alignItems='center' classes={{ root: iconContainer }}>
                <PeopleOutlineOutlinedIcon fontSize='large' />
              </Flex>
              <Typography variant='h2'>
                {getPrettifiedNumber(gameData.visits ?? 0, number.suffixNames.withPlus)}
              </Typography>
            </Flex>
          </OverviewCard>
        </Grid>

        <Grid item Small={12} Medium={4}>
          {transactionsCard}
        </Grid>
      </Grid>

      {agreement.status === AgreementStatus.Active && agreement.enableMonetization && (
        <React.Fragment>
          <AmDivider />

          <Grid container>
            <Grid item container Medium={12} Large={3} direction='column' spacing={2}>
              <Grid item>
                <Typography variant='h6'>{translate('Label.RevenueShare')}</Typography>
              </Grid>
              <Grid item>
                <RevSplitRow
                  color={RevShareColorHexes[0]}
                  splitName={universe.name ?? ''}
                  assetId={universe.id ?? 0}
                  assetThumbnailType={ThumbnailTypes.gameIcon}
                  percentage={revenueShares[0].percentage}
                />
              </Grid>
              <Grid item>
                <RevSplitRow
                  color={RevShareColorHexes[1]}
                  splitName={ipFamily.name ?? ''}
                  assetId={ipListing.thumbnailAssetIds![0]}
                  assetThumbnailType={ThumbnailTypes.assetThumbnail}
                  percentage={revenueShares[1].percentage}
                />
              </Grid>
            </Grid>

            <Grid item Medium={12} Large={9}>
              <RevenueShareChart revenueShares={revenueShares} />
            </Grid>
          </Grid>
        </React.Fragment>
      )}
    </>
  );
};

export default AgreementDetailsAnalytics;
