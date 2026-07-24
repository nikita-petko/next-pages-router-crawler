import type { FunctionComponent, ReactNode } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import NextLink from 'next/link';
import { AgreementStatus } from '@rbx/client-content-licensing-api/v1';
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
import { isExperiencePreviewEnabled as isExperiencePreviewEnabledFlag } from '@generated/flags/contentLicensing';
import { PageLoading } from '@modules/miscellaneous/components';
import { PageNotFound } from '@modules/miscellaneous/error';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import IpLoadError from '../../components/error/IpLoadError';
import { useIpLayoutContext } from '../../IpAppNavigationLayout';
import AmDivider from '../components/AmDivider';
import { EXTERNAL_EXPERIENCE_HREF, IPH_AGREEMENT_DETAILS_HREF } from '../urls';
import GalleryTabContent from './components/GalleryTabContent';
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
import { useUniverseDetailsQuery } from './hooks/useUniverseDetailsQuery';

const AGREEMENT_STATUSES_FOR_VIEW_AGREEMENT = new Set<AgreementStatus>([
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

  const [isOfferPanelOpen, setIsOfferPanelOpen] = useState(false);

  const candidateQuery = useGetAgreementCandidateByIdQuery({ agreementCandidateId });
  const candidate = candidateQuery.data;

  const experienceId = candidate ? Number(candidate.candidateId) : undefined;

  const { ready: isExperiencePreviewFlagReady, value: isExperiencePreviewEnabled } = useFlag(
    isExperiencePreviewEnabledFlag,
    { universeId: experienceId ?? 0 },
  );

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

  const [queryParams, setQueryParams] = useQueryParams(['tab']);
  const rawTab = queryParams.tab;
  const tabParam = Array.isArray(rawTab) ? rawTab[0] : (rawTab ?? undefined);
  const currentTab = isMatchDetailsTab(tabParam) ? tabParam : MatchDetailsTabs.Details;

  useEffect(() => {
    if (!isMatchDetailsTab(tabParam)) {
      setQueryParams({ tab: MatchDetailsTabs.Details }, { skipHistory: true });
    }
  }, [tabParam, setQueryParams]);

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
    setIsOfferPanelOpen(true);
  }, []);

  const handleCloseOfferPanel = useCallback(() => {
    setIsOfferPanelOpen(false);
  }, []);

  const handleAgreementSuccess = useCallback(() => {
    setIsOfferPanelOpen(false);
    void refetchAgreementStatuses();
  }, [refetchAgreementStatuses]);

  const hasValidExperienceId = experienceId != null && Number.isFinite(experienceId);

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

  const creatorName = universe.creatorName ? `@${universe.creatorName}` : '';
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
        <CircularProgress color='inherit' size={22} />
      </Button>
    );
  } else if (showViewAgreement && agreementId) {
    primaryCta = (
      <Button
        variant='contained'
        color='primaryBrand'
        size='large'
        component={NextLink}
        href={IPH_AGREEMENT_DETAILS_HREF(agreementId)}>
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
          {primaryCta}
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
            onClose={handleCloseOfferPanel}
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
