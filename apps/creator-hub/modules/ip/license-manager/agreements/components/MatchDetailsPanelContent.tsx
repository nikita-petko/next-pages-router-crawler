import type { FunctionComponent } from 'react';
import React, { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AgreementCandidateType,
  type AgreementCandidateResponse,
} from '@rbx/client-content-licensing-api/v1';
import { useFlag } from '@rbx/flags';
import { Icon, IconButton, Link as FoundationLink } from '@rbx/foundation-ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { Typography, Button, Alert, CircularProgress } from '@rbx/ui';
import {
  isExperiencePreviewEnabled as isExperiencePreviewEnabledFlag,
  isIgnoreMatchEnabled as isIgnoreMatchEnabledFlag,
} from '@generated/flags/contentLicensing';
import Flex from '@modules/miscellaneous/components/Flex';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import useIpSnackbar from '../../../hooks/useIpSnackbar';
import { useIpFamilyQuery } from '../../../ipFamilies/hooks/ipFamily';
import { ContentTile, ContentType } from '../../components/ContentTile';
import { KeyValuePair, KeyValuePairContainer } from '../../components/KeyValuePair';
import {
  EXTERNAL_EXPERIENCE_HREF,
  IPH_AGREEMENT_DETAILS_HREF,
  IPH_MATCH_DETAILS_TAB_HREF,
} from '../../urls';
import { getCreatorDisplayName, normalizeCreatorType } from '../../utils/creatorName';
import {
  getCreationDauRangeLabelFromEnum,
  getLifetimeVisitsRangeLabelFromEnum,
} from '../../utils/dauEnum';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
  useLicenseManagerLoggerLogOnce,
} from '../../utils/logger';
import MatchDetailsTabs from '../enums/MatchDetailsTabs';
import useDebouncedContentMaturity, {
  NO_CONTENT_MATURITY_FOUND_FOR_ID,
} from '../hooks/experienceGuidelines';
import { NO_GAME_FOUND_FOR_ID, useDebouncedGameDetails } from '../hooks/games';
import { useGetPlacefileImagesQuery } from '../hooks/useGetPlacefileImagesQuery';
import { usePlacefileImageUrlsQuery } from '../hooks/usePlacefileImageUrlsQuery';
import { BUTTON_SPINNER_SIZE } from '../utils/constants';
import {
  getExperiencePreviewAnalyticsContext,
  logExperiencePreviewEvent,
  serializeExperiencePreviewAnalyticsContext,
} from '../utils/experiencePreviewAnalytics';
import formatDate from '../utils/formatDate';
import DetectedScreenshotsGrid, { MAX_SCREENSHOTS } from './DetectedScreenshotsGrid';
import IgnoreMatchPanelContent from './IgnoreMatchPanelContent';
import {
  AgreementStatusFromBatchMaps,
  type AgreementStatusesColumnProps,
} from './IphMatchStatusLabel';
import { canViewAgreement } from './matchPanelAgreementStatus';
import MatchPanelLayout from './MatchPanelLayout';
import type {
  MatchDetailsPanelNavigation,
  MatchPanelAgreementStatus,
  MatchPanelState,
} from './matchPanelTypes';
import type { InspectorImage } from './ScreenshotInspector';
import ScreenshotInspector from './ScreenshotInspector';

export type { MatchDetailsPanelNavigation, MatchPanelAgreementStatus } from './matchPanelTypes';

interface MatchDetailsPanelContentProps {
  candidate: AgreementCandidateResponse;
  onClose: () => void;
  onOfferLicense: () => void;
  /** From {@link Matches} agreement status batch query when the candidate has an agreement id. */
  agreementStatusFromList?: MatchPanelAgreementStatus;
  navigation?: MatchDetailsPanelNavigation;
  /** Called after a match is successfully ignored (post-200) so the parent can prune + advance. */
  onIgnored?: () => void;
  rowPosition?: number;
  onPanelStateChange?: (state: MatchPanelState) => void;
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
  onIgnored,
  rowPosition,
  onPanelStateChange,
}) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const resolvedLocale = locale ?? Locale.English;
  const { isFetched } = useSettings();
  const { enqueueWithDefaults } = useIpSnackbar();
  const { logEvent } = useLicenseManagerLogger();

  const [ignoreReasonViewCandidateId, setIgnoreReasonViewCandidateId] = useState<string | null>(
    null,
  );
  const { logOnce } = useLicenseManagerLoggerLogOnce();

  const analyticsContext = useMemo(
    () => getExperiencePreviewAnalyticsContext(candidate),
    [candidate],
  );
  const analyticsContextDedupeKey = serializeExperiencePreviewAnalyticsContext(analyticsContext);

  const [inspectorOpenIndex, setInspectorOpenIndex] = useState<number | null>(null);
  const handleScreenshotClick = useCallback(
    (index: number) => {
      logExperiencePreviewEvent(
        logEvent,
        LicenseManagerClickEvent.ExperiencePreviewImageClickEvent,
        { ...analyticsContext, source: 'sidebar' },
      );
      setInspectorOpenIndex(index);
    },
    [logEvent, analyticsContext],
  );
  const handleInspectorClose = useCallback(() => {
    setInspectorOpenIndex(null);
  }, []);

  const handleViewDetailsClick = useCallback(() => {
    logExperiencePreviewEvent(
      logEvent,
      LicenseManagerClickEvent.ExperiencePreviewSidebarExpandClickEvent,
      { ...analyticsContext, destination: MatchDetailsTabs.Details },
    );
  }, [logEvent, analyticsContext]);

  const { ready: isIgnoreMatchFlagReady, value: isIgnoreMatchEnabled } =
    useFlag(isIgnoreMatchEnabledFlag);
  const isIgnoreMatchAllowed = isIgnoreMatchFlagReady && isIgnoreMatchEnabled;
  const isIgnoreReasonViewOpen =
    ignoreReasonViewCandidateId != null && ignoreReasonViewCandidateId === candidate.id;

  const handleIgnoreClick = useCallback(() => {
    if (!isIgnoreMatchAllowed) {
      return;
    }
    setIgnoreReasonViewCandidateId(candidate.id ?? null);
  }, [candidate.id, isIgnoreMatchAllowed]);

  const handleIgnoreBack = useCallback(() => {
    setIgnoreReasonViewCandidateId(null);
  }, []);

  const candidateId = candidate.id;

  const handlePanelIgnored = useCallback(() => {
    if (!isIgnoreMatchAllowed) {
      return;
    }
    setIgnoreReasonViewCandidateId(null);
    onIgnored?.();
  }, [isIgnoreMatchAllowed, onIgnored]);

  const handleViewGalleryClick = useCallback(() => {
    logExperiencePreviewEvent(
      logEvent,
      LicenseManagerClickEvent.ExperiencePreviewSidebarExpandClickEvent,
      { ...analyticsContext, destination: MatchDetailsTabs.Gallery },
    );
  }, [logEvent, analyticsContext]);

  const notifyLinkCopied = useCallback(() => {
    enqueueWithDefaults({
      anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
      children: (
        <div
          role='alert'
          className='[background-color:#fff] [color:#1b1b1f] radius-medium padding-y-medium padding-x-large text-body-medium text-align-x-center [box-shadow:0px_6px_16px_rgba(0,0,0,0.24)]'>
          {translate('Label.LinkCopied')}
        </div>
      ),
    });
  }, [enqueueWithDefaults, translate]);

  const matchScreenshotsGalleryHrefForShare =
    candidate.id != null
      ? IPH_MATCH_DETAILS_TAB_HREF(candidate.id, MatchDetailsTabs.Gallery)
      : undefined;
  const getShareUrl = useCallback(
    (image: InspectorImage) =>
      matchScreenshotsGalleryHrefForShare
        ? `${window.location.origin}${matchScreenshotsGalleryHrefForShare}&inspect=${image.assetId}`
        : '',
    [matchScreenshotsGalleryHrefForShare],
  );

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
  const isScreenshotsLoading = placefileAssetIds.length > 0 && placefileImageUrlsQuery.isLoading;
  const skeletonCount = Math.min(placefileAssetIds.length, MAX_SCREENSHOTS);

  const agreementId = candidate.agreementId ?? undefined;

  const isPending = gameRequest.isPending || maturityRequest.isPending || ipFamilyRequest.isPending;

  const hasError =
    (gameRequest.error ?? maturityRequest.error ?? ipFamilyRequest.error) != null ||
    gameRequest.data === NO_GAME_FOUND_FOR_ID;

  const isPanelLoading =
    isPending || !isFetched || !isExperiencePreviewFlagReady || !isIgnoreMatchFlagReady;
  const hasLoadFailure =
    !isPanelLoading &&
    (hasError || gameRequest.data == null || gameRequest.data === NO_GAME_FOUND_FOR_ID);
  const panelState: MatchPanelState = isPanelLoading
    ? 'loading'
    : hasLoadFailure
      ? 'error'
      : 'ready';
  const isPanelContentReady =
    panelState === 'ready' && gameRequest.data != null && gameRequest.data !== NO_GAME_FOUND_FOR_ID;
  const rowError = agreementStatusFromList?.rowError;
  const statusFromList = agreementStatusFromList?.status;
  const waitingOnAgreementStatus = !!agreementId && !!agreementStatusFromList?.isPending;
  const showViewAgreement = canViewAgreement({
    agreementId,
    rowError,
    status: statusFromList,
  });
  const agreementState = rowError
    ? 'error'
    : waitingOnAgreementStatus
      ? 'pending'
      : showViewAgreement
        ? 'viewable'
        : 'notViewable';
  const matchPanelAnalyticsContext = useMemo(
    () => ({
      candidateType: AgreementCandidateType.Universe,
      itemType: 'Universe',
      agreementState,
      ...(rowPosition === undefined ? {} : { rowPosition }),
    }),
    [agreementState, rowPosition],
  );

  useEffect(() => {
    if (!isPanelContentReady) {
      return;
    }
    onPanelStateChange?.('ready');
    logExperiencePreviewEvent(
      logOnce,
      LicenseManagerImpressionEvent.ExperiencePreviewMatchDetailsPanelImpressionEvent,
      analyticsContext,
      analyticsContextDedupeKey,
    );
    logOnce(
      LicenseManagerImpressionEvent.MatchDetailsPanelImpressionEvent,
      matchPanelAnalyticsContext,
      `${analyticsContextDedupeKey}:match-panel`,
    );
  }, [
    isPanelContentReady,
    logOnce,
    analyticsContext,
    analyticsContextDedupeKey,
    matchPanelAnalyticsContext,
    onPanelStateChange,
  ]);

  useEffect(() => {
    if (panelState !== 'error') {
      return;
    }
    onPanelStateChange?.('error');
    const failureReason =
      gameRequest.error != null
        ? 'experienceRequestError'
        : maturityRequest.error != null
          ? 'maturityRequestError'
          : ipFamilyRequest.error != null
            ? 'ipFamilyRequestError'
            : 'missingExperience';
    logOnce(
      LicenseManagerImpressionEvent.MatchDetailsPanelLoadFailureImpressionEvent,
      { ...matchPanelAnalyticsContext, failureReason },
      `${analyticsContextDedupeKey}:match-panel-error`,
    );
  }, [
    analyticsContextDedupeKey,
    gameRequest.error,
    ipFamilyRequest.error,
    logOnce,
    matchPanelAnalyticsContext,
    maturityRequest.error,
    onPanelStateChange,
    panelState,
  ]);

  const isScreenshotDataSettled =
    isExperiencePreviewFlagReady &&
    (!showPlacefileScreenshots || (placefileImagesQuery.isFetched && !isScreenshotsLoading));

  useEffect(() => {
    if (!isPanelContentReady || !isScreenshotDataSettled || !showPlacefileScreenshots) {
      return;
    }
    logExperiencePreviewEvent(
      logOnce,
      LicenseManagerImpressionEvent.ExperiencePreviewScreenshotsAvailableImpressionEvent,
      {
        ...analyticsContext,
        totalImages: placefileAssetIds.length,
        availableImages: screenshotItems.length,
      },
      `${analyticsContextDedupeKey}:screenshots`,
    );
  }, [
    isPanelContentReady,
    isScreenshotDataSettled,
    showPlacefileScreenshots,
    logOnce,
    analyticsContext,
    analyticsContextDedupeKey,
    placefileAssetIds.length,
    screenshotItems.length,
  ]);

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

  if (isPanelLoading) {
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

  const agreementCandidateId = candidate.id;
  const matchDetailsPageHref =
    agreementCandidateId != null
      ? `${IPH_MATCH_DETAILS_TAB_HREF(agreementCandidateId, MatchDetailsTabs.Details)}&ref=sidebar`
      : undefined;
  const matchScreenshotsGalleryHref =
    agreementCandidateId != null
      ? `${IPH_MATCH_DETAILS_TAB_HREF(agreementCandidateId, MatchDetailsTabs.Gallery)}&ref=sidebar`
      : undefined;

  const viewDetailsButtonLabel = translate('Action.ViewDetails');
  const viewGalleryLinkLabel = translate('Action.ViewGallery');
  const ignoreButtonLabel = translate('Action.Ignore');

  const imagesAsOfDate = candidate.discoveredAt
    ? formatDate(candidate.discoveredAt, resolvedLocale)
    : translate('Label.Unknown');

  const resolvedScreenshotCount = resolvedScreenshotUrls.length;
  const showScreenshotsSection =
    showPlacefileScreenshots &&
    placefileImagesQuery.isFetched &&
    (isScreenshotsLoading || resolvedScreenshotCount > 0);
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

  const isOfferLicenseCta = !waitingOnAgreementStatus && !showViewAgreement;
  const showIgnoreButton = isIgnoreMatchAllowed && isOfferLicenseCta;
  const useFillFooter = showPlacefileScreenshots || showIgnoreButton;
  const ctaClassName = useFillFooter
    ? 'fill [white-space:nowrap] text-align-x-center'
    : '[white-space:nowrap] text-align-x-center';

  let primaryCta: ReactNode;
  if (waitingOnAgreementStatus) {
    primaryCta = (
      <Button
        variant='contained'
        color='primaryBrand'
        size='large'
        fullWidth={!useFillFooter}
        className={ctaClassName}
        disabled>
        <CircularProgress color='inherit' size={BUTTON_SPINNER_SIZE} />
      </Button>
    );
  } else if (showViewAgreement) {
    primaryCta = (
      <Button
        variant='contained'
        color='primaryBrand'
        size='large'
        fullWidth={!useFillFooter}
        className={ctaClassName}
        component={Link}
        href={IPH_AGREEMENT_DETAILS_HREF(agreementId ?? '')}
        onClick={() =>
          logEvent(LicenseManagerClickEvent.MatchDetailsPanelViewAgreementClickEvent, {
            ...matchPanelAnalyticsContext,
            agreementStatus: statusFromList ?? 'unknown',
          })
        }>
        {translate('Action.ViewAgreement')}
      </Button>
    );
  } else {
    primaryCta = (
      <Button
        variant='contained'
        color='primaryBrand'
        size='large'
        fullWidth={!useFillFooter}
        className={ctaClassName}
        onClick={onOfferLicense}>
        {translate('Action.OfferLicense')}
      </Button>
    );
  }

  const ignoreButton = showIgnoreButton ? (
    <Button variant='contained' color='secondary' size='large' onClick={handleIgnoreClick}>
      {ignoreButtonLabel}
    </Button>
  ) : null;

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
          className={ctaClassName}
          onClick={handleViewDetailsClick}>
          {viewDetailsButtonLabel}
        </Button>
        {ignoreButton}
      </>
    ) : (
      <>
        {primaryCta}
        {ignoreButton}
      </>
    );

  const inspectorImages: InspectorImage[] = screenshotItems.map((item) => ({
    key: `screenshot-${item.assetId}`,
    src: item.imageUrl,
    assetId: item.assetId,
  }));

  if (isIgnoreReasonViewOpen) {
    return (
      <IgnoreMatchPanelContent
        candidateId={candidateId}
        onBack={handleIgnoreBack}
        onClose={onClose}
        onIgnored={handlePanelIgnored}
      />
    );
  }

  return (
    <>
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
              subheader={
                game.creator?.name
                  ? getCreatorDisplayName(
                      normalizeCreatorType(game.creator.type),
                      game.creator.name,
                    )
                  : ''
              }
              thumbnailTargetId={game.id ?? experienceId}
              type={ContentType.Universe}
              link={
                game.rootPlaceId != null ? EXTERNAL_EXPERIENCE_HREF(game.rootPlaceId) : undefined
              }
              onLinkClick={() =>
                logEvent(LicenseManagerClickEvent.MatchDetailsPanelViewCreationClickEvent, {
                  ...matchPanelAnalyticsContext,
                  destination: 'experienceDetails',
                })
              }
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
                  {!isScreenshotsLoading && matchScreenshotsGalleryHref != null && (
                    <FoundationLink asChild size='Small' underline='none' className='content-link'>
                      <Link href={matchScreenshotsGalleryHref} onClick={handleViewGalleryClick}>
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
                    assetId: item.assetId,
                  }))}
                  isLoading={isScreenshotsLoading}
                  skeletonCount={skeletonCount}
                  onItemClick={handleScreenshotClick}
                />
              </Flex>
            </div>
          )}
        </Flex>
      </MatchPanelLayout>
      {inspectorOpenIndex !== null && inspectorImages.length > 0 && (
        <ScreenshotInspector
          images={inspectorImages}
          title={game.name ?? ''}
          experienceHref={
            game.rootPlaceId != null ? EXTERNAL_EXPERIENCE_HREF(game.rootPlaceId) : undefined
          }
          getShareUrl={getShareUrl}
          onLinkCopied={notifyLinkCopied}
          initialIndex={inspectorOpenIndex}
          onClose={handleInspectorClose}
        />
      )}
    </>
  );
};

export default MatchDetailsPanelContent;
