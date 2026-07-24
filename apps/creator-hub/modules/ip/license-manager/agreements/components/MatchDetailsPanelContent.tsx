import type { FunctionComponent } from 'react';
import React, { type ReactNode } from 'react';
import Link from 'next/link';
import {
  AgreementStatus,
  type AgreementCandidateResponse,
} from '@rbx/client-content-licensing-api/v1';
import { useFlag } from '@rbx/flags';
import { Icon, IconButton, Link as FoundationLink } from '@rbx/foundation-ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { Typography, Button, Alert, CircularProgress } from '@rbx/ui';
import { isExperiencePreviewEnabled as isExperiencePreviewEnabledFlag } from '@generated/flags/contentLicensing';
import Flex from '@modules/miscellaneous/components/Flex';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { useIpFamilyQuery } from '../../../ipFamilies/hooks/ipFamily';
import { ContentTile, ContentType } from '../../components/ContentTile';
import { KeyValuePair, KeyValuePairContainer } from '../../components/KeyValuePair';
import {
  EXTERNAL_EXPERIENCE_HREF,
  IPH_AGREEMENT_DETAILS_HREF,
  IPH_MATCH_DETAILS_TAB_HREF,
} from '../../urls';
import {
  getCreationDauRangeLabelFromEnum,
  getLifetimeVisitsRangeLabelFromEnum,
} from '../../utils/dauEnum';
import MatchDetailsTabs from '../enums/MatchDetailsTabs';
import useDebouncedContentMaturity, {
  NO_CONTENT_MATURITY_FOUND_FOR_ID,
} from '../hooks/experienceGuidelines';
import { NO_GAME_FOUND_FOR_ID, useDebouncedGameDetails } from '../hooks/games';
import type { AgreementStatusBatchItemError } from '../hooks/useAgreementStatusesByIdsQuery';
import { useGetPlacefileImagesQuery } from '../hooks/useGetPlacefileImagesQuery';
import { usePlacefileImageUrlsQuery } from '../hooks/usePlacefileImageUrlsQuery';
import formatDate from '../utils/formatDate';
import DetectedScreenshotsGrid from './DetectedScreenshotsGrid';
import {
  AgreementStatusFromBatchMaps,
  type AgreementStatusesColumnProps,
} from './IphMatchStatusLabel';
import MatchPanelLayout from './MatchPanelLayout';

const AGREEMENT_STATUSES_FOR_VIEW_AGREEMENT = new Set<AgreementStatus>([
  AgreementStatus.Disputed,
  AgreementStatus.Inquired,
  AgreementStatus.Accepted,
]);

/** Agreement status for this candidate from the same batch query as {@link MatchesTable} (React Query cache). */
export interface MatchPanelAgreementStatus {
  status: AgreementStatus | undefined;
  /** Per-agreement error from batch status API (e.g. agreement not found). */
  rowError?: AgreementStatusBatchItemError;
  isPending: boolean;
  isError: boolean;
}

/** Controls prev/next navigation within the matches table while the details panel is open. */
export interface MatchDetailsPanelNavigation {
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

interface MatchDetailsPanelContentProps {
  candidate: AgreementCandidateResponse;
  onClose: () => void;
  onOfferLicense: () => void;
  /** From {@link Matches} agreement status batch query when the candidate has an agreement id. */
  agreementStatusFromList?: MatchPanelAgreementStatus;
  navigation?: MatchDetailsPanelNavigation;
}

/**
 * Show details about a match to IPH along with button to progress to the send offer step
 */
const MatchDetailsPanelContent: FunctionComponent<MatchDetailsPanelContentProps> = ({
  candidate,
  onClose,
  onOfferLicense,
  agreementStatusFromList,
  navigation,
}) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const resolvedLocale = locale ?? Locale.English;
  const { isFetched } = useSettings();

  const experienceId = Number(candidate.candidateId);
  const { ready: isExperiencePreviewFlagReady, value: isExperiencePreviewEnabled } = useFlag(
    isExperiencePreviewEnabledFlag,
    { universeId: experienceId },
  );
  const showPlacefileScreenshots = isExperiencePreviewFlagReady && isExperiencePreviewEnabled;

  const gameRequest = useDebouncedGameDetails(experienceId);
  const maturityRequest = useDebouncedContentMaturity(experienceId);
  const ipFamilyRequest = useIpFamilyQuery(candidate.ipFamilyId ?? undefined);
  const placefileImagesQuery = useGetPlacefileImagesQuery({
    agreementCandidateId: candidate.id ?? undefined,
    enabled: showPlacefileScreenshots,
  });
  const placefileAssetIds = placefileImagesQuery.data ?? [];
  const placefileImageUrlsQuery = usePlacefileImageUrlsQuery(placefileAssetIds);
  const resolvedScreenshotUrls = placefileAssetIds
    .map((assetId) => placefileImageUrlsQuery.data?.get(assetId))
    .filter((imageUrl): imageUrl is string => Boolean(imageUrl));
  const screenshotItems = placefileAssetIds
    .map((assetId) => {
      const imageUrl = placefileImageUrlsQuery.data?.get(assetId);
      return imageUrl ? { assetId, imageUrl } : null;
    })
    .filter((entry): entry is { assetId: number; imageUrl: string } => entry !== null);
  const isScreenshotsLoading =
    placefileImagesQuery.isLoading ||
    (placefileAssetIds.length > 0 && placefileImageUrlsQuery.isLoading);

  const agreementId = candidate.agreementId ?? undefined;

  const isPending = gameRequest.isPending || maturityRequest.isPending || ipFamilyRequest.isPending;

  const hasError =
    (gameRequest.error ?? maturityRequest.error ?? ipFamilyRequest.error) != null ||
    gameRequest.data === NO_GAME_FOUND_FOR_ID;

  const title = translate('Heading.ViewMatch');

  const headerControls = (
    <>
      <IconButton
        type='button'
        variant='Utility'
        size='Medium'
        icon='icon-filled-chevron-large-left'
        ariaLabel={translate('Label.Previous')}
        isCircular
        onClick={navigation?.onPrevious}
        isDisabled={!navigation?.canGoPrevious}
      />
      <IconButton
        type='button'
        variant='Utility'
        size='Medium'
        icon='icon-filled-chevron-large-right'
        ariaLabel={translate('Label.Next')}
        isCircular
        onClick={navigation?.onNext}
        isDisabled={!navigation?.canGoNext}
      />
    </>
  );

  if (isPending || !isFetched) {
    return (
      <MatchPanelLayout title={title} onClose={onClose} headerControls={headerControls} loading />
    );
  }

  const game = gameRequest.data;

  if (hasError) {
    return (
      <MatchPanelLayout title={title} onClose={onClose} headerControls={headerControls}>
        <Typography color='error'>{translate('Error.LoadingData')}</Typography>
      </MatchPanelLayout>
    );
  }

  const contentMaturity =
    maturityRequest.error != null || maturityRequest.data === NO_CONTENT_MATURITY_FOUND_FOR_ID
      ? translate('Label.MaturityRatingNoneAvailable')
      : maturityRequest.data;
  const ipFamily = ipFamilyRequest.data;

  if (!game || game === NO_GAME_FOUND_FOR_ID) {
    return (
      <MatchPanelLayout title={title} onClose={onClose} headerControls={headerControls}>
        <Typography color='error'>
          {translate('Error.ExperienceNotAvailable', {
            id: `${experienceId}`,
          })}
        </Typography>
      </MatchPanelLayout>
    );
  }

  const gameDescription = game.description?.trim()
    ? game.description
    : translate('Label.NoDescriptionAvailable');

  const rowError = agreementStatusFromList?.rowError;
  const statusFromList = agreementStatusFromList?.status;
  const waitingOnAgreementStatus = !!agreementId && !!agreementStatusFromList?.isPending;

  const showViewAgreement =
    !!agreementId &&
    !rowError &&
    statusFromList !== undefined &&
    AGREEMENT_STATUSES_FOR_VIEW_AGREEMENT.has(statusFromList);

  const agreementCandidateId = candidate.id;
  const matchDetailsPageHref =
    agreementCandidateId != null
      ? IPH_MATCH_DETAILS_TAB_HREF(agreementCandidateId, MatchDetailsTabs.Details)
      : undefined;
  const matchScreenshotsGalleryHref =
    agreementCandidateId != null
      ? IPH_MATCH_DETAILS_TAB_HREF(agreementCandidateId, MatchDetailsTabs.Gallery)
      : undefined;

  const viewDetailsButtonLabel = translate('Action.ViewDetails');
  const viewGalleryLinkLabel = translate('Action.ViewGallery');

  // The screenshots are captured when the match candidate is created, so surface that same date.
  const imagesAsOfDate = candidate.discoveredAt
    ? formatDate(candidate.discoveredAt, resolvedLocale)
    : translate('Label.Unknown');

  const resolvedScreenshotCount = resolvedScreenshotUrls.length;
  const showScreenshotsSection =
    showPlacefileScreenshots && (isScreenshotsLoading || resolvedScreenshotCount > 0);
  let screenshotsTitle: string;
  if (isScreenshotsLoading) {
    screenshotsTitle = translate('Label.DetectedScreenshots');
  } else if (resolvedScreenshotCount === 1) {
    screenshotsTitle = translate('Label.DetectedScreenshotsWithImageCountSingular');
  } else {
    screenshotsTitle = translate('Label.DetectedScreenshotsWithImageCount', {
      count: String(resolvedScreenshotCount),
    });
  }

  let primaryCta: ReactNode;
  if (waitingOnAgreementStatus) {
    primaryCta = (
      <Button
        variant='contained'
        color='primaryBrand'
        size='large'
        fullWidth={!showPlacefileScreenshots}
        className={showPlacefileScreenshots ? 'fill' : undefined}
        disabled>
        <CircularProgress color='inherit' size={22} />
      </Button>
    );
  } else if (showViewAgreement) {
    primaryCta = (
      <Button
        variant='contained'
        color='primaryBrand'
        size='large'
        fullWidth={!showPlacefileScreenshots}
        className={showPlacefileScreenshots ? 'fill' : undefined}
        component={Link}
        href={IPH_AGREEMENT_DETAILS_HREF(agreementId)}>
        {translate('Action.ViewAgreement')}
      </Button>
    );
  } else {
    primaryCta = (
      <Button
        variant='contained'
        color='primaryBrand'
        size='large'
        fullWidth={!showPlacefileScreenshots}
        className={showPlacefileScreenshots ? 'fill' : undefined}
        onClick={onOfferLicense}>
        {translate('Action.OfferLicense')}
      </Button>
    );
  }

  const footerButtons =
    showPlacefileScreenshots && matchDetailsPageHref != null ? (
      <>
        {primaryCta}
        <Button
          variant='contained'
          color='secondary'
          size='large'
          component={Link}
          href={matchDetailsPageHref}
          className='fill'>
          {viewDetailsButtonLabel}
        </Button>
      </>
    ) : (
      primaryCta
    );

  return (
    <MatchPanelLayout
      title={title}
      onClose={onClose}
      headerControls={headerControls}
      buttons={footerButtons}>
      {rowError && <Alert severity='error'>{translate('Label.ErrorFetchingStatus')}</Alert>}
      <Flex flexDirection='column'>
        <Typography variant='h6'>{translate('Label.Creation')}</Typography>
        <div>
          <ContentTile
            header={game.name ?? ''}
            subheader={game.creator?.name ? `@${game.creator.name}` : ''}
            thumbnailTargetId={game.id ?? experienceId}
            type={ContentType.Universe}
            link={game.rootPlaceId != null ? EXTERNAL_EXPERIENCE_HREF(game.rootPlaceId) : undefined}
          />
        </div>

        <KeyValuePairContainer>
          <KeyValuePair
            label={translate('Label.Description')}
            value={<Typography whiteSpace='pre-wrap'>{gameDescription}</Typography>}
          />
          <KeyValuePair label={translate('Label.ContentMaturity')} value={contentMaturity} />
          <KeyValuePair
            label={translate('Label.DauRange')}
            value={translate(getCreationDauRangeLabelFromEnum(candidate.dau7DayBucket))}
          />
          <KeyValuePair
            label={translate('Label.LifetimeVisitsRange')}
            value={translate(
              getLifetimeVisitsRangeLabelFromEnum(
                candidate.creatorLifetimeVisitBucket ?? undefined,
              ),
            )}
          />
          <KeyValuePair label={translate('Label.DetectedIpFamily')} value={ipFamily?.name} />
          <KeyValuePair
            label={translate('Label.Status')}
            value={
              <AgreementStatusFromBatchMaps
                agreementId={agreementId ?? null}
                column={
                  {
                    statusByAgreementId:
                      agreementId && statusFromList !== undefined
                        ? { [agreementId]: statusFromList }
                        : {},
                    errorsByAgreementId:
                      agreementId && rowError ? { [agreementId]: rowError } : undefined,
                    isPending: agreementStatusFromList?.isPending ?? false,
                    isError: agreementStatusFromList?.isError ?? false,
                  } satisfies AgreementStatusesColumnProps
                }
              />
            }
          />
        </KeyValuePairContainer>

        {showScreenshotsSection && (
          <div className='margin-top-medium'>
            <Flex flexDirection='column' gap={8}>
              <Flex alignItems='center' gap={8}>
                <Typography variant='h6'>{screenshotsTitle}</Typography>
                {matchScreenshotsGalleryHref != null && (
                  <FoundationLink asChild size='Small' color='Emphasis' underline='none'>
                    <Link href={matchScreenshotsGalleryHref}>
                      <span className='inline-flex items-center gap-xsmall'>
                        {viewGalleryLinkLabel}
                        <Icon name='icon-regular-chevron-small-right' size='XSmall' />
                      </span>
                    </Link>
                  </FoundationLink>
                )}
              </Flex>
              <Typography
                variant='body1'
                className='margin-none'
                data-testid='detected-screenshots-disclaimer'>
                {translate('Label.DetectedScreenshotsDisclaimer', { date: imagesAsOfDate })}
              </Typography>
              <DetectedScreenshotsGrid
                items={screenshotItems.map((item) => ({
                  imageUrl: item.imageUrl,
                  href: matchScreenshotsGalleryHref
                    ? `${matchScreenshotsGalleryHref}&inspect=${item.assetId}`
                    : '#',
                }))}
                isLoading={isScreenshotsLoading}
              />
            </Flex>
          </div>
        )}
      </Flex>
    </MatchPanelLayout>
  );
};

export default MatchDetailsPanelContent;
