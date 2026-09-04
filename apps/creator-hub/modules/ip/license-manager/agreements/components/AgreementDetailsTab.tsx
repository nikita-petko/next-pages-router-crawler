import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import type {
  HydratedAgreementWithHydratedTargetsResponse,
  LicenseResponse,
  ListingResponse,
} from '@rbx/client-content-licensing-api/v1';
import {
  AgreementStatus,
  LicenseDurationType,
  LicenseType,
} from '@rbx/client-content-licensing-api/v1';
import type { RobloxApiDevelopModelsUniverseModel } from '@rbx/client-develop/v1';
import { useFlag } from '@rbx/flags';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import {
  CalendarMonthOutlinedIcon,
  CircularProgress,
  Grid,
  makeStyles,
  RobuxIcon,
  Typography,
} from '@rbx/ui';
import {
  isAvatarItemLicensingEnabled as isAvatarItemLicensingEnabledFlag,
  isInGameSalesLicensingEnabled as isInGameSalesLicensingEnabledFlag,
} from '@generated/flags/contentLicensing';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { formatRoyaltyRate } from '@modules/licenses/utils/format';
import {
  getEffectiveLicenseTypeForDisplay,
  getLicenseTypeTooltipText,
  getLicenseTypeTranslationKeys,
} from '@modules/licenses/utils/licenseTypeTranslationKeys';
import { Flex } from '@modules/miscellaneous/components/Flex';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import LinkButton from '../../../components/LinkButton';
import AmDivider from '../../components/AmDivider';
import { ContentTile, ContentType } from '../../components/ContentTile';
import GuidelinesAndRestrictionsSummaryModal from '../../components/GuidelinesAndRestrictionsSummaryModal';
import { KeyValuePair, KeyValuePairContainer } from '../../components/KeyValuePair';
import OverviewCard from '../../components/OverviewCard';
import { EXTERNAL_EXPERIENCE_HREF, IP_LISTING_DETAILS_HREF } from '../../urls';
import { getCreatorDisplayName, normalizeCreatorType } from '../../utils/creatorName';
import {
  getDauLicenseLabelFromEnum,
  getCreationDauRangeLabelFromEnum,
  getLifetimeVisitsRangeLabelFromEnum,
} from '../../utils/dauEnum';
import { getMaturityRatingLabel } from '../../utils/maturityRating';
import { getRevShareTimingKeys } from '../../utils/revShareTiming';
import { getDateRangeLabel } from '../../utils/timeLimitedLicense';
import AgreementRevenueTargetsSection from './AgreementRevenueTargetsSection';
import IphViewOfCreatorIntent from './IphViewOfCreatorIntent';
import { useAgreementRevenueTargetsEligibilityImpression } from './revenueTargetAnalytics';

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
  /** Absent for licenses that do not target a universe, e.g. Avatar Marketplace. */
  universe?: RobloxApiDevelopModelsUniverseModel;
  /** Creator's name, resolved from the universe or the agreement's target account. */
  creatorName?: string;
  experienceGuidelines: string;
  transactionsCard: React.ReactNode;
}

function getUniverseCreatorName(universe: RobloxApiDevelopModelsUniverseModel | undefined): string {
  if (universe?.creatorName) {
    return getCreatorDisplayName(normalizeCreatorType(universe.creatorType), universe.creatorName);
  }
  return '';
}

const CreationDetails: React.FC<{
  universe?: RobloxApiDevelopModelsUniverseModel;
  effectiveLicenseType: LicenseType;
  agreement: HydratedAgreementWithHydratedTargetsResponse;
  experienceGuidelines: string;
}> = ({ universe, effectiveLicenseType, agreement, experienceGuidelines }) => {
  const { translate } = useTranslation();

  const universeDisplayName = universe?.name ?? '';
  const universeCreatorName = getUniverseCreatorName(universe);
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
          subheader={universeCreatorName}
          thumbnailTargetId={universeNumericId}
          type={ContentType.Universe}
          link={universeExperienceHref}
        />
      )}

      {showAgreementRevenueTargets && (
        <AgreementRevenueTargetsSection
          agreementId={agreement.id ?? undefined}
          agreementStatus={agreement.status}
          audience='iph'
          marketplaceEmptyStateAudience={isMarketplaceSaleLicense ? 'iph' : undefined}
          universeId={universeNumericId}
        />
      )}

      <KeyValuePairContainer>
        {/* TODO(MUS-2724): Add a KeyValuePair for the creator's identified L90 sales bucket. */}

        {universe && !isMarketplaceSaleLicense && (
          <>
            {agreement.status === AgreementStatus.Active && (
              <KeyValuePair label={translate('Label.ExperienceId')} value={universe.rootPlaceId} />
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
                getLifetimeVisitsRangeLabelFromEnum(
                  agreement.creatorLifetimeVisitBucket ?? undefined,
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
 * This component is rendered as the content for the IP Holder Agreement Details Page > Details tab.
 */
const AgreementDetailsTab: FunctionComponent<AgreementDetailsTabProps> = ({
  agreement,
  license,
  listing,
  universe,
  creatorName = '',
  experienceGuidelines,
  transactionsCard,
}) => {
  const { classes } = useStyles();
  const { locale } = useLocalization();
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const { isFetched } = useSettings();
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
  const keys = getRevShareTimingKeys(agreement, false, isTimeLimitedLicense);

  const [isGuidelinesAndRestrictionsModalOpen, setIsGuidelinesAndRestrictionsModalOpen] =
    useState(false);

  useAgreementRevenueTargetsEligibilityImpression({
    agreementId: agreement.id ?? undefined,
    agreementStatus: agreement.status,
    audience: 'iph',
    avatarItemLicensingEnabled: isAvatarItemLicensingEnabled,
    avatarItemLicensingFlagReady: isAvatarItemLicensingFlagReady,
    effectiveLicenseType,
    inGameSalesLicensingEnabled: isInGameSalesLicensingEnabled,
    inGameSalesLicensingFlagReady: isInGameSalesLicensingFlagReady,
    isPageReady: isFetched,
    licenseType: license.licenseType,
  });

  const openGuidelinesAndRestrictionsModal = useCallback(() => {
    setIsGuidelinesAndRestrictionsModalOpen(true);
  }, [setIsGuidelinesAndRestrictionsModalOpen]);

  let mediumValue = 6;
  if (((license.royaltyRate ?? 0) > 0 && transactionsCard) || isTimeLimitedLicense) {
    mediumValue = 4;
  }

  if (!isFetched) {
    return <CircularProgress />;
  }

  return (
    <>
      <Typography variant='h5'>{translate('Heading.Overview')}</Typography>

      <Grid container spacing={1.5}>
        {isTimeLimitedLicense && (
          <Grid item Small={12} Medium={mediumValue}>
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

        {(license.royaltyRate ?? 0) > 0 && (
          <Grid item Small={12} Medium={mediumValue}>
            <OverviewCard
              heading={translate('Label.RevenueShareTiming')}
              subheading={translate(keys.description)}>
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
            heading={translate('Label.RevenueShareRate')}
            subheading={translate('Description.RevenueShareCardIph')}>
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

      <IphViewOfCreatorIntent
        agreement={agreement}
        creatorName={creatorName}
        listingName={listing.name ?? ''}
      />

      <AmDivider />

      <CreationDetails
        agreement={agreement}
        effectiveLicenseType={effectiveLicenseType}
        experienceGuidelines={experienceGuidelines}
        universe={universe}
      />

      <AmDivider />

      <Typography variant='h5'>{translate('Heading.LicenseDetails')}</Typography>

      <ContentTile
        thumbnailTargetId={listing.thumbnailAssetIds?.[0] ?? 0}
        header={license.name ?? ''}
        subheader={listing.name ?? ''}
        type={ContentType.License}
        link={listing.id != null ? IP_LISTING_DETAILS_HREF(listing.id) : undefined}
      />

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
              <LinkButton onClick={openGuidelinesAndRestrictionsModal}>
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

      {(agreement.status === AgreementStatus.Active ||
        agreement.status === AgreementStatus.Expired ||
        agreement.status === AgreementStatus.Terminated) && (
        <Flex flexDirection='column' gap={16}>
          <AmDivider />

          <Typography variant='h5'>{translate('Heading.ActionsYouCanTake')}</Typography>
          <Typography variant='body1'>
            {agreement.status === AgreementStatus.Active
              ? translate('Description.IphActionsYouCanTakeV1')
              : // AgreementStatus.Expired  || AgreementStatus.Terminated case
                translate('Description.IphActionsYouCanTakeAfter')}
          </Typography>
        </Flex>
      )}

      <GuidelinesAndRestrictionsSummaryModal
        isOpen={isGuidelinesAndRestrictionsModalOpen}
        setOpen={setIsGuidelinesAndRestrictionsModalOpen}
        license={license}
      />
    </>
  );
};

export default AgreementDetailsTab;
