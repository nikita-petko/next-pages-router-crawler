import type { FunctionComponent } from 'react';
import { memo, useCallback } from 'react';
import { getFormattedDateTime } from '@rbx/core';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  VisuallyHidden,
} from '@rbx/foundation-ui';
import type { DevelopmentItemsInventoryItem } from '../developmentItemsInventoryUtils';
import DevelopmentItemActionsMenu, {
  type DevelopmentItemArchiveStateChangeHandler,
} from './DevelopmentItemActionsMenu';
import DevelopmentItemsPagination from './DevelopmentItemsPagination';
import type { DevelopmentItemsPaginationProps } from './DevelopmentItemsPagination';

export type DevelopmentItemsListLabels = {
  actions: string;
  assetId: string;
  assetType: string;
  lastUpdated: string;
  name: string;
  source: string;
};

export type DevelopmentItemsListProps = {
  archivableAssetIds: ReadonlySet<number>;
  getAssetTypeLabel: (item: DevelopmentItemsInventoryItem) => string;
  getSourceLabel: (item: DevelopmentItemsInventoryItem) => string;
  items: readonly DevelopmentItemsInventoryItem[];
  labels: DevelopmentItemsListLabels;
  onArchiveStateChange: DevelopmentItemArchiveStateChangeHandler;
  onSelectItem: (item: DevelopmentItemsInventoryItem) => void;
  pagination: DevelopmentItemsPaginationProps;
  thumbnailUrls: ReadonlyMap<number, string>;
};

const STICKY_ACTIONS_HEADER_CLASS =
  'sticky [right:0] [z-index:2] min-width-1400 !padding-left-small !padding-right-small';
const STICKY_ACTIONS_CELL_CLASS =
  'sticky [right:0] [z-index:1] min-width-1400 !padding-left-small !padding-right-small';

type DevelopmentItemsListRowProps = {
  getAssetTypeLabel: (item: DevelopmentItemsInventoryItem) => string;
  getSourceLabel: (item: DevelopmentItemsInventoryItem) => string;
  isArchivable: boolean;
  item: DevelopmentItemsInventoryItem;
  onArchiveStateChange: DevelopmentItemArchiveStateChangeHandler;
  onSelectItem: (item: DevelopmentItemsInventoryItem) => void;
  thumbnailUrl?: string;
};

const DevelopmentItemsListRow: FunctionComponent<DevelopmentItemsListRowProps> = memo(
  ({
    getAssetTypeLabel,
    getSourceLabel,
    isArchivable,
    item,
    onArchiveStateChange,
    onSelectItem,
    thumbnailUrl,
  }) => {
    const updated = item.updated ?? item.created;
    const handleSelect = useCallback(() => {
      onSelectItem(item);
    }, [item, onSelectItem]);

    return (
      <TableRow className='group' isInteractive onClick={handleSelect}>
        <TableCell>
          <div className='flex items-center gap-medium min-width-0'>
            <div className='relative size-1000 shrink-0 clip radius-medium bg-surface-200'>
              {thumbnailUrl != null && (
                <img
                  alt=''
                  className='width-full height-full [object-fit:contain]'
                  src={thumbnailUrl}
                />
              )}
            </div>
            <span className='text-body-medium content-emphasis text-no-wrap text-truncate-split'>
              {item.name}
            </span>
          </div>
        </TableCell>
        <TableCell>{getAssetTypeLabel(item)}</TableCell>
        <TableCell>{item.assetId}</TableCell>
        <TableCell>{getSourceLabel(item)}</TableCell>
        <TableCell>{updated == null ? undefined : getFormattedDateTime(updated)}</TableCell>
        <TableCell align='end' className={STICKY_ACTIONS_CELL_CLASS}>
          <div className='flex justify-end'>
            <DevelopmentItemActionsMenu
              isArchivable={isArchivable}
              item={item}
              onArchiveStateChange={onArchiveStateChange}
              onOpenDetails={onSelectItem}
              variant='OverMedia'
            />
          </div>
        </TableCell>
      </TableRow>
    );
  },
);

const DevelopmentItemsList: FunctionComponent<DevelopmentItemsListProps> = ({
  archivableAssetIds,
  getAssetTypeLabel,
  getSourceLabel,
  items,
  labels,
  onArchiveStateChange,
  onSelectItem,
  pagination,
  thumbnailUrls,
}) => (
  <div className='flex flex-col width-full min-width-0'>
    <div className='width-full min-width-0 [&>div]:bg-none [&>div]:max-width-full [&>div]:!scroll-x'>
      <Table
        className='[min-width:1040px] [&_th:first-child]:[min-width:260px] [&_td:first-child]:[min-width:260px]'
        size='Medium'
        variant='Framed'>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>{labels.name}</TableHeaderCell>
            <TableHeaderCell>{labels.assetType}</TableHeaderCell>
            <TableHeaderCell>{labels.assetId}</TableHeaderCell>
            <TableHeaderCell>{labels.source}</TableHeaderCell>
            <TableHeaderCell>{labels.lastUpdated}</TableHeaderCell>
            <TableHeaderCell className={STICKY_ACTIONS_HEADER_CLASS}>
              <VisuallyHidden>{labels.actions}</VisuallyHidden>
            </TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <DevelopmentItemsListRow
              getAssetTypeLabel={getAssetTypeLabel}
              getSourceLabel={getSourceLabel}
              isArchivable={archivableAssetIds.has(item.assetId)}
              item={item}
              key={item.id}
              onArchiveStateChange={onArchiveStateChange}
              onSelectItem={onSelectItem}
              thumbnailUrl={thumbnailUrls.get(item.assetId)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
    <DevelopmentItemsPagination {...pagination} />
  </div>
);

export default DevelopmentItemsList;
