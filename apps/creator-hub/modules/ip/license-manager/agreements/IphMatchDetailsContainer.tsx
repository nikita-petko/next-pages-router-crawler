import type { FunctionComponent, ReactNode } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import { AgreementCandidateType, AgreementStatus } from '@rbx/client-content-licensing-api/v1';
import { useFlag } from '@rbx/flags';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Button,
  CircularProgress,
  Link as UILink,
  OpenInNewIcon,
  Tab,
  Tabs,
  Typography,
} from '@rbx/ui';
import {
  isExperiencePreviewEnabled as isExperiencePreviewEnabledFlag,
  isIgnoreMatchEnabled as isIgnoreMatchEnabledFlag,
} from '@generated/flags/contentLicensing';
import { PageLoading } from '@modules/miscellaneous/components';
import { PageNotFound } from '@modules/miscellaneous/error';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import IpLoadError from '../../components/error/IpLoadError';
import { useIpLayoutContext } from '../../IpAppNavigationLayout';
import AmDivider from '../components/AmDivider';
import { EXTERNAL_EXPERIENCE_HREF, IP_MATCHES_HREF, IPH_AGREEMENT_DETAILS_HREF } from '../urls';
import { getCreatorDisplayName, normalizeCreatorType } from '../utils/creatorName';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
  useLicenseManagerLoggerLogOnce,
} from '../utils/logger';
import GalleryTabContent from './components/GalleryTabContent';
import IgnoreMatchPanelContent from './components/IgnoreMatchPanelContent';
import {
  AgreementStatusFromBatchMaps,
  type AgreementStatusesColumnProps,
} from './components/IphMatchStatusLabel';
import MatchDetailsTabContent from './components/MatchDetailsTabContent';
import MatchesBreadcrumbs from './components/MatchesBreadcrumbs';
import MatchesSidePanel from './components/MatchesSidePanel';
import MatchOfferPanelContent from './components/MatchOfferPanelContent';
import MatchDetailsTabs, { isMatchDetailsTab } from './enums/MatchDetailsTabs';
import { useAgreementStatusesByIdsQuery } from './hooks/useAgreementStatusesByIdsQuery';
import { useGetAgreementCandidateByIdQuery } from './hooks/useGetAgreementCandidateByIdQuery';
import { markMatchCandidateIgnored } from './hooks/useMatchesQuery';
import { useUniverseDetailsQuery } from './hooks/useUniverseDetailsQuery';
import { BUTTON_SPINNER_SIZE } from './utils/constants';
import { logExperiencePreviewEvent } from './utils/experiencePreviewAnalytics';
import { getExperiencePreviewAnalyticsContext } from './utils/experiencePreviewAnalytics';

const AGREEMENT_STATUSES_FOR_VIEW_AGREEMENT = new Set<AgreementStatus>([
  AgreementStatus.ConditionalOffer,
  AgreementStatus.Disputed,
  AgreementStatus.Inquired,
  AgreementStatus.Accepted,
]);

const VIEW_EXPERIENCE_LINK_CLASS = 'group inline-flex items-center gap-xsmall';
const VIEW_EXPERIENCE_TEXT_CLASS =
  'text-body-large !content-muted [border-bottom:1px_solid_currentColor] group-hover:!content-default';
const VIEW_EXPERIENCE_ICON_CLASS = '!content-muted group-hover:!content-default';

interface IphMatchDetailsContainerProps {
  agreementCandidateId: string;
}

/**
 * Experience preview page for a single match (agreement candidate): breadcrumb, header (title,
 * creator, view experience, status, offer/view-agreement CTA), and empty Details/Gallery tabs.
 */
const IphMatchDetailsContainer: FunctionComponent<IphMatchDetailsContainerProps> = ({
  agreementCandidateId,
}) => {
  const { translate } = useTranslation();
  const { isFetched } = useSettings();
  const { setPageTitle } = useIpLayoutContext();
  const { logEvent } = useLicenseManagerLogger();
  const { logOnce } = useLicenseManagerLoggerLogOnce();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isOfferPanelOpen, setIsOfferPanelOpen] = useState(false);
  const [isIgnorePanelOpen, setIsIgnorePanelOpen] = useState(false);
  const offerPanelOpenedAtRef = useRef<number | null>(null);
  const offerPanelStateRef = useRef<'loading' | 'ready' | 'error'>('loading');

  const candidateQuery = useGetAgreementCandidateByIdQuery({ agreementCandidateId });
  const candidate = candidateQuery.data;

  const experienceId = candidate ? Number(candidate.candidateId) : undefined;

  const { ready: isExperiencePreviewFlagReady, value: isExperiencePreviewEnabled } = useFlag(
    isExperiencePreviewEnabledFlag,
    { universeId: experienceId ?? 0 },
  );
  const { ready: isIgnoreMatchFlagReady, value: isIgnoreMatchEnabled } =
    useFlag(isIgnoreMatchEnabledFlag);

  const universeQuery = useUniverseDetailsQuery(experienceId);
  const universe = universeQuery.data;
  const gameName = universe?.name?.trim() ? universe.name : '';

  const agreementId = candidate?.agreementId ?? undefined;
  const statusQueryEnabled = !!agreementId;
  const statusQuery = useAgreementStatusesByIdsQuery({
    agreementIds: agreementId ? [agreementId] : undefined,
    enabled: statusQueryEnabled,
  });
  // Pull out the stable `refetch` so callbacks can depend on it directly instead of the whole query
  // object, whose identity changes on every state transition.
  const { refetch: refetchAgreementStatuses } = statusQuery;

  const [queryParams, setQueryParams] = useQueryParams(['tab', 'ref']);
  const rawTab = queryParams.tab;
  const rawRef = queryParams.ref;
  const refParam = Array.isArray(rawRef) ? rawRef[0] : (rawRef ?? undefined);
  const tabParam = Array.isArray(rawTab) ? rawTab[0] : (rawTab ?? undefined);
  const currentTab = isMatchDetailsTab(tabParam) ? tabParam : MatchDetailsTabs.Details;

  // Capture the initial ref param on mount before the URL-stripping effect clears it, so the
  // page-visit impression can attribute the correct source even when isContentReady resolves later.
  const [initialRefParam] = useState(refParam);
  const [isImageDeepLink] = useState(() =>
    new URLSearchParams(window.location.search).has('inspect'),
  );

  const analyticsContext = useMemo(
    () => (candidate ? getExperiencePreviewAnalyticsContext(candidate) : null),
    [candidate],
  );
  const offerAnalyticsContext = useMemo(() => ({ source: currentTab }), [currentTab]);

  useEffect(() => {
    if (!isMatchDetailsTab(tabParam)) {
      setQueryParams({ tab: MatchDetailsTabs.Details, ref: null }, { skipHistory: true });
    } else if (refParam) {
      setQueryParams({ ref: null }, { skipHistory: true });
    }
  }, [tabParam, refParam, setQueryParams]);

  const handleTabChange = useCallback(
    (_event: unknown, newTabValue: string) => {
      // Replace (not push) so toggling tabs doesn't grow the history stack; Back returns to the
      // previous page (e.g. the matches table) instead of stepping through each tab switch.
      setQueryParams({ tab: newTabValue }, { skipHistory: true });
    },
    [setQueryParams],
  );

  useEffect(() => {
    setPageTitle(<MatchesBreadcrumbs experienceId={experienceId} gameName={gameName} />);
  }, [experienceId, gameName, setPageTitle]);

  const handleOfferLicense = useCallback(() => {
    offerPanelOpenedAtRef.current = Date.now();
    offerPanelStateRef.current = 'loading';
    logEvent(LicenseManagerClickEvent.MatchDetailsPanelOfferLicenseClickEvent, {
      candidateType: AgreementCandidateType.Universe,
      agreementCandidateId,
      source: currentTab,
    });
    setIsOfferPanelOpen(true);
  }, [agreementCandidateId, currentTab, logEvent]);

  const handleOfferPanelStateChange = useCallback((state: 'loading' | 'ready' | 'error') => {
    offerPanelStateRef.current = state;
  }, []);

  const handleCloseOfferPanel = useCallback(
    (dismissMethod: 'closeButton' | 'outsideClick' | 'escapeKey' = 'closeButton') => {
      logEvent(LicenseManagerClickEvent.MatchDetailsPanelDismissClickEvent, {
        candidateType: AgreementCandidateType.Universe,
        agreementCandidateId,
        panelView: 'agreement',
        panelState: offerPanelStateRef.current,
        dismissMethod,
        source: 'fullPage',
        timeSinceOfferOpenedMs:
          offerPanelOpenedAtRef.current === null
            ? 0
            : Math.max(0, Date.now() - offerPanelOpenedAtRef.current),
        navigationCount: 0,
      });
      offerPanelOpenedAtRef.current = null;
      setIsOfferPanelOpen(false);
    },
    [agreementCandidateId, logEvent],
  );

  const handleCloseOfferPanelByButton = useCallback(() => {
    handleCloseOfferPanel('closeButton');
  }, [handleCloseOfferPanel]);

  const handleAgreementSuccess = useCallback(() => {
    offerPanelOpenedAtRef.current = null;
    setIsOfferPanelOpen(false);
    void refetchAgreementStatuses();
  }, [refetchAgreementStatuses]);

  const isIgnoreMatchAllowed = isIgnoreMatchFlagReady && isIgnoreMatchEnabled;

  const handleIgnoreClick = useCallback(() => {
    if (!isIgnoreMatchAllowed) {
      return;
    }
    logEvent(LicenseManagerClickEvent.IgnoreMatchPanelOpenClickEvent, {
      candidateType: candidate?.candidateType ?? AgreementCandidateType.Universe,
    });
    setIsIgnorePanelOpen(true);
  }, [candidate?.candidateType, isIgnoreMatchAllowed, logEvent]);

  const handleCloseIgnorePanel = useCallback(() => {
    setIsIgnorePanelOpen(false);
  }, []);

  const handleMatchIgnored = useCallback(() => {
    if (!isIgnoreMatchAllowed) {
      return;
    }
    setIsIgnorePanelOpen(false);
    // Mark ignored before navigating so the matches table stays hidden through its remount refetch.
    markMatchCandidateIgnored(queryClient, agreementCandidateId);
    void router.push(IP_MATCHES_HREF);
  }, [agreementCandidateId, isIgnoreMatchAllowed, queryClient, router]);

  const hasValidExperienceId = experienceId != null && Number.isFinite(experienceId);

  // Tab impressions fire once the page will actually render its content (mirrors the pending/not-
  // found/error guards below), so we don't log a tab view for a page that never renders.
  const isContentReady =
    !candidateQuery.isPending &&
    !!candidate &&
    hasValidExperienceId &&
    !universeQuery.isPending &&
    !universeQuery.isError &&
    !candidateQuery.isError &&
    !!universe &&
    !!gameName &&
    isExperiencePreviewFlagReady &&
    isExperiencePreviewEnabled &&
    isFetched;

  useEffect(() => {
    if (!isContentReady || !analyticsContext || isImageDeepLink) {
      return;
    }
    const source = initialRefParam === 'sidebar' ? 'sidebar' : 'deepLink';
    logExperiencePreviewEvent(
      logOnce,
      LicenseManagerImpressionEvent.ExperiencePreviewPageVisitImpressionEvent,
      { ...analyticsContext, source },
      analyticsContext.agreementCandidateId,
    );
  }, [isContentReady, analyticsContext, initialRefParam, isImageDeepLink, logOnce]);

  useEffect(() => {
    if (!isContentReady || !analyticsContext) {
      return;
    }
    const tabImpressionEvent =
      currentTab === MatchDetailsTabs.Gallery
        ? LicenseManagerImpressionEvent.ExperiencePreviewGalleryTabImpressionEvent
        : LicenseManagerImpressionEvent.ExperiencePreviewDetailsTabImpressionEvent;
    logExperiencePreviewEvent(
      logOnce,
      tabImpressionEvent,
      { ...analyticsContext, tab: currentTab },
      `${analyticsContext.agreementCandidateId}:${currentTab}`,
    );
  }, [isContentReady, analyticsContext, currentTab, logOnce]);

  if (
    candidateQuery.isPending ||
    (hasValidExperienceId && universeQuery.isPending) ||
    (hasValidExperienceId && !isExperiencePreviewFlagReady) ||
    !isFetched
  ) {
    return <PageLoading />;
  }

  // Once the universe-scoped flag has resolved, hide the page entirely when experience preview is off.
  if (hasValidExperienceId && isExperiencePreviewFlagReady && !isExperiencePreviewEnabled) {
    return <PageNotFound />;
  }

  if (
    candidateQuery.isError ||
    !candidate ||
    !hasValidExperienceId ||
    universeQuery.isError ||
    !universe ||
    !gameName
  ) {
    return <IpLoadError error={candidateQuery.error ?? universeQuery.error} />;
  }

  const creatorName = universe.creatorName
    ? getCreatorDisplayName(normalizeCreatorType(universe.creatorType), universe.creatorName)
    : '';
  const rootPlaceId =
    universe.rootPlaceId != null && universe.rootPlaceId > 0 ? universe.rootPlaceId : undefined;

  const statusFromList = agreementId
    ? statusQuery.data?.statusesByAgreementId[agreementId]
    : undefined;
  const rowError = agreementId ? statusQuery.data?.errorsByAgreementId[agreementId] : undefined;
  const statusIsPending = statusQueryEnabled && statusQuery.isLoading;

  const waitingOnAgreementStatus = statusQueryEnabled && statusIsPending;
  const showViewAgreement =
    !!agreementId &&
    !rowError &&
    statusFromList !== undefined &&
    AGREEMENT_STATUSES_FOR_VIEW_AGREEMENT.has(statusFromList);

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
            candidateType: AgreementCandidateType.Universe,
            agreementCandidateId,
            agreementStatus: statusFromList ?? 'unknown',
            source: 'fullPage',
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

  const isOfferLicenseCta = !waitingOnAgreementStatus && !showViewAgreement;
  const showIgnoreButton = isIgnoreMatchAllowed && isOfferLicenseCta;

  const galleryTabLabel = translate('Label.Gallery');

  return (
    <>
      <div className='flex flex-col gap-large'>
        <div className='flex justify-between items-start gap-medium'>
          <div className='flex flex-col gap-small'>
            <Typography variant='h1' className='text-display-small'>
              {gameName}
            </Typography>
            <div className='flex items-center gap-small'>
              {creatorName && (
                <Typography variant='body1' color='secondary'>
                  {creatorName}
                </Typography>
              )}
              {creatorName && rootPlaceId != null && (
                <Typography variant='body1' color='secondary' aria-hidden>
                  &middot;
                </Typography>
              )}
              {rootPlaceId != null && (
                <UILink
                  component={NextLink}
                  href={EXTERNAL_EXPERIENCE_HREF(rootPlaceId)}
                  target='_blank'
                  color='inherit'
                  underline='none'
                  className={VIEW_EXPERIENCE_LINK_CLASS}>
                  <span className={VIEW_EXPERIENCE_TEXT_CLASS}>
                    {translate('Action.ViewExperience')}
                  </span>
                  <OpenInNewIcon className={VIEW_EXPERIENCE_ICON_CLASS} fontSize='small' />
                </UILink>
              )}
            </div>
            {/* Extra space above the status (on top of the column gap). */}
            <div className='padding-top-xsmall'>
              <AgreementStatusFromBatchMaps
                agreementId={agreementId ?? null}
                pill
                column={
                  {
                    statusByAgreementId:
                      agreementId && statusFromList !== undefined
                        ? { [agreementId]: statusFromList }
                        : {},
                    errorsByAgreementId:
                      agreementId && rowError ? { [agreementId]: rowError } : undefined,
                    isPending: statusIsPending,
                    isError: statusQueryEnabled && statusQuery.isError,
                  } satisfies AgreementStatusesColumnProps
                }
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

        <div className='flex flex-col'>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            className='[&_.MuiTab-root]:content-emphasis [&_.MuiTab-root]:text-body-large [&_.MuiTab-root]:!padding-bottom-medium [&_.MuiTab-root.Mui-selected]:content-emphasis'>
            <Tab label={translate('Label.Details')} value={MatchDetailsTabs.Details} />
            <Tab label={galleryTabLabel} value={MatchDetailsTabs.Gallery} />
          </Tabs>
          <AmDivider />
        </div>

        {currentTab === MatchDetailsTabs.Details && (
          <MatchDetailsTabContent candidate={candidate} universe={universe} />
        )}
        {currentTab === MatchDetailsTabs.Gallery && (
          <GalleryTabContent candidate={candidate} universe={universe} />
        )}
      </div>

      <MatchesSidePanel
        open={isOfferPanelOpen}
        onDismiss={handleCloseOfferPanel}
        testId='match-details-offer-side-panel'
        ariaLabel={translate('Heading.NewLicenseOffer')}
        dismissMode='match'>
        {isOfferPanelOpen && (
          <MatchOfferPanelContent
            candidate={candidate}
            onSuccess={handleAgreementSuccess}
            onClose={handleCloseOfferPanelByButton}
            source={currentTab === MatchDetailsTabs.Gallery ? 'galleryView' : 'detailsView'}
            candidateType={AgreementCandidateType.Universe}
            analyticsContext={offerAnalyticsContext}
            onPanelStateChange={handleOfferPanelStateChange}
          />
        )}
      </MatchesSidePanel>

      <MatchesSidePanel
        open={isIgnorePanelOpen}
        onDismiss={handleCloseIgnorePanel}
        testId='match-details-ignore-side-panel'
        ariaLabel={translate('Heading.IgnoreMatch')}
        dismissMode='match'>
        {isIgnorePanelOpen && (
          <IgnoreMatchPanelContent
            candidateId={candidate.id}
            candidateType={candidate.candidateType ?? AgreementCandidateType.Universe}
            onBack={handleCloseIgnorePanel}
            onClose={handleCloseIgnorePanel}
            onIgnored={handleMatchIgnored}
          />
        )}
      </MatchesSidePanel>
    </>
  );
};

export default withTranslation(IphMatchDetailsContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.AgreementsManager,
  TranslationNamespace.Licenses,
  TranslationNamespace.Error,
]);
