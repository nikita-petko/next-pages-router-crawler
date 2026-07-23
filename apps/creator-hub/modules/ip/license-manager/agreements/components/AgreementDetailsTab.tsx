import React, { FunctionComponent, useCallback, useState } from 'react';
import {
  CalendarMonthOutlinedIcon,
  CircularProgress,
  Grid,
  makeStyles,
  RobuxIcon,
  Typography,
} from '@rbx/ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { formatRoyaltyRate } from '@modules/licenses/utils/format';
import { Flex } from '@modules/miscellaneous/common/components';
import { RobloxApiDevelopModelsUniverseModel } from '@rbx/clients/develop';
import {
  AgreementStatus,
  HydratedAgreementWithHydratedTargetsResponse,
  LicenseDurationType,
  LicenseResponse,
  ListingResponse,
} from '@rbx/clients/contentLicensingApi/v1';
import { useSettings } from '@modules/settings';

import { ContentTile, ContentType } from '../../components/ContentTile';
import AmDivider from '../../components/AmDivider';
import LinkButton from '../../../components/LinkButton';
import { KeyValuePair, KeyValuePairContainer } from '../../components/KeyValuePair';
import OverviewCard from '../../components/OverviewCard';
import { EXTERNAL_EXPERIENCE_HREF, IP_LISTING_DETAILS_HREF } from '../../urls';
import {
  getDauLicenseLabelFromEnum,
  getCreationDauRangeLabelFromEnum,
  getLifetimeVisitsRangeLabelFromEnum,
} from '../../utils/dauEnum';
import { getMaturityRatingLabel } from '../../utils/maturityRating';
import GuidelinesAndRestrictionsSummaryModal from '../../components/GuidelinesAndRestrictionsSummaryModal';
import { getDateRangeLabel } from '../../utils/timeLimitedLicense';
import { getRevShareTimingKeys } from '../../utils/revShareTiming';

const useStyles = makeStyles()(() => ({
  iconContainer: {
    height: '40px',
  },
  inlineLinkButton: {
    paddingTop: '2px',
  },
}));

interface AgreementDetailsTabProps {
  agreement: HydratedAgreementWithHydratedTargetsResponse;
  license: LicenseResponse;
  listing: ListingResponse;
  universe: RobloxApiDevelopModelsUniverseModel;
  experienceGuidelines: string;
  transactionsCard: React.ReactNode;
}

/**
 * This component is rendered as the content for the IP Holder Agreement Details Page > Details tab.
 */
const AgreementDetailsTab: FunctionComponent<AgreementDetailsTabProps> = ({
  agreement,
  license,
  listing,
  universe,
  experienceGuidelines,
  transactionsCard,
}) => {
  const { classes } = useStyles();
  const { locale } = useLocalization();
  const { translate } = useTranslation();
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;
  const isTimeLimitedLicense =
    enableIpPlatformTimeboundLicenses &&
    license.licenseDuration?.durationType === LicenseDurationType.TimeLimited;
  const keys = getRevShareTimingKeys(agreement, false, isTimeLimitedLicense);

  const [isGuidelinesAndRestrictionsModalOpen, setIsGuidelinesAndRestrictionsModalOpen] =
    useState(false);

  const openGuidelinesAndRestrictionsModal = useCallback(() => {
    setIsGuidelinesAndRestrictionsModalOpen(true);
  }, []);

  let mediumValue = 6;
  if ((license.royaltyRate! > 0 && transactionsCard) || isTimeLimitedLicense) {
    mediumValue = 4;
  }

  if (!isFetched) {
    return <CircularProgress />;
  }

  return (
    <React.Fragment>
      <Typography variant='h5'>{translate('Heading.Overview')}</Typography>

      <Grid container spacing={3}>
        {isTimeLimitedLicense && (
          <Grid item Small={12} Medium={mediumValue}>
            <OverviewCard heading='Header.AgreementDuration' subheading='Body.AgreementDuration'>
              <Flex alignItems='center' gap={4}>
                <Flex
                  justifyContent='center'
                  alignItems='center'
                  classes={{ root: classes.iconContainer }}>
                  <CalendarMonthOutlinedIcon fontSize='large' />
                </Flex>
                <Typography variant='h2'>
                  {getDateRangeLabel(
                    agreement.startTime,
                    agreement.endTime,
                    locale ?? Locale.English,
                  )}
                </Typography>
              </Flex>
            </OverviewCard>
          </Grid>
        )}

        {license.royaltyRate! > 0 && (
          <Grid item Small={12} Medium={mediumValue}>
            <OverviewCard heading='Label.RevenueShareTiming' subheading={keys.description}>
              <Flex alignItems='center' gap={4}>
                <Flex
                  justifyContent='center'
                  alignItems='center'
                  classes={{ root: classes.iconContainer }}>
                  <RobuxIcon fontSize='large' />
                </Flex>
                <Typography variant='h2'>{translate(keys.iconLabel)}</Typography>
              </Flex>
            </OverviewCard>
          </Grid>
        )}

        <Grid item Small={12} Medium={mediumValue}>
          <OverviewCard
            heading='Label.RevenueShareRate'
            subheading='Description.RevenueShareCardIph'>
            <Flex alignItems='center' gap={4}>
              <Flex
                justifyContent='center'
                alignItems='center'
                classes={{ root: classes.iconContainer }}>
                <RobuxIcon fontSize='large' />
              </Flex>
              <Typography variant='h2'>{formatRoyaltyRate(license.royaltyRate)}</Typography>
            </Flex>
          </OverviewCard>
        </Grid>

        {transactionsCard && (
          <Grid item Small={12} Medium={mediumValue}>
            {transactionsCard}
          </Grid>
        )}
      </Grid>

      <AmDivider />

      <Typography variant='h5'>{translate('Heading.CreationDetails')}</Typography>

      <ContentTile
        header={universe.name!}
        subheader={`@${universe.creatorName}`}
        thumbnailTargetId={universe.id!}
        type={ContentType.Universe}
        link={EXTERNAL_EXPERIENCE_HREF(universe.rootPlaceId!)}
      />

      <KeyValuePairContainer>
        {agreement.status === AgreementStatus.Active && (
          <KeyValuePair label={translate('Label.ExperienceId')} value={universe.rootPlaceId!} />
        )}

        <KeyValuePair
          label={translate('Label.ContentMaturity')}
          value={experienceGuidelines}
          tooltipText={translate('Label.TooltipContentMaturity')}
        />

        <KeyValuePair
          label={translate('Label.RangeDau')}
          value={translate(
            getCreationDauRangeLabelFromEnum(
              agreement.agreementTargets?.[0].universeMetrics?.dau7DayBucket,
            ),
          )}
        />

        <KeyValuePair
          label={translate('Label.LifetimeVisitsRangeVerbose')}
          value={translate(
            getLifetimeVisitsRangeLabelFromEnum(agreement.creatorLifetimeVisitBucket ?? undefined),
          )}
        />

        <KeyValuePair
          label={translate('Label.Description')}
          value={
            // Ensures description matches formatting on Experience Detail Page
            <Typography whiteSpace='pre-wrap'>{universe.description}</Typography>
          }
        />
      </KeyValuePairContainer>

      <AmDivider />

      <Typography variant='h5'>{translate('Heading.LicenseDetails')}</Typography>

      <ContentTile
        thumbnailTargetId={listing.thumbnailAssetIds![0]!}
        header={license.name!}
        subheader={listing.name!}
        type={ContentType.License}
        link={IP_LISTING_DETAILS_HREF(listing.id!)}
      />

      <KeyValuePairContainer>
        <KeyValuePair
          label={translate('Label.RevenueShare')}
          value={formatRoyaltyRate(license.royaltyRate)}
          tooltipText={translate('Label.TooltipGrossRevShare')}
        />

        <KeyValuePair
          label={translate('Label.GuidelinesAndRestrictions')}
          value={
            <Flex>
              <LinkButton onClick={openGuidelinesAndRestrictionsModal}>
                <Typography variant='body1'>{translate('Action.View')}</Typography>
              </LinkButton>
            </Flex>
          }
          tooltipText={translate('Label.TooltipGuidelinesAndRestrictions')}
        />

        <KeyValuePair
          label={translate('Label.MaximumContentMaturity')}
          value={translate(getMaturityRatingLabel(license.maxAgeRating))}
          tooltipText={translate('Label.TooltipMaxContentMaturity')}
        />

        <KeyValuePair
          label={translate('Label.MinimumAverageL7DAU')}
          value={translate(getDauLicenseLabelFromEnum(license.dau7DayThreshold))}
        />

        <KeyValuePair
          label={translate('Label.Description')}
          value={<Typography whiteSpace='pre-wrap'>{license.description}</Typography>}
        />
      </KeyValuePairContainer>

      {(agreement.status === AgreementStatus.Active ||
        (isTimeLimitedLicense && agreement.status === AgreementStatus.Terminated)) && (
        <Flex flexDirection='column' gap={16}>
          <AmDivider />

          <Typography variant='h5'>{translate('Heading.ActionsYouCanTake')}</Typography>
          <Typography variant='body1'>
            {agreement.status === AgreementStatus.Active
              ? translate('Description.IphActionsYouCanTakeV1')
              : // isTimeLimitedLicense && agreement.status === AgreementStatus.Terminated case
                'If you believe that the Creator continued to use IP and you are deserving of a funds clawback action, please email IP Ops. If you want to DMCA, please also still email IP Ops.'}
          </Typography>
        </Flex>
      )}

      <GuidelinesAndRestrictionsSummaryModal
        isOpen={isGuidelinesAndRestrictionsModalOpen}
        setOpen={setIsGuidelinesAndRestrictionsModalOpen}
        license={license}
      />
    </React.Fragment>
  );
};

export default AgreementDetailsTab;
