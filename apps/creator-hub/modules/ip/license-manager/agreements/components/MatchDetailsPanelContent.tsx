import type { FunctionComponent } from 'react';
import React, { type ReactNode } from 'react';
import Link from 'next/link';
import {
  AgreementStatus,
  type AgreementCandidateResponse,
} from '@rbx/client-content-licensing-api/v1';
import { useFlag } from '@rbx/flags';
import { Icon, IconButton, Link as FoundationLink } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Typography, Button, Alert, CircularProgress } from '@rbx/ui';
import { isExperiencePreviewEnabled as isExperiencePreviewEnabledFlag } from '@generated/flags/contentLicensing';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import Flex from '@modules/miscellaneous/components/Flex';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
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
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
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

  // TODO: Add pending translations. Ticket: EXP-32. Owner: vkakar
  const viewDetailsButtonLabel = tPendingTranslation(
    'View details',
    'Secondary action on the match panel that opens the full match details page.',
    translationKey('Action.ViewDetails', TranslationNamespace.AgreementsManager),
  );

  // TODO: Add pending translations. Ticket: EXP-32. Owner: vkakar
  const viewGalleryLinkLabel = tPendingTranslation(
    'View gallery',
    'Link beside detected screenshots that opens the full screenshots gallery.',
    translationKey('Action.ViewGallery', TranslationNamespace.AgreementsManager),
  );

  const resolvedScreenshotCount = resolvedScreenshotUrls.length;
  const showScreenshotsSection =
    showPlacefileScreenshots && (isScreenshotsLoading || resolvedScreenshotCount > 0);
  let screenshotsTitle: string;
  if (isScreenshotsLoading) {
    // TODO: Add pending translations. Ticket: EXP-32. Owner: vkakar
    screenshotsTitle = tPendingTranslation(
      'Detected screenshots',
      'Section heading for placefile screenshots while the image count is loading.',
      translationKey('Label.DetectedScreenshots', TranslationNamespace.AgreementsManager),
    );
  } else if (resolvedScreenshotCount === 1) {
    // TODO: Add pending translations. Ticket: EXP-32. Owner: vkakar
    screenshotsTitle = tPendingTranslation(
      'Detected screenshots (1 image)',
      'Section heading for placefile screenshots when exactly one resolvable screenshot was detected.',
      translationKey(
        'Label.DetectedScreenshotsWithImageCountSingular',
        TranslationNamespace.AgreementsManager,
      ),
    );
  } else {
    // TODO: Add pending translations. Ticket: EXP-32. Owner: vkakar
    screenshotsTitle = tPendingTranslation(
      'Detected screenshots ({count} images)',
      'Section heading for placefile screenshots detected for a match; {count} is the number of resolvable screenshots.',
      translationKey(
        'Label.DetectedScreenshotsWithImageCount',
        TranslationNamespace.AgreementsManager,
      ),
      { count: String(resolvedScreenshotCount) },
    );
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
              <Typography variant='body1' className='margin-none'>
                {/* TODO: Add pending translations. Ticket: EXP-32. Owner: vkakar */}
                {tPendingTranslation(
                  'Disclaimer: [10 or so words to fill here. Placeholder text for now]',
                  'Disclaimer shown below the detected screenshots heading; placeholder copy pending final wording.',
                  translationKey(
                    'Label.DetectedScreenshotsDisclaimer',
                    TranslationNamespace.AgreementsManager,
                  ),
                )}
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
