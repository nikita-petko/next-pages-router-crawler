import { useMemo } from 'react';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { Button, Skeleton } from '@rbx/ui';
import { isAvatarItemLicensingEnabled as isAvatarItemLicensingEnabledFlag } from '@generated/flags/contentLicensing';
import CellError from '../../../components/error/CellError';
import CollectibleItemTile from '../../components/CollectibleItemTile';
import useCollectibleMatchItemDetails from '../hooks/useCollectibleMatchItemDetails';
import type {
  CollectibleMatchCandidate,
  CollectibleMatchesDataReq,
} from './CollectibleMatchesTable';
import { getCollectibleMatchPresentation } from './collectibleMatchPresentation';

interface CollectibleMatchesGridProps {
  dataReq: CollectibleMatchesDataReq;
  onLoadMore?: () => void;
  onSelectMatch: (match: CollectibleMatchCandidate) => void;
  selectedMatchId?: string;
}

const CollectibleMatchesGrid = ({
  dataReq,
  onLoadMore,
  onSelectMatch,
  selectedMatchId,
}: CollectibleMatchesGridProps) => {
  const { translate } = useTranslation();
  const { ready: isAvatarItemLicensingFlagReady, value: isAvatarItemLicensingEnabled } = useFlag(
    isAvatarItemLicensingEnabledFlag,
  );
  const isCollectibleMatchesEnabled =
    isAvatarItemLicensingFlagReady && isAvatarItemLicensingEnabled;
  const { allAgreementCandidates, fetchNextPage, hasNextPage, isFetchingNextPage } = dataReq;
  const collectibleItemIds = useMemo(
    () => [
      ...new Set(
        allAgreementCandidates
          .map((candidate) => candidate.candidateId)
          .filter((candidateId): candidateId is string => Boolean(candidateId)),
      ),
    ],
    [allAgreementCandidates],
  );
  const itemDetailsQuery = useCollectibleMatchItemDetails(
    isCollectibleMatchesEnabled ? collectibleItemIds : [],
  );

  if (!isCollectibleMatchesEnabled) {
    return null;
  }

  let items;
  if (collectibleItemIds.length > 0 && itemDetailsQuery.isPending) {
    items = allAgreementCandidates.map((match) => (
      <div key={match.id} className='flex flex-col gap-xsmall padding-small'>
        <div className='width-full aspect-1-1'>
          <Skeleton variant='square' width='100%' height='100%' animate />
        </div>
        <Skeleton variant='text' width='75%' animate />
        <Skeleton variant='text' width='50%' animate />
      </div>
    ));
  } else if (itemDetailsQuery.error) {
    items = <CellError />;
  } else {
    items = allAgreementCandidates.map((match) => {
      const details = match.candidateId ? itemDetailsQuery.data?.[match.candidateId] : undefined;
      if (!details) {
        return (
          <div key={match.id} className='padding-small'>
            <CellError />
          </div>
        );
      }

      const presentation = getCollectibleMatchPresentation(
        details,
        match.candidateContentCreatorType ?? undefined,
      );
      return (
        <CollectibleItemTile
          key={match.id}
          thumbnailTargetId={presentation.thumbnailTargetId}
          itemType={presentation.isBundle ? 'bundle' : 'asset'}
          name={presentation.name ?? translate('Label.Unknown')}
          creatorDisplayName={presentation.creatorDisplayName}
          price={presentation.price}
          limitedType={presentation.isLimited ? 'limited' : undefined}
          isSelected={match.id != null && match.id === selectedMatchId}
          onClick={() => onSelectMatch(match)}
        />
      );
    });
  }

  return (
    <div data-testid='collectible-matches-grid'>
      <div className='grid width-full gap-large items-start [grid-template-columns:repeat(auto-fill,minmax(min(100%,150px),1fr))] medium:[grid-template-columns:repeat(auto-fill,minmax(min(100%,180px),1fr))]'>
        {items}
      </div>
      {hasNextPage && (
        <div className='padding-large text-align-x-center'>
          <Button
            onClick={() => {
              onLoadMore?.();
              void fetchNextPage();
            }}
            disabled={isFetchingNextPage}
            variant='outlined'
            color='secondary'>
            {isFetchingNextPage ? translate('Label.Loading') : translate('Action.LoadMore')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CollectibleMatchesGrid;
