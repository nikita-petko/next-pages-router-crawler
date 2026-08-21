import { useMemo, type FunctionComponent, type ReactNode } from 'react';
import Link from 'next/link';
import type {
  AgreementCandidateResponse,
  IndexedAgreementCandidateResponse,
} from '@rbx/client-content-licensing-api/v1';
import { useFlag } from '@rbx/flags';
import { IconButton } from '@rbx/foundation-ui';
import { useTranslation, useTranslationWithNamespace } from '@rbx/intl';
import { Alert, Button, CircularProgress, Typography } from '@rbx/ui';
import { isIgnoreMatchEnabled as isIgnoreMatchEnabledFlag } from '@generated/flags/contentLicensing';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import Flex from '@modules/miscellaneous/components/Flex';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { KeyValuePair, KeyValuePairContainer } from '../../components/KeyValuePair';
import { IPH_AGREEMENT_DETAILS_HREF } from '../../urls';
import useCollectibleMatchItemDetails from '../hooks/useCollectibleMatchItemDetails';
import { BUTTON_SPINNER_SIZE } from '../utils/constants';
import CollectibleMatchContentTile from './CollectibleMatchContentTile';
import { getCollectibleMatchPresentation } from './collectibleMatchPresentation';
import getCollectibleItemTypeLabel from './getCollectibleItemTypeLabel';
import {
  AgreementStatusFromBatchMaps,
  type AgreementStatusesColumnProps,
} from './IphMatchStatusLabel';
import { canViewAgreement } from './matchPanelAgreementStatus';
import MatchPanelLayout from './MatchPanelLayout';
import type { MatchDetailsPanelNavigation, MatchPanelAgreementStatus } from './matchPanelTypes';

type CollectibleMatchCandidate = AgreementCandidateResponse &
  Pick<IndexedAgreementCandidateResponse, 'ipFamilyName' | 'candidateContentCreatorType'>;

interface CollectibleMatchDetailsPanelContentProps {
  candidate: CollectibleMatchCandidate;
  onClose: () => void;
  agreementStatusFromList?: MatchPanelAgreementStatus;
  navigation?: MatchDetailsPanelNavigation;
}

const CollectibleMatchDetailsPanelContent: FunctionComponent<
  CollectibleMatchDetailsPanelContentProps
> = ({ candidate, onClose, agreementStatusFromList, navigation }) => {
  const translation = useTranslation();
  const { translate } = translation;
  const { translate: translateCreations } = useTranslationWithNamespace(
    TranslationNamespace.Creations,
  );
  const { tPendingTranslation } = useTranslationWrapper(translation);
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

  if (itemDetailsQuery.isPending || !isIgnoreMatchFlagReady) {
    return (
      <MatchPanelLayout
        title={translate('Heading.ViewMatch')}
        onClose={onClose}
        headerControls={headerControls}
        loading
      />
    );
  }

  if (itemDetailsQuery.isError || !details) {
    return (
      <MatchPanelLayout
        title={translate('Heading.ViewMatch')}
        onClose={onClose}
        headerControls={headerControls}>
        <Typography color='error'>{translate('Error.LoadingData')}</Typography>
      </MatchPanelLayout>
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
        href={IPH_AGREEMENT_DETAILS_HREF(agreementId ?? '')}>
        {translate('Action.ViewAgreement')}
      </Button>
    );
  } else {
    primaryCta = (
      // TODO(MUS-2670): Implement offering a license for Collectible matches.
      <Button
        variant='contained'
        color='primaryBrand'
        size='large'
        className='fill [white-space:nowrap] text-align-x-center'>
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
        // TODO(MUS-2673): Implement ignoring Collectible matches.
        <Button variant='contained' color='secondary' size='large'>
          {translate('Action.Ignore')}
        </Button>
      )}
    </>
  );

  const presentation = getCollectibleMatchPresentation(
    details,
    candidate.candidateContentCreatorType ?? undefined,
  );
  const description = presentation.description?.trim()
    ? presentation.description
    : translate('Label.NoDescriptionAvailable');
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
