import { useMemo } from 'react';
import type { RevenueTargetResponse } from '@rbx/client-content-licensing-api/v1';
import { useTranslation } from '@rbx/intl';
import { Skeleton } from '@rbx/ui';
import { getBundleUrl, getCatalogUrl } from '@modules/miscellaneous/urls/www';
import CellError from '../../../components/error/CellError';
import CollectibleItemTile from '../../components/CollectibleItemTile';
import useCollectibleMatchItemDetails from '../hooks/useCollectibleMatchItemDetails';
import { getCollectibleMatchPresentation } from './collectibleMatchPresentation';

interface CollectibleRevenueTargetGridProps {
  revenueTargets: RevenueTargetResponse[];
}

const CollectibleRevenueTargetGrid = ({ revenueTargets }: CollectibleRevenueTargetGridProps) => {
  const { translate } = useTranslation();
  const collectibleItemIds = useMemo(
    () => [
      ...new Set(
        revenueTargets
          .map(({ revenueTargetId }) => revenueTargetId?.trim())
          .filter((revenueTargetId): revenueTargetId is string => Boolean(revenueTargetId)),
      ),
    ],
    [revenueTargets],
  );
  const itemDetailsQuery = useCollectibleMatchItemDetails(collectibleItemIds);

  if (collectibleItemIds.length === 0) {
    return null;
  }

  let items;
  if (itemDetailsQuery.isPending) {
    items = collectibleItemIds.map((collectibleItemId) => (
      <div key={collectibleItemId} className='flex flex-col gap-xsmall padding-small'>
        <div className='width-full aspect-1-1'>
          <Skeleton variant='square' width='100%' height='100%' animate />
        </div>
        <Skeleton variant='text' width='75%' animate />
        <Skeleton variant='text' width='50%' animate />
      </div>
    ));
  } else if (itemDetailsQuery.isError) {
    items = <CellError />;
  } else {
    items = collectibleItemIds.map((collectibleItemId) => {
      const details = itemDetailsQuery.data?.[collectibleItemId];
      if (!details) {
        return (
          <div key={collectibleItemId} className='padding-small'>
            <CellError />
          </div>
        );
      }

      const presentation = getCollectibleMatchPresentation(details);
      const href =
        presentation.targetId == null
          ? undefined
          : presentation.isBundle
            ? getBundleUrl(presentation.targetId)
            : getCatalogUrl(presentation.targetId);

      return (
        <CollectibleItemTile
          key={collectibleItemId}
          thumbnailTargetId={presentation.thumbnailTargetId}
          itemType={presentation.isBundle ? 'bundle' : 'asset'}
          name={presentation.name ?? translate('Label.Unknown')}
          creatorDisplayName={presentation.creatorDisplayName}
          price={presentation.price}
          limitedType={presentation.isLimited ? 'limited' : undefined}
          href={href}
          className='padding-small radius-small transition-colors hover:bg-shift-100 focus-visible:outline-focus'
        />
      );
    });
  }

  return (
    <div
      data-testid='collectible-revenue-target-grid'
      className='grid width-full gap-large items-start [grid-template-columns:repeat(auto-fill,minmax(min(100%,150px),1fr))] medium:[grid-template-columns:repeat(auto-fill,minmax(min(100%,180px),1fr))]'>
      {items}
    </div>
  );
};

export default CollectibleRevenueTargetGrid;
