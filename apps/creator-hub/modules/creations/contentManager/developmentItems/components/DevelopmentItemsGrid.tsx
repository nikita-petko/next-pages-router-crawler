import type { FunctionComponent } from 'react';
import { memo, useCallback } from 'react';
import { getFormattedDateTime } from '@rbx/core';
import type { DevelopmentItemsInventoryItem } from '../developmentItemsInventoryUtils';
import DevelopmentItemActionsMenu from './DevelopmentItemActionsMenu';

export type DevelopmentItemsGridProps = {
  items: readonly DevelopmentItemsInventoryItem[];
  onSelectItem: (item: DevelopmentItemsInventoryItem) => void;
  thumbnailUrls: ReadonlyMap<number, string>;
};

type DevelopmentItemsGridItemProps = {
  item: DevelopmentItemsInventoryItem;
  onSelectItem: (item: DevelopmentItemsInventoryItem) => void;
  thumbnailUrl?: string;
};

const DevelopmentItemsGridItem: FunctionComponent<DevelopmentItemsGridItemProps> = memo(
  ({ item, onSelectItem, thumbnailUrl }) => {
    const timestamp = item.updated ?? item.created;
    const handleSelect = useCallback(() => {
      onSelectItem(item);
    }, [item, onSelectItem]);

    return (
      <div className='group relative min-width-0 width-full'>
        <button
          aria-label={item.name}
          className='flex flex-col gap-small min-width-0 width-full bg-none stroke-none padding-none cursor-pointer text-align-x-left focus-visible:outline-focus'
          onClick={handleSelect}
          type='button'>
          <div className='relative width-full aspect-1-1 clip radius-medium bg-surface-200'>
            {thumbnailUrl != null && (
              <img
                alt=''
                className='absolute inset-[0] width-full height-full [object-fit:contain]'
                src={thumbnailUrl}
              />
            )}
          </div>
          <div className='flex flex-col gap-xxsmall min-width-0 width-full padding-right-small padding-bottom-small'>
            <span className='text-body-medium content-emphasis text-no-wrap text-truncate-split width-full'>
              {item.name}
            </span>
            {timestamp != null && (
              <span className='text-body-small content-default text-no-wrap text-truncate-split width-full'>
                {getFormattedDateTime(timestamp)}
              </span>
            )}
          </div>
        </button>
        <div className='absolute inset-[0] [z-index:1] flex items-start justify-end padding-small pointer-events-none'>
          <div className='pointer-events-auto'>
            <DevelopmentItemActionsMenu
              item={item}
              onOpenDetails={onSelectItem}
              variant='OverMedia'
            />
          </div>
        </div>
      </div>
    );
  },
);

const DevelopmentItemsGrid: FunctionComponent<DevelopmentItemsGridProps> = ({
  items,
  onSelectItem,
  thumbnailUrls,
}) => (
  <div className='grid gap-large width-full min-width-0 [grid-template-columns:repeat(auto-fill,minmax(min(150px,100%),1fr))]'>
    {items.map((item) => (
      <DevelopmentItemsGridItem
        item={item}
        key={item.id}
        onSelectItem={onSelectItem}
        thumbnailUrl={thumbnailUrls.get(item.assetId)}
      />
    ))}
  </div>
);

export default DevelopmentItemsGrid;
