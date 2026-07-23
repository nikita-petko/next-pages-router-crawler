import React, { useCallback, useState } from 'react';
import type {
  HydratedAgreementWithHydratedTargetsResponse,
  LicenseResponse,
  ListingResponse,
} from '@rbx/client-content-licensing-api/v1';
import {
  AgreementStatus,
  AgreementTransition,
  LicenseDurationType,
  LicenseVisibility,
} from '@rbx/client-content-licensing-api/v1';
import type { RobloxGamesApiModelsResponseGameDetailResponse } from '@rbx/client-games/v1';
import { Locale, useLocalization, useTranslation, withTranslation } from '@rbx/intl';
import {
  AccessTimeIcon,
  Button,
  Typography,
  Link,
  RobuxIcon,
  makeStyles,
  Grid,
  CircularProgress,
  CalendarMonthOutlinedIcon,
} from '@rbx/ui';
import { EXPLORE_LISTING_DETAILS } from '@modules/licenses/urls';
import { formatRoyaltyRate } from '@modules/licenses/utils/format';
import { Flex } from '@modules/miscellaneous/components/Flex';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isNonEmptyString } from '@modules/miscellaneous/utils';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import LinkButton from '../../../components/LinkButton';
import AmDivider from '../../components/AmDivider';
import { ContentTile, ContentType } from '../../components/ContentTile';
import GuidelinesAndRestrictionsSummaryModal from '../../components/GuidelinesAndRestrictionsSummaryModal';
import { KeyValuePair, KeyValuePairContainer } from '../../components/KeyValuePair';
import OverviewCard from '../../components/OverviewCard';
import {
  EXTERNAL_EXPERIENCE_HREF,
  ROBLOX_CREATOR_DOCS_REVIEW_LICENSE_OFFER_HREF,
} from '../../urls';
import { getDauLicenseLabelFromEnum, getCreationDauRangeLabelFromEnum } from '../../utils/dauEnum';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../../utils/logger';
import { getMaturityRatingLabel } from '../../utils/maturityRating';
import { getRevShareTimingKeys } from '../../utils/revShareTiming';
import { getDateRangeLabel } from '../../utils/timeLimitedLicense';

const useStyles = makeStyles()(() => ({
  iconContainer: {
    height: '40px',
  },
  inlineLinkButton: {
    paddingTop: '2px',
  },
}));

interface CreatorAgreementDetailsProps {
  agreement: HydratedAgreementWithHydratedTargetsResponse;
  license: LicenseResponse;
  listing: ListingResponse;
  experienceGuidelines: string;
  universe: RobloxGamesApiModelsResponseGameDetailResponse;
  handleDisputeClick: () => void;
}

/**
 * This component is rendered as the content for the Creator Agreement Details Page > Details tab.
 */
const CreatorAgreementDetailsTabContent: React.FC<CreatorAgreementDetailsProps> = ({
  agreement,
  license,
  listing,
  experienceGuidelines,
  universe,
  handleDisputeClick,
}) => {
  const { classes } = useStyles();
  const { translate, translateHTML } = useTranslation();
  const { locale } = useLocalization();
  const { logEvent } = useLicenseManagerLogger();
  const { isFetched, settings } = useSettings();
  const isTimeLimitedLicense =
    license.licenseDuration?.durationType === LicenseDurationType.TimeLimited;
  const keys = getRevShareTimingKeys(agreement, true, isTimeLimitedLicense);
  const [isGuidelinesAndRestrictionsModalOpen, setIsGuidelinesAndRestrictionsModalOpen] =
    useState(false);

  const handleGuidelinesAndRestrictionsClick = useCallback(async () => {
    const id = agreement.id;
    if (isNonEmptyString(id)) {
      logEvent(LicenseManagerClickEvent.CreatorAgreementDetailsPageViewContentStandardsClickEvent, {
        agreementId: id,
      });
    }

    setIsGuidelinesAndRestrictionsModalOpen(true);
  }, [logEvent, agreement.id, setIsGuidelinesAndRestrictionsModalOpen]);

  const licenseEducationText = (
    <Typography variant='body1'>
      {translateHTML(
        'Description.ReceivedLicenseEducation',
        [
          {
            opening: 'listingStart',
            closing: 'listingEnd',
            content(chunks) {
              return <b>{chunks}</b>;
            },
          },
          {
            opening: 'creationStart',
            closing: 'creationEnd',
            content(chunks) {
              const rootPlaceId = universe.rootPlaceId;
              if (rootPlaceId == null) {
                return <Typography variant='h6'>{chunks}</Typography>;
              }
              return (
                <Link href={EXTERNAL_EXPERIENCE_HREF(rootPlaceId)} target='_blank'>
                  <Typography variant='h6'>{chunks}</Typography>
                </Link>
              );
            },
          },
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content(chunks) {
              return (
                <Link href={ROBLOX_CREATOR_DOCS_REVIEW_LICENSE_OFFER_HREF} target='_blank'>
                  {chunks}
                </Link>
              );
            },
          },
        ],
        {
          listingName: listing.name,
          creationName: universe.name,
        },
      )}
    </Typography>
  );

  const isNonZeroRevShareRate = (license.royaltyRate ?? 0) > 0;

  if (!isFetched) {
    return <CircularProgress />;
  }

  const { enableIpPlatformConditionalOffers } = settings;

  const isConditionalOfferAgreement =
    enableIpPlatformConditionalOffers && agreement.status === AgreementStatus.ConditionalOffer;
  const showActionsYouCanTake =
    agreement.status === AgreementStatus.Pending || isConditionalOfferAgreement;

  const disputeLinkTags = [
    {
      opening: 'linkStart',
      closing: 'linkEnd',
      content(chunks: React.ReactNode) {
        return (
          <LinkButton className={classes.inlineLinkButton} onClick={handleDisputeClick}>
            {chunks}
          </LinkButton>
        );
      },
    },
  ];

  const formattedStatusExpireDate =
    agreement.statusExpireAt?.toLocaleDateString(locale ?? Locale.English, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }) ?? '';

  const actionsYouCanTakeBody = isConditionalOfferAgreement
    ? translateHTML('Description.ConditionalOfferCreatorActions', disputeLinkTags, {
        date: formattedStatusExpireDate,
      })
    : translateHTML('Description.DisputeReceivedLicense', disputeLinkTags, {
        date: formattedStatusExpireDate,
      });

  const licenseThumbnailId = listing.thumbnailAssetIds?.[0];
  const licenseDisplayName = license.name ?? '';
  const listingDisplayName = listing.name ?? '';
  const publicListingHref =
    license.visibility === LicenseVisibility.Public && isNonEmptyString(listing.id)
      ? EXPLORE_LISTING_DETAILS(listing.id)
      : undefined;

  const universeDisplayName = universe.name ?? '';
  const universeNumericId = universe.id;
  const universeExperienceHref =
    universe.rootPlaceId != null ? EXTERNAL_EXPERIENCE_HREF(universe.rootPlaceId) : undefined;

  return (
    <>
      <Typography variant='h5'>{translate('Heading.Overview')}</Typography>

      {
        // Show received license education text only for licenses offered by IPH
        agreement.activityLog &&
          agreement.activityLog.length > 0 &&
          agreement.activityLog[0].transition === AgreementTransition.Offer &&
          licenseEducationText
      }

      <Grid container spacing={1.5}>
        {isTimeLimitedLicense && (
          <Grid item Small={12} Medium={isNonZeroRevShareRate ? 4 : 6}>
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

        {isNonZeroRevShareRate && (
          <Grid item Small={12} Medium={4}>
            <OverviewCard heading='Label.RevenueShareTiming' subheading={keys.description}>
              <Flex alignItems='center' gap={4}>
                <Flex
                  justifyContent='center'
                  alignItems='center'
                  classes={{ root: classes.iconContainer }}>
                  <AccessTimeIcon fontSize='large' />
                </Flex>
                <Typography variant='h2'>{translate(keys.iconLabel)}</Typography>
              </Flex>
            </OverviewCard>
          </Grid>
        )}

        <Grid item Small={12} Medium={isNonZeroRevShareRate ? 4 : 6}>
          <OverviewCard
            heading='Label.RevenueShareRate'
            subheading='Description.RevenueShareCardCreator'>
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

        {!isTimeLimitedLicense && (
          <Grid item Small={12} Medium={isNonZeroRevShareRate ? 4 : 6}>
            <OverviewCard
              heading='Label.GuidelinesAmpersandRestrictions'
              subheading='Description.ContentGuidelinesCard'>
              <Flex alignItems='center' gap={4}>
                <Button
                  variant='contained'
                  color='secondary'
                  size='medium'
                  onClick={handleGuidelinesAndRestrictionsClick}>
                  {translate('Action.View')}
                </Button>
              </Flex>
            </OverviewCard>
          </Grid>
        )}
      </Grid>

      <AmDivider />

      <Typography variant='h5'>{translate('Heading.LicenseDetails')}</Typography>

      {licenseThumbnailId != null && (
        <ContentTile
          thumbnailTargetId={licenseThumbnailId}
          header={licenseDisplayName}
          subheader={listingDisplayName}
          type={ContentType.License}
          link={publicListingHref}
        />
      )}

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
              <LinkButton onClick={handleGuidelinesAndRestrictionsClick}>
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

      {showActionsYouCanTake && (
        <Flex flexDirection='column' gap={16}>
          <AmDivider />

          <Typography variant='h5'>{translate('Heading.ActionsYouCanTake')}</Typography>

          <Typography variant='body1'>{actionsYouCanTakeBody}</Typography>
        </Flex>
      )}

      <AmDivider />

      <Typography variant='h5'>{translate('Heading.CreationDetails')}</Typography>

      {universeNumericId != null && (
        <ContentTile
          header={universeDisplayName}
          subheader={universe.creator?.name ? `@${universe.creator.name}` : ''}
          thumbnailTargetId={universeNumericId}
          type={ContentType.Universe}
          link={universeExperienceHref}
        />
      )}

      <KeyValuePairContainer>
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
          label={translate('Label.Description')}
          value={
            // Ensures description matches formatting on Experience Detail Page
            <Typography whiteSpace='pre-wrap'>{universe.description}</Typography>
          }
        />
      </KeyValuePairContainer>

      <GuidelinesAndRestrictionsSummaryModal
        isOpen={isGuidelinesAndRestrictionsModalOpen}
        setOpen={setIsGuidelinesAndRestrictionsModalOpen}
        license={license}
        isCreator
      />
    </>
  );
};

export default withTranslation(CreatorAgreementDetailsTabContent, [
  TranslationNamespace.Licenses,
  TranslationNamespace.Error,
  TranslationNamespace.AgreementsManager,
]);
