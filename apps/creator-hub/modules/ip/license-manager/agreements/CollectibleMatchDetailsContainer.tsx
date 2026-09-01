import type { FunctionComponent, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import {
  AgreementCandidateType,
  type AgreementCandidateResponse,
} from '@rbx/client-content-licensing-api/v1';
import { useFlag } from '@rbx/flags';
import {
  Locale,
  useLocalization,
  useTranslation,
  useTranslationWithNamespace,
  withTranslation,
} from '@rbx/intl';
import {
  AssetThumbnailSize,
  BundleThumbnailSize,
  Thumbnail2d,
  ThumbnailTypes,
} from '@rbx/thumbnails';
import { Button, CircularProgress, Link as UILink, OpenInNewIcon, Typography } from '@rbx/ui';
import {
  isAvatarItemLicensingEnabled as isAvatarItemLicensingEnabledFlag,
  isIgnoreMatchEnabled as isIgnoreMatchEnabledFlag,
} from '@generated/flags/contentLicensing';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { GridListView } from '@modules/licenses/components/GridListViewToggle';
import { PageLoading } from '@modules/miscellaneous/components';
import { PageNotFound } from '@modules/miscellaneous/error';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getBundleUrl, getCatalogUrl } from '@modules/miscellaneous/urls/www';
import IpLoadError from '../../components/error/IpLoadError';
import { useIpLayoutContext } from '../../IpAppNavigationLayout';
import { useIpFamilyQuery } from '../../ipFamilies/hooks/ipFamily';
import AmDivider from '../components/AmDivider';
import { KeyValuePair, KeyValuePairContainer } from '../components/KeyValuePair';
import { IP_MATCHES_HREF, IPH_AGREEMENT_DETAILS_HREF } from '../urls';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
  useLicenseManagerLoggerLogOnce,
} from '../utils/logger';
import CollectibleMatchOfferPanelContent from './components/CollectibleMatchOfferPanelContent';
import { getCollectibleMatchPresentation } from './components/collectibleMatchPresentation';
import getCollectibleItemTypeLabel from './components/getCollectibleItemTypeLabel';
import IgnoreMatchPanelContent from './components/IgnoreMatchPanelContent';
import {
  AgreementStatusFromBatchMaps,
  type AgreementStatusesColumnProps,
} from './components/IphMatchStatusLabel';
import MatchesBreadcrumbs from './components/MatchesBreadcrumbs';
import MatchesSidePanel from './components/MatchesSidePanel';
import { canViewAgreement } from './components/matchPanelAgreementStatus';
import { useAgreementStatusesByIdsQuery } from './hooks/useAgreementStatusesByIdsQuery';
import useCollectibleMatchItemDetails from './hooks/useCollectibleMatchItemDetails';
import { markMatchCandidateIgnored } from './hooks/useMatchesQuery';
import { BUTTON_SPINNER_SIZE } from './utils/constants';
import formatDate from './utils/formatDate';

const VIEW_ITEM_LINK_CLASS = 'group inline-flex items-center gap-xsmall';
const VIEW_ITEM_TEXT_CLASS =
  'text-body-large !content-muted [border-bottom:1px_solid_currentColor] group-hover:!content-default';
const VIEW_ITEM_ICON_CLASS = '!content-muted group-hover:!content-default';
const DETAILS_COLUMN_CLASS = 'width-full max-width-[75%] min-width-0';
const THUMBNAIL_FILL_CLASS = 'absolute inset-0 width-full height-full';
const THUMBNAIL_WRAPPER_CLASS = 'relative overflow-hidden radius-none size-[420px]';
const THUMBNAIL_CONTAINER_CLASS =
  '!absolute [inset:0] !width-full !height-full !padding-none !padding-top-none radius-none';
const THUMBNAIL_IMG_CLASS = `${THUMBNAIL_FILL_CLASS} [object-fit:contain]`;
const COLLECTIBLE_MATCH_QUERY_PARAMS = ['ref', 'sourceView'] as const;

interface CollectibleMatchDetailsContainerProps {
  agreementCandidateId: string;
  candidate: AgreementCandidateResponse;
  pageStartedAt?: number;
}

const CollectibleMatchDetailsContainer: FunctionComponent<
  CollectibleMatchDetailsContainerProps
> = ({ agreementCandidateId, candidate, pageStartedAt }) => {
  const translation = useTranslation();
  const { translate } = translation;
  const { translate: translateCreations } = useTranslationWithNamespace(
    TranslationNamespace.Creations,
  );
  const { translate: translateAgreements } = useTranslationWithNamespace(
    TranslationNamespace.AgreementsManager,
  );
  const { translate: translateControls } = useTranslationWithNamespace(
    TranslationNamespace.Controls,
  );
  const { locale } = useLocalization();
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const { setPageTitle } = useIpLayoutContext();
  const { logEvent } = useLicenseManagerLogger();
  const { logOnce } = useLicenseManagerLoggerLogOnce();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [queryParams, setQueryParams] = useQueryParams(COLLECTIBLE_MATCH_QUERY_PARAMS);
  const refParam = Array.isArray(queryParams.ref) ? queryParams.ref[0] : queryParams.ref;
  const sourceViewParam = Array.isArray(queryParams.sourceView)
    ? queryParams.sourceView[0]
    : queryParams.sourceView;
  const [entrySource] = useState<'sidebar' | 'deepLink'>(() =>
    refParam === 'sidebar' ? 'sidebar' : 'deepLink',
  );
  const [sourceView] = useState<GridListView | undefined>(() =>
    sourceViewParam === 'grid' || sourceViewParam === 'list' ? sourceViewParam : undefined,
  );
  const [containerStartedAt] = useState(Date.now);

  useEffect(() => {
    if (refParam == null && sourceViewParam == null) {
      return;
    }
    setQueryParams({ ref: null, sourceView: null }, { skipHistory: true });
  }, [refParam, setQueryParams, sourceViewParam]);

  const [isOfferPanelOpen, setIsOfferPanelOpen] = useState(false);
  const [isIgnorePanelOpen, setIsIgnorePanelOpen] = useState(false);
  const offerPanelOpenedAtRef = useRef<number | null>(null);
  const offerPanelStateRef = useRef<'loading' | 'ready' | 'error'>('loading');

  const { ready: isAvatarItemLicensingFlagReady, value: isAvatarItemLicensingEnabled } = useFlag(
    isAvatarItemLicensingEnabledFlag,
  );
  const collectibleItemId = candidate.candidateId;
  const collectibleItemIds = useMemo(
    () =>
      isAvatarItemLicensingFlagReady && isAvatarItemLicensingEnabled && collectibleItemId
        ? [collectibleItemId]
        : [],
    [collectibleItemId, isAvatarItemLicensingEnabled, isAvatarItemLicensingFlagReady],
  );
  const itemDetailsQuery = useCollectibleMatchItemDetails(collectibleItemIds);
  const details = collectibleItemId ? itemDetailsQuery.data?.[collectibleItemId] : undefined;
  const presentation = details ? getCollectibleMatchPresentation(details) : undefined;
  const ipFamilyQuery = useIpFamilyQuery(candidate.ipFamilyId ?? undefined);
  const itemName = presentation?.name?.trim() ? presentation.name : '';

  useEffect(() => {
    setPageTitle(<MatchesBreadcrumbs gameName={itemName} />);
  }, [itemName, setPageTitle]);

  const agreementId = candidate.agreementId?.trim();
  const statusQuery = useAgreementStatusesByIdsQuery({
    agreementIds: agreementId ? [agreementId] : undefined,
    enabled: !!agreementId,
  });
  const { refetch: refetchAgreementStatuses } = statusQuery;
  const statusFromList = agreementId
    ? statusQuery.data?.statusesByAgreementId[agreementId]
    : undefined;
  const rowError = agreementId ? statusQuery.data?.errorsByAgreementId[agreementId] : undefined;
  const waitingOnAgreementStatus = !!agreementId && statusQuery.isLoading;
  const showViewAgreement = canViewAgreement({
    agreementId,
    rowError,
    status: statusFromList,
  });

  const { ready: isIgnoreMatchFlagReady, value: isIgnoreMatchEnabled } =
    useFlag(isIgnoreMatchEnabledFlag);
  const showIgnoreButton =
    isIgnoreMatchFlagReady &&
    isIgnoreMatchEnabled &&
    !waitingOnAgreementStatus &&
    !showViewAgreement;
  const agreementState = statusQuery.isError
    ? 'error'
    : waitingOnAgreementStatus
      ? 'pending'
      : showViewAgreement
        ? 'viewable'
        : 'notViewable';
  const entryAnalyticsContext = useMemo(
    () => ({
      entrySource,
      ...(sourceView === undefined ? {} : { sourceView }),
    }),
    [entrySource, sourceView],
  );
  const ignoreAnalyticsContext = useMemo(
    () => ({
      source: 'fullPage',
      ...entryAnalyticsContext,
    }),
    [entryAnalyticsContext],
  );
  const pageAnalyticsContext = useMemo(
    () => ({
      candidateType: AgreementCandidateType.Collectible,
      agreementCandidateId,
      ...entryAnalyticsContext,
      itemType: presentation?.isBundle ? 'Bundle' : presentation ? 'Asset' : 'Unknown',
      isLimited: presentation?.isLimited ?? false,
      isResellAllowed: presentation?.isResellAllowed ?? false,
      priceState:
        presentation?.price == null ? 'unknown' : presentation.price === 0 ? 'free' : 'paid',
      agreementState,
    }),
    [agreementCandidateId, agreementState, entryAnalyticsContext, presentation],
  );
  const isPageReady =
    isAvatarItemLicensingFlagReady &&
    isAvatarItemLicensingEnabled &&
    !waitingOnAgreementStatus &&
    !itemDetailsQuery.isPending &&
    !itemDetailsQuery.isError &&
    details != null &&
    presentation != null &&
    Boolean(itemName);
  const hasPageLoadFailure =
    isAvatarItemLicensingFlagReady &&
    isAvatarItemLicensingEnabled &&
    !itemDetailsQuery.isPending &&
    (itemDetailsQuery.isError || details == null || presentation == null || !itemName);

  useEffect(() => {
    if (!isPageReady) {
      return;
    }
    logOnce(
      LicenseManagerImpressionEvent.MatchDetailsPageImpressionEvent,
      {
        ...pageAnalyticsContext,
        timeToReadyMs: Math.max(0, Date.now() - (pageStartedAt ?? containerStartedAt)),
      },
      agreementCandidateId,
    );
  }, [
    agreementCandidateId,
    containerStartedAt,
    isPageReady,
    logOnce,
    pageAnalyticsContext,
    pageStartedAt,
  ]);

  useEffect(() => {
    if (!hasPageLoadFailure) {
      return;
    }
    const failureReason = itemDetailsQuery.isError
      ? 'requestError'
      : details == null || presentation == null
        ? 'missingItem'
        : 'missingName';
    logOnce(
      LicenseManagerImpressionEvent.MatchDetailsPageLoadFailureImpressionEvent,
      {
        ...pageAnalyticsContext,
        failureReason,
        timeToFailureMs: Math.max(0, Date.now() - (pageStartedAt ?? containerStartedAt)),
      },
      agreementCandidateId,
    );
  }, [
    agreementCandidateId,
    containerStartedAt,
    details,
    hasPageLoadFailure,
    itemDetailsQuery.isError,
    logOnce,
    pageAnalyticsContext,
    pageStartedAt,
    presentation,
  ]);

  const handleOfferLicense = useCallback(() => {
    offerPanelOpenedAtRef.current = Date.now();
    offerPanelStateRef.current = 'loading';
    logEvent(LicenseManagerClickEvent.MatchDetailsPanelOfferLicenseClickEvent, {
      candidateType: AgreementCandidateType.Collectible,
      agreementCandidateId,
      source: 'detailsView',
      ...entryAnalyticsContext,
    });
    setIsOfferPanelOpen(true);
  }, [agreementCandidateId, entryAnalyticsContext, logEvent]);

  const handleOfferPanelStateChange = useCallback((state: 'loading' | 'ready' | 'error') => {
    offerPanelStateRef.current = state;
  }, []);

  const handleCloseOfferPanel = useCallback(
    (dismissMethod: 'closeButton' | 'outsideClick' | 'escapeKey' = 'closeButton') => {
      logEvent(LicenseManagerClickEvent.MatchDetailsPanelDismissClickEvent, {
        candidateType: AgreementCandidateType.Collectible,
        agreementCandidateId,
        panelView: 'agreement',
        panelState: offerPanelStateRef.current,
        dismissMethod,
        source: 'fullPage',
        ...entryAnalyticsContext,
        timeSinceOfferOpenedMs:
          offerPanelOpenedAtRef.current === null
            ? 0
            : Math.max(0, Date.now() - offerPanelOpenedAtRef.current),
        navigationCount: 0,
      });
      offerPanelOpenedAtRef.current = null;
      setIsOfferPanelOpen(false);
    },
    [agreementCandidateId, entryAnalyticsContext, logEvent],
  );

  const handleAgreementSuccess = useCallback(() => {
    offerPanelOpenedAtRef.current = null;
    setIsOfferPanelOpen(false);
    void refetchAgreementStatuses();
  }, [refetchAgreementStatuses]);

  const handleMatchIgnored = useCallback(() => {
    setIsIgnorePanelOpen(false);
    markMatchCandidateIgnored(queryClient, agreementCandidateId);
    void router.push(IP_MATCHES_HREF);
  }, [agreementCandidateId, queryClient, router]);

  const handleIgnoreClick = useCallback(() => {
    logEvent(LicenseManagerClickEvent.IgnoreMatchPanelOpenClickEvent, {
      candidateType: AgreementCandidateType.Collectible,
      source: 'fullPage',
      ...entryAnalyticsContext,
    });
    setIsIgnorePanelOpen(true);
  }, [entryAnalyticsContext, logEvent]);

  if (!isAvatarItemLicensingFlagReady) {
    return <PageLoading />;
  }

  if (!isAvatarItemLicensingEnabled) {
    return <PageNotFound />;
  }

  if (itemDetailsQuery.isPending) {
    return <PageLoading />;
  }

  if (itemDetailsQuery.isError || !details || !presentation || !itemName) {
    return <IpLoadError error={itemDetailsQuery.error} />;
  }

  const itemHref =
    presentation.targetId == null
      ? undefined
      : presentation.isBundle
        ? getBundleUrl(presentation.targetId)
        : getCatalogUrl(presentation.targetId);

  let primaryCta: ReactNode;
  if (waitingOnAgreementStatus) {
    primaryCta = (
      <Button variant='contained' color='primaryBrand' size='large' disabled>
        <CircularProgress color='inherit' size={BUTTON_SPINNER_SIZE} />
      </Button>
    );
  } else if (showViewAgreement && agreementId) {
    primaryCta = (
      <Button
        variant='contained'
        color='primaryBrand'
        size='large'
        component={NextLink}
        href={IPH_AGREEMENT_DETAILS_HREF(agreementId)}
        onClick={() =>
          logEvent(LicenseManagerClickEvent.MatchDetailsPanelViewAgreementClickEvent, {
            candidateType: AgreementCandidateType.Collectible,
            agreementCandidateId,
            agreementStatus: statusFromList ?? 'unknown',
            source: 'fullPage',
            ...entryAnalyticsContext,
          })
        }>
        {translate('Action.ViewAgreement')}
      </Button>
    );
  } else {
    primaryCta = (
      <Button variant='contained' color='primaryBrand' size='large' onClick={handleOfferLicense}>
        {translate('Action.OfferLicense')}
      </Button>
    );
  }

  const resolvedLocale = locale ?? Locale.English;
  const formatOptionalDate = (date?: Date) =>
    date ? formatDate(date, resolvedLocale) : translate('Label.Unknown');
  const description = presentation.description?.trim()
    ? presentation.description
    : translate('Label.NoDescriptionAvailable');
  const limitedLabel = tPendingTranslation(
    'Limited',
    'Label indicating that an avatar marketplace item has a limited supply.',
    translationKey('Label.Limited', TranslationNamespace.AgreementsManager),
  );
  const viewItemLabel = tPendingTranslation(
    'View item',
    'Link that opens an avatar marketplace item details page.',
    translationKey('Action.ViewItem', TranslationNamespace.AgreementsManager),
  );
  const statusColumn: AgreementStatusesColumnProps = {
    statusByAgreementId:
      agreementId && statusFromList !== undefined ? { [agreementId]: statusFromList } : {},
    errorsByAgreementId: agreementId && rowError ? { [agreementId]: rowError } : undefined,
    isPending: statusQuery.isLoading,
    isError: statusQuery.isError,
  };

  return (
    <>
      <div className='flex flex-col gap-large'>
        <div className='flex justify-between items-start gap-medium'>
          <div className='flex flex-col gap-small'>
            <Typography variant='h1' className='text-display-small'>
              {itemName}
            </Typography>
            <div className='flex items-center gap-small'>
              {presentation.creatorDisplayName && (
                <Typography variant='body1' color='secondary'>
                  {presentation.creatorDisplayName}
                </Typography>
              )}
              {presentation.creatorDisplayName && itemHref && (
                <Typography variant='body1' color='secondary' aria-hidden>
                  &middot;
                </Typography>
              )}
              {itemHref && (
                <UILink
                  component={NextLink}
                  href={itemHref}
                  target='_blank'
                  color='inherit'
                  underline='none'
                  className={VIEW_ITEM_LINK_CLASS}>
                  <span className={VIEW_ITEM_TEXT_CLASS}>{viewItemLabel}</span>
                  <OpenInNewIcon className={VIEW_ITEM_ICON_CLASS} fontSize='small' />
                </UILink>
              )}
            </div>
            <div className='padding-top-xsmall'>
              <AgreementStatusFromBatchMaps
                agreementId={agreementId ?? null}
                pill
                column={statusColumn}
              />
            </div>
          </div>
          <div className='flex items-center gap-small'>
            {primaryCta}
            {showIgnoreButton && (
              <Button
                variant='contained'
                color='secondary'
                size='large'
                onClick={handleIgnoreClick}>
                {translate('Action.Ignore')}
              </Button>
            )}
          </div>
        </div>

        <div className={DETAILS_COLUMN_CLASS}>
          <div className='flex flex-col gap-xxlarge'>
            <div className='flex flex-col gap-small'>
              <Typography variant='h6' component='h3'>
                {translate('Label.Thumbnail')}
              </Typography>
              <div className={THUMBNAIL_WRAPPER_CLASS}>
                <Thumbnail2d
                  targetId={presentation.thumbnailTargetId}
                  containerClass={THUMBNAIL_CONTAINER_CLASS}
                  imgClassName={THUMBNAIL_IMG_CLASS}
                  skeletonVariant='square'
                  alt={translate('Label.CreationThumbnail')}
                  type={
                    presentation.isBundle
                      ? ThumbnailTypes.bundleThumbnail
                      : ThumbnailTypes.assetThumbnail
                  }
                  size={
                    presentation.isBundle
                      ? // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
                        BundleThumbnailSize._420x420
                      : // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
                        AssetThumbnailSize._420x420
                  }
                />
              </div>
            </div>

            <AmDivider />

            <KeyValuePairContainer>
              <KeyValuePair
                label={translate('Label.Description')}
                value={<Typography whiteSpace='pre-wrap'>{description}</Typography>}
              />
              <KeyValuePair
                label={translate('Label.Type')}
                value={getCollectibleItemTypeLabel(
                  details,
                  translateCreations,
                  tPendingTranslation,
                )}
              />
              <KeyValuePair
                label={limitedLabel}
                value={translateControls(presentation.isLimited ? 'Action.Yes' : 'Action.No')}
              />
              <KeyValuePair
                label={translate('Label.DetectedIpFamily')}
                value={ipFamilyQuery.data?.name}
              />
              <KeyValuePair
                label={translate('Label.DateCreated')}
                value={formatOptionalDate(details.catalogItem?.itemCreatedUtc)}
              />
              <KeyValuePair
                label={translateAgreements('Label.DateUpdated')}
                value={formatOptionalDate(candidate.updatedAt)}
              />
              <KeyValuePair
                label={translate('Label.DateMatched')}
                value={formatOptionalDate(candidate.discoveredAt)}
              />
            </KeyValuePairContainer>
          </div>
        </div>
      </div>

      <MatchesSidePanel
        open={isOfferPanelOpen}
        onDismiss={handleCloseOfferPanel}
        testId='match-details-offer-side-panel'
        ariaLabel={translate('Heading.NewLicenseOffer')}
        dismissMode='match'>
        {isOfferPanelOpen && (
          <CollectibleMatchOfferPanelContent
            candidate={candidate}
            onSuccess={handleAgreementSuccess}
            onClose={() => handleCloseOfferPanel('closeButton')}
            onPanelStateChange={handleOfferPanelStateChange}
            source='detailsView'
            entrySource={entrySource}
            sourceView={sourceView}
          />
        )}
      </MatchesSidePanel>

      <MatchesSidePanel
        open={isIgnorePanelOpen}
        onDismiss={() => setIsIgnorePanelOpen(false)}
        testId='match-details-ignore-side-panel'
        ariaLabel={translate('Heading.IgnoreMatch')}
        dismissMode='match'>
        {isIgnorePanelOpen && (
          <IgnoreMatchPanelContent
            candidateId={candidate.id}
            candidateType={AgreementCandidateType.Collectible}
            additionalAnalyticsContext={ignoreAnalyticsContext}
            onBack={() => setIsIgnorePanelOpen(false)}
            onClose={() => setIsIgnorePanelOpen(false)}
            onIgnored={handleMatchIgnored}
          />
        )}
      </MatchesSidePanel>
    </>
  );
};

export default withTranslation(CollectibleMatchDetailsContainer, [
  TranslationNamespace.AgreementsManager,
  TranslationNamespace.Creations,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
]);
