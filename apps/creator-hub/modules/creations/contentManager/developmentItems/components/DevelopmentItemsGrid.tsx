import type { FunctionComponent, MouseEvent } from 'react';
import { memo, useCallback, useState } from 'react';
import { getInternationalizedFormattedDate } from '@rbx/core';
import { useVisibleImpression } from '@modules/licenses/hooks/useVisibleImpression';
import {
  logDevelopmentItemClick,
  logDevelopmentItemImpression,
} from '../developmentItemsAnalytics';
import type { DevelopmentItemsInventoryItem } from '../developmentItemsInventoryUtils';
import type { DevelopmentItemToolboxIds } from '../useDevelopmentItemToolboxIds';
import DevelopmentItemActionsMenu, {
  type DevelopmentItemArchiveStateChangeHandler,
} from './DevelopmentItemActionsMenu';
import DevelopmentItemContextMenu from './DevelopmentItemContextMenu';
import type { DevelopmentItemContextMenuPosition } from './DevelopmentItemContextMenu';
import DevelopmentItemPackageBadge from './DevelopmentItemPackageBadge';

export type DevelopmentItemsGridProps = {
  archivableAssetIds: ReadonlySet<number>;
  items: readonly DevelopmentItemsInventoryItem[];
  onArchiveStateChange: DevelopmentItemArchiveStateChangeHandler;
  onConfigureAsset: (item: DevelopmentItemsInventoryItem) => void;
  onSelectItem: (item: DevelopmentItemsInventoryItem) => void;
  onViewAssetDetails: (item: DevelopmentItemsInventoryItem) => void;
  packageLabel: string;
  pageNumber: number;
  pageSize: number;
  thumbnailUrls: ReadonlyMap<number, string>;
  toolboxIdsByAssetId: ReadonlyMap<number, DevelopmentItemToolboxIds>;
};

type DevelopmentItemsGridItemProps = {
  isArchivable: boolean;
  item: DevelopmentItemsInventoryItem;
  onArchiveStateChange: DevelopmentItemArchiveStateChangeHandler;
  onConfigureAsset: (item: DevelopmentItemsInventoryItem) => void;
  onSelectItem: (item: DevelopmentItemsInventoryItem) => void;
  onViewAssetDetails: (item: DevelopmentItemsInventoryItem) => void;
  packageLabel: string;
  pageNumber: number;
  pageSize: number;
  position: number;
  thumbnailUrl?: string;
  toolboxIds?: DevelopmentItemToolboxIds;
};

const DevelopmentItemsGridItem: FunctionComponent<DevelopmentItemsGridItemProps> = memo(
  ({
    isArchivable,
    item,
    onArchiveStateChange,
    onConfigureAsset,
    onSelectItem,
    onViewAssetDetails,
    packageLabel,
    pageNumber,
    pageSize,
    position,
    thumbnailUrl,
    toolboxIds,
  }) => {
    const timestamp = item.updated ?? item.created;
    const [contextMenuPosition, setContextMenuPosition] =
      useState<DevelopmentItemContextMenuPosition>();
    const logImpression = useCallback(() => {
      logDevelopmentItemImpression({
        item,
        pageNumber,
        pageSize,
        position,
        view: 'grid',
      });
    }, [item, pageNumber, pageSize, position]);
    const itemRef = useVisibleImpression<HTMLDivElement>(logImpression);
    const handleSelect = useCallback(() => {
      logDevelopmentItemClick({
        item,
        pageNumber,
        pageSize,
        position,
        view: 'grid',
      });
      onSelectItem(item);
    }, [item, onSelectItem, pageNumber, pageSize, position]);
    const handleContextMenu = useCallback((event: MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setContextMenuPosition({ x: event.clientX, y: event.clientY });
    }, []);
    const handleCloseContextMenu = useCallback(() => {
      setContextMenuPosition(undefined);
    }, []);

    return (
      <div
        className='group relative min-width-0 width-full'
        onContextMenu={handleContextMenu}
        ref={itemRef}>
        <button
          aria-label={item.name}
          className='flex flex-col gap-small min-width-0 width-full bg-none stroke-none padding-none cursor-pointer text-align-x-left focus-visible:outline-focus'
          onClick={handleSelect}
          type='button'>
          <div className='relative width-full aspect-1-1 clip radius-medium bg-shift-300'>
            {thumbnailUrl != null && (
              <img
                alt=''
                className='absolute inset-[0] width-full height-full [object-fit:contain]'
                src={thumbnailUrl}
              />
            )}
            {item.isPackage && <DevelopmentItemPackageBadge label={packageLabel} size='Medium' />}
          </div>
          <div className='flex flex-col gap-xxsmall min-width-0 width-full padding-right-small padding-bottom-small'>
            <span className='text-body-medium content-emphasis text-no-wrap text-truncate-split width-full'>
              {item.name}
            </span>
            {timestamp != null && (
              <span className='text-body-small content-default text-no-wrap text-truncate-split width-full'>
                {getInternationalizedFormattedDate(timestamp)}
              </span>
            )}
          </div>
        </button>
        <div className='absolute inset-[0] [z-index:1] flex items-start justify-end padding-small pointer-events-none'>
          <div className='pointer-events-auto'>
            <DevelopmentItemActionsMenu
              isArchivable={isArchivable}
              item={item}
              onArchiveStateChange={onArchiveStateChange}
              onConfigureAsset={onConfigureAsset}
              onViewAssetDetails={onViewAssetDetails}
              toolboxIds={toolboxIds}
              variant='OverMedia'
            />
          </div>
        </div>
        <DevelopmentItemContextMenu
          isArchivable={isArchivable}
          item={item}
          onArchiveStateChange={onArchiveStateChange}
          onClose={handleCloseContextMenu}
          onConfigureAsset={onConfigureAsset}
          onViewAssetDetails={onViewAssetDetails}
          position={contextMenuPosition}
          toolboxIds={toolboxIds}
        />
      </div>
    );
  },
);

const DevelopmentItemsGrid: FunctionComponent<DevelopmentItemsGridProps> = ({
  archivableAssetIds,
  items,
  onArchiveStateChange,
  onConfigureAsset,
  onSelectItem,
  onViewAssetDetails,
  packageLabel,
  pageNumber,
  pageSize,
  thumbnailUrls,
  toolboxIdsByAssetId,
}) => (
  <div className='grid gap-large width-full min-width-0 [grid-template-columns:repeat(auto-fill,minmax(min(150px,100%),1fr))]'>
    {items.map((item, index) => (
      <DevelopmentItemsGridItem
        isArchivable={archivableAssetIds.has(item.assetId)}
        item={item}
        key={item.id}
        onArchiveStateChange={onArchiveStateChange}
        onConfigureAsset={onConfigureAsset}
        onSelectItem={onSelectItem}
        onViewAssetDetails={onViewAssetDetails}
        packageLabel={packageLabel}
        pageNumber={pageNumber}
        pageSize={pageSize}
        position={(pageNumber - 1) * pageSize + index + 1}
        thumbnailUrl={thumbnailUrls.get(item.assetId)}
        toolboxIds={toolboxIdsByAssetId.get(item.assetId)}
      />
    ))}
  </div>
);

export default DevelopmentItemsGrid;
