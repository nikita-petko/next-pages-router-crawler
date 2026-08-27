import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FunctionComponent,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import {
  AgreementCandidateType,
  type AgreementCandidateResponse,
  type IndexedAgreementCandidateResponse,
} from '@rbx/client-content-licensing-api/v1';
import { useFlag } from '@rbx/flags';
import { IconButton } from '@rbx/foundation-ui';
import { useTranslation, useTranslationWithNamespace } from '@rbx/intl';
import { Alert, Button, CircularProgress, Typography } from '@rbx/ui';
import { isIgnoreMatchEnabled as isIgnoreMatchEnabledFlag } from '@generated/flags/contentLicensing';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import Flex from '@modules/miscellaneous/components/Flex';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { KeyValuePair, KeyValuePairContainer } from '../../components/KeyValuePair';
import { IPH_AGREEMENT_DETAILS_HREF } from '../../urls';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
  useLicenseManagerLoggerLogOnce,
} from '../../utils/logger';
import useCollectibleMatchItemDetails from '../hooks/useCollectibleMatchItemDetails';
import { BUTTON_SPINNER_SIZE } from '../utils/constants';
import CollectibleMatchContentTile from './CollectibleMatchContentTile';
import { getCollectibleMatchPresentation } from './collectibleMatchPresentation';
import getCollectibleItemTypeLabel from './getCollectibleItemTypeLabel';
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

type CollectibleMatchCandidate = AgreementCandidateResponse &
  Pick<IndexedAgreementCandidateResponse, 'ipFamilyName' | 'candidateContentCreatorType'>;

interface CollectibleMatchDetailsPanelContentProps {
  candidate: CollectibleMatchCandidate;
  onClose: () => void;
  onOfferLicense: () => void;
  /** Called after a match is successfully ignored so the parent can prune and advance. */
  onIgnored?: () => void;
  agreementStatusFromList?: MatchPanelAgreementStatus;
  navigation?: MatchDetailsPanelNavigation;
  rowPosition?: number;
  onPanelStateChange?: (state: MatchPanelState) => void;
}

const CollectibleMatchDetailsPanelContent: FunctionComponent<
  CollectibleMatchDetailsPanelContentProps
> = ({
  candidate,
  onClose,
  onOfferLicense,
  onIgnored,
  agreementStatusFromList,
  navigation,
  rowPosition,
  onPanelStateChange,
}) => {
  const translation = useTranslation();
  const { translate } = translation;
  const { translate: translateCreations } = useTranslationWithNamespace(
    TranslationNamespace.Creations,
  );
  const { translate: translateControls } = useTranslationWithNamespace(
    TranslationNamespace.Controls,
  );
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const { logEvent } = useLicenseManagerLogger();
  const { logOnce } = useLicenseManagerLoggerLogOnce();
  const [ignoreReasonViewCandidateId, setIgnoreReasonViewCandidateId] = useState<string | null>(
    null,
  );
  const { ready: isIgnoreMatchFlagReady, value: isIgnoreMatchEnabled } =
    useFlag(isIgnoreMatchEnabledFlag);
  const collectibleItemId = candidate.candidateId;
  const collectibleItemIds = useMemo(
    () => (collectibleItemId ? [collectibleItemId] : []),
    [collectibleItemId],
  );
  const itemDetailsQuery = useCollectibleMatchItemDetails(collectibleItemIds);
  const details = collectibleItemId ? itemDetailsQuery.data?.[collectibleItemId] : undefined;
  const agreementId = candidate.agreementId?.trim();
  const rowError = agreementStatusFromList?.rowError;
  const statusFromList = agreementStatusFromList?.status;
  const waitingOnAgreementStatus = !!agreementId && !!agreementStatusFromList?.isPending;
  const showViewAgreement = canViewAgreement({
    agreementId,
    rowError,
    status: statusFromList,
  });
  const isIgnoreMatchAllowed = isIgnoreMatchFlagReady && isIgnoreMatchEnabled;
  const showIgnoreButton = isIgnoreMatchAllowed && !waitingOnAgreementStatus && !showViewAgreement;
  const isIgnoreReasonViewOpen =
    ignoreReasonViewCandidateId != null && ignoreReasonViewCandidateId === candidate.id;

  const handleIgnoreClick = useCallback(() => {
    if (isIgnoreMatchAllowed) {
      logEvent(LicenseManagerClickEvent.IgnoreMatchPanelOpenClickEvent, {
        candidateType: AgreementCandidateType.Collectible,
      });
      setIgnoreReasonViewCandidateId(candidate.id ?? null);
    }
  }, [candidate.id, isIgnoreMatchAllowed, logEvent]);
  const handleIgnoreBack = useCallback(() => {
    setIgnoreReasonViewCandidateId(null);
  }, []);
  const handleMatchIgnored = useCallback(() => {
    if (!isIgnoreMatchAllowed) {
      return;
    }
    setIgnoreReasonViewCandidateId(null);
    onIgnored?.();
  }, [isIgnoreMatchAllowed, onIgnored]);
  const isLoading = itemDetailsQuery.isPending || !isIgnoreMatchFlagReady;
  const hasLoadFailure = !isLoading && (itemDetailsQuery.isError || !details);
  const panelState: MatchPanelState = isLoading ? 'loading' : hasLoadFailure ? 'error' : 'ready';
  const presentation = details
    ? getCollectibleMatchPresentation(details, candidate.candidateContentCreatorType ?? undefined)
    : undefined;
  const itemType = presentation?.isBundle ? 'Bundle' : presentation ? 'Asset' : 'Unknown';
  const agreementState = rowError
    ? 'error'
    : waitingOnAgreementStatus
      ? 'pending'
      : showViewAgreement
        ? 'viewable'
        : 'notViewable';
  const analyticsContext = useMemo(
    () => ({
      candidateType: AgreementCandidateType.Collectible,
      itemType,
      agreementState,
      ...(rowPosition === undefined ? {} : { rowPosition }),
    }),
    [agreementState, itemType, rowPosition],
  );
  const analyticsDedupeKey = candidate.id ?? candidate.candidateId ?? 'unknown';

  useEffect(() => {
    if (panelState !== 'ready') {
      return;
    }
    onPanelStateChange?.('ready');
    logOnce(
      LicenseManagerImpressionEvent.MatchDetailsPanelImpressionEvent,
      analyticsContext,
      `${analyticsDedupeKey}:ready`,
    );
  }, [analyticsContext, analyticsDedupeKey, logOnce, onPanelStateChange, panelState]);

  useEffect(() => {
    if (panelState !== 'error') {
      return;
    }
    onPanelStateChange?.('error');
    logOnce(
      LicenseManagerImpressionEvent.MatchDetailsPanelLoadFailureImpressionEvent,
      {
        ...analyticsContext,
        failureReason: itemDetailsQuery.isError ? 'requestError' : 'missingItem',
      },
      `${analyticsDedupeKey}:error`,
    );
  }, [
    analyticsContext,
    analyticsDedupeKey,
    itemDetailsQuery.isError,
    logOnce,
    onPanelStateChange,
    panelState,
  ]);

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

  if (isLoading) {
    return (
      <MatchPanelLayout
        title={translate('Heading.ViewMatch')}
        onClose={onClose}
        headerControls={headerControls}
        loading
      />
    );
  }

  if (hasLoadFailure || !details || !presentation) {
    return (
      <MatchPanelLayout
        title={translate('Heading.ViewMatch')}
        onClose={onClose}
        headerControls={headerControls}>
        <Typography color='error'>{translate('Error.LoadingData')}</Typography>
      </MatchPanelLayout>
    );
  }

  if (isIgnoreReasonViewOpen) {
    return (
      <IgnoreMatchPanelContent
        candidateId={candidate.id}
        candidateType={AgreementCandidateType.Collectible}
        onBack={handleIgnoreBack}
        onClose={onClose}
        onIgnored={handleMatchIgnored}
      />
    );
  }

  let primaryCta: ReactNode;
  if (waitingOnAgreementStatus) {
    primaryCta = (
      <Button
        variant='contained'
        color='primaryBrand'
        size='large'
        className='fill [white-space:nowrap] text-align-x-center'
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
        className='fill [white-space:nowrap] text-align-x-center'
        component={Link}
        href={IPH_AGREEMENT_DETAILS_HREF(agreementId ?? '')}
        onClick={() =>
          logEvent(LicenseManagerClickEvent.MatchDetailsPanelViewAgreementClickEvent, {
            ...analyticsContext,
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
        className='fill [white-space:nowrap] text-align-x-center'
        onClick={onOfferLicense}>
        {translate('Action.OfferLicense')}
      </Button>
    );
  }

  const footerButtons = (
    <>
      {primaryCta}
      <Button
        variant='contained'
        color='secondary'
        size='large'
        className='fill [white-space:nowrap] text-align-x-center'
        onClick={() => {
          // TODO(MUS-2665): Navigate to the Collectible full-page match details experience.
        }}>
        {translate('Action.ViewDetails')}
      </Button>
      {showIgnoreButton && (
        <Button variant='contained' color='secondary' size='large' onClick={handleIgnoreClick}>
          {translate('Action.Ignore')}
        </Button>
      )}
    </>
  );

  const description = presentation.description?.trim()
    ? presentation.description
    : translate('Label.NoDescriptionAvailable');
  const limitedLabel = tPendingTranslation(
    'Limited',
    'Label indicating whether an avatar marketplace item has a limited supply.',
    translationKey('Label.Limited', TranslationNamespace.AgreementsManager),
  );
  const resellAllowedLabel = tPendingTranslation(
    'Resell allowed',
    'Label indicating whether owners may resell a limited avatar marketplace item.',
    translationKey('Label.ResellAllowed', TranslationNamespace.AgreementsManager),
  );
  const statusColumn: AgreementStatusesColumnProps = {
    statusByAgreementId:
      agreementId && statusFromList !== undefined ? { [agreementId]: statusFromList } : {},
    errorsByAgreementId: agreementId && rowError ? { [agreementId]: rowError } : undefined,
    isPending: agreementStatusFromList?.isPending ?? false,
    isError: agreementStatusFromList?.isError ?? false,
  };

  return (
    <MatchPanelLayout
      title={translate('Heading.ViewMatch')}
      onClose={onClose}
      headerControls={headerControls}
      buttons={footerButtons}>
      {rowError && <Alert severity='error'>{translate('Label.ErrorFetchingStatus')}</Alert>}
      <Flex flexDirection='column'>
        <Typography variant='h6'>{translate('Label.Creation')}</Typography>
        <CollectibleMatchContentTile
          details={details}
          creatorType={candidate.candidateContentCreatorType ?? undefined}
          onLinkClick={() =>
            logEvent(LicenseManagerClickEvent.MatchDetailsPanelViewCreationClickEvent, {
              ...analyticsContext,
              destination: presentation.isBundle ? 'bundleDetails' : 'catalogDetails',
            })
          }
        />
        <KeyValuePairContainer>
          <KeyValuePair
            label={translate('Label.Description')}
            value={<Typography whiteSpace='pre-wrap'>{description}</Typography>}
          />
          <KeyValuePair
            label={translate('Label.Type')}
            value={getCollectibleItemTypeLabel(details, translateCreations, tPendingTranslation)}
          />
          <KeyValuePair
            label={limitedLabel}
            value={translateControls(presentation.isLimited ? 'Action.Yes' : 'Action.No')}
          />
          {presentation.isLimited && (
            <KeyValuePair
              label={resellAllowedLabel}
              value={translateControls(presentation.isResellAllowed ? 'Action.Yes' : 'Action.No')}
            />
          )}
          <KeyValuePair
            label={translate('Label.DetectedIpFamily')}
            value={candidate.ipFamilyName}
          />
          <KeyValuePair
            label={translate('Label.Status')}
            value={
              <AgreementStatusFromBatchMaps
                agreementId={agreementId ?? null}
                column={statusColumn}
              />
            }
          />
        </KeyValuePairContainer>
      </Flex>
    </MatchPanelLayout>
  );
};

export default CollectibleMatchDetailsPanelContent;
