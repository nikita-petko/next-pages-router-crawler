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
  LicenseType,
  LicenseVisibility,
} from '@rbx/client-content-licensing-api/v1';
import type { RobloxGamesApiModelsResponseGameDetailResponse } from '@rbx/client-games/v1';
import { useFlag } from '@rbx/flags';
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
import {
  isAvatarItemLicensingEnabled as isAvatarItemLicensingEnabledFlag,
  isInGameSalesLicensingEnabled as isInGameSalesLicensingEnabledFlag,
} from '@generated/flags/contentLicensing';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { EXPLORE_LISTING_DETAILS } from '@modules/licenses/urls';
import { formatRoyaltyRate } from '@modules/licenses/utils/format';
import {
  getEffectiveLicenseTypeForDisplay,
  getLicenseTypeTooltipText,
  getLicenseTypeTranslationKeys,
} from '@modules/licenses/utils/licenseTypeTranslationKeys';
import { Flex } from '@modules/miscellaneous/components/Flex';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isNonEmptyString } from '@modules/miscellaneous/utils';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import LinkButton from '../../../components/LinkButton';
import AgreementRevenueTargetsSection from '../../agreements/components/AgreementRevenueTargetsSection';
import { useAgreementRevenueTargetsEligibilityImpression } from '../../agreements/components/revenueTargetAnalytics';
import AmDivider from '../../components/AmDivider';
import { ContentTile, ContentType } from '../../components/ContentTile';
import GuidelinesAndRestrictionsSummaryModal from '../../components/GuidelinesAndRestrictionsSummaryModal';
import { KeyValuePair, KeyValuePairContainer } from '../../components/KeyValuePair';
import OverviewCard from '../../components/OverviewCard';
import {
  EXTERNAL_EXPERIENCE_HREF,
  ROBLOX_CREATOR_DOCS_REVIEW_LICENSE_OFFER_HREF,
} from '../../urls';
import { getCreatorDisplayName, normalizeCreatorType } from '../../utils/creatorName';
import { getDauLicenseLabelFromEnum, getCreationDauRangeLabelFromEnum } from '../../utils/dauEnum';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../../utils/logger';
import { getMaturityRatingLabel } from '../../utils/maturityRating';
import { getRevShareTimingKeys } from '../../utils/revShareTiming';
import { getDateRangeLabel } from '../../utils/timeLimitedLicense';
import CreatorIntent from './CreatorIntent';

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
  /** Absent for licenses that do not target a universe, e.g. Avatar Marketplace. */
  universe?: RobloxGamesApiModelsResponseGameDetailResponse;
  handleDisputeClick: () => void;
}

const CreationDetails: React.FC<{
  universe?: RobloxGamesApiModelsResponseGameDetailResponse;
  effectiveLicenseType: LicenseType;
  agreement: HydratedAgreementWithHydratedTargetsResponse;
  experienceGuidelines: string;
}> = ({ universe, effectiveLicenseType, agreement, experienceGuidelines }) => {
  const { translate } = useTranslation();

  const universeDisplayName = universe?.name ?? '';
  const universeNumericId = universe?.id ?? 0;
  const universeExperienceHref =
    universe?.rootPlaceId != null ? EXTERNAL_EXPERIENCE_HREF(universe.rootPlaceId) : undefined;

  const { value: inGameSalesLicensingFlagValue } = useFlag(isInGameSalesLicensingEnabledFlag);
  const isInGameSalesLicensingEnabled = inGameSalesLicensingFlagValue ?? false;
  const { value: avatarItemLicensingFlagValue } = useFlag(isAvatarItemLicensingEnabledFlag);
  const isAvatarItemLicensingEnabled = avatarItemLicensingFlagValue ?? false;

  const isMarketplaceSaleLicense =
    effectiveLicenseType === LicenseType.MarketplaceSale && isAvatarItemLicensingEnabled;
  const showAgreementRevenueTargets =
    (effectiveLicenseType === LicenseType.CollaborationInExperienceSale &&
      isInGameSalesLicensingEnabled) ||
    isMarketplaceSaleLicense;

  return (
    <>
      <Typography variant='h5'>{translate('Heading.CreationDetails')}</Typography>

      {universe && (
        <ContentTile
          header={universeDisplayName}
          subheader={
            universe.creator?.name
              ? getCreatorDisplayName(
                  normalizeCreatorType(universe.creator.type),
                  universe.creator.name,
                )
              : ''
          }
          thumbnailTargetId={universeNumericId ?? 0}
          type={ContentType.Universe}
          link={universeExperienceHref}
        />
      )}

      {showAgreementRevenueTargets && (
        <AgreementRevenueTargetsSection
          agreementId={agreement.id ?? undefined}
          agreementStatus={agreement.status}
          audience='creator'
          marketplaceEmptyStateAudience={isMarketplaceSaleLicense ? 'creator' : undefined}
          showMonetizationLinks
          universeId={universeNumericId}
        />
      )}

      <KeyValuePairContainer>
        {/* TODO(MUS-2724): Add a KeyValuePair for the creator's identified L90 sales bucket. */}

        {universe && !isMarketplaceSaleLicense && (
          <>
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
          </>
        )}
      </KeyValuePairContainer>
    </>
  );
};

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
  const translation = useTranslation();
  const { translate, translateHTML } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const { locale } = useLocalization();
  const { logEvent } = useLicenseManagerLogger();
  const { isFetched, settings } = useSettings();
  const { ready: isInGameSalesLicensingFlagReady, value: inGameSalesLicensingFlagValue } = useFlag(
    isInGameSalesLicensingEnabledFlag,
  );
  const isInGameSalesLicensingEnabled = inGameSalesLicensingFlagValue ?? false;
  const { ready: isAvatarItemLicensingFlagReady, value: avatarItemLicensingFlagValue } = useFlag(
    isAvatarItemLicensingEnabledFlag,
  );
  const isAvatarItemLicensingEnabled = avatarItemLicensingFlagValue ?? false;
  const effectiveLicenseType = getEffectiveLicenseTypeForDisplay(
    license.licenseType,
    isInGameSalesLicensingEnabled,
    isAvatarItemLicensingEnabled,
  );
  const licenseTypeLabels = getLicenseTypeTranslationKeys(effectiveLicenseType);
  const licenseTypeTooltipText = getLicenseTypeTooltipText(
    effectiveLicenseType,
    translate,
    tPendingTranslation,
  );
  const isMarketplaceSaleLicense = effectiveLicenseType === LicenseType.MarketplaceSale;
  const isTimeLimitedLicense =
    license.licenseDuration?.durationType === LicenseDurationType.TimeLimited;
  const keys = getRevShareTimingKeys(agreement, true, isTimeLimitedLicense);
  const [isGuidelinesAndRestrictionsModalOpen, setIsGuidelinesAndRestrictionsModalOpen] =
    useState(false);

  useAgreementRevenueTargetsEligibilityImpression({
    agreementId: agreement.id ?? undefined,
    agreementStatus: agreement.status,
    audience: 'creator',
    avatarItemLicensingEnabled: isAvatarItemLicensingEnabled,
    avatarItemLicensingFlagReady: isAvatarItemLicensingFlagReady,
    effectiveLicenseType,
    inGameSalesLicensingEnabled: isInGameSalesLicensingEnabled,
    inGameSalesLicensingFlagReady: isInGameSalesLicensingFlagReady,
    isPageReady: isFetched,
    licenseType: license.licenseType,
  });

  const handleGuidelinesAndRestrictionsClick = useCallback(async () => {
    const id = agreement.id;
    if (isNonEmptyString(id)) {
      logEvent(LicenseManagerClickEvent.CreatorAgreementDetailsPageViewContentStandardsClickEvent, {
        agreementId: id,
      });
    }

    setIsGuidelinesAndRestrictionsModalOpen(true);
  }, [logEvent, agreement.id, setIsGuidelinesAndRestrictionsModalOpen]);

  const licenseEducationText = universe && (
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
            <OverviewCard
              heading={translate('Header.AgreementDuration')}
              subheading={translate('Body.AgreementDuration')}>
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
            <OverviewCard
              heading={translate('Label.RevenueShareTiming')}
              subheading={translate(keys.description)}>
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
            heading={translate('Label.RevenueShareRate')}
            subheading={translate('Description.RevenueShareCardCreator')}>
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
              heading={translate('Label.GuidelinesAmpersandRestrictions')}
              subheading={translate('Description.ContentGuidelinesCard')}>
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
        {isInGameSalesLicensingEnabled && (
          <KeyValuePair
            label={translate('Label.LicenseType')}
            value={translate(licenseTypeLabels.detail)}
            tooltipText={licenseTypeTooltipText}
          />
        )}

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

        {!isMarketplaceSaleLicense && (
          <>
            <KeyValuePair
              label={translate('Label.MaximumContentMaturity')}
              value={translate(getMaturityRatingLabel(license.maxAgeRating))}
              tooltipText={translate('Label.TooltipMaxContentMaturity')}
            />

            <KeyValuePair
              label={translate('Label.MinimumAverageL7DAU')}
              value={translate(getDauLicenseLabelFromEnum(license.dau7DayThreshold))}
            />
          </>
        )}

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

      <CreatorIntent agreement={agreement} />

      <AmDivider />

      <CreationDetails
        agreement={agreement}
        universe={universe}
        effectiveLicenseType={effectiveLicenseType}
        experienceGuidelines={experienceGuidelines}
      />

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
  TranslationNamespace.Navigation,
]);
