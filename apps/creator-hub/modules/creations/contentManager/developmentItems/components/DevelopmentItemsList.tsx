import type { FunctionComponent, MouseEvent } from 'react';
import { memo, useCallback, useState } from 'react';
import { getInternationalizedFormattedDate } from '@rbx/core';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  VisuallyHidden,
} from '@rbx/foundation-ui';
import { useVisibleImpression } from '@modules/licenses/hooks/useVisibleImpression';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import {
  logDevelopmentItemClick,
  logDevelopmentItemImpression,
  logDevelopmentItemsMenuAction,
} from '../developmentItemsAnalytics';
import type { DevelopmentItemsInventoryItem } from '../developmentItemsInventoryUtils';
import type { DevelopmentItemToolboxIds } from '../useDevelopmentItemToolboxIds';
import DevelopmentItemActionsMenu, {
  type DevelopmentItemArchiveStateChangeHandler,
} from './DevelopmentItemActionsMenu';
import DevelopmentItemContextMenu from './DevelopmentItemContextMenu';
import type { DevelopmentItemContextMenuPosition } from './DevelopmentItemContextMenu';
import DevelopmentItemPackageBadge from './DevelopmentItemPackageBadge';
import DevelopmentItemsPagination from './DevelopmentItemsPagination';
import type { DevelopmentItemsPaginationProps } from './DevelopmentItemsPagination';

export type DevelopmentItemsListLabels = {
  actions: string;
  assetId: string;
  assetIdCopied: string;
  assetIdWithValue: (assetId: number) => string;
  dateCreated: string;
  lastUpdated: string;
  name: string;
  package: string;
  source: string;
};

export type DevelopmentItemsListProps = {
  archivableAssetIds: ReadonlySet<number>;
  getSourceLabel: (item: DevelopmentItemsInventoryItem) => string;
  items: readonly DevelopmentItemsInventoryItem[];
  labels: DevelopmentItemsListLabels;
  onArchiveStateChange: DevelopmentItemArchiveStateChangeHandler;
  onConfigureAsset: (item: DevelopmentItemsInventoryItem) => void;
  onSelectItem: (item: DevelopmentItemsInventoryItem) => void;
  onViewAssetDetails: (item: DevelopmentItemsInventoryItem) => void;
  pagination: DevelopmentItemsPaginationProps;
  thumbnailUrls: ReadonlyMap<number, string>;
  toolboxIdsByAssetId: ReadonlyMap<number, DevelopmentItemToolboxIds>;
};

const STICKY_ACTIONS_HEADER_CLASS =
  'sticky [right:0] [z-index:2] min-width-1400 !padding-left-small !padding-right-small';
const STICKY_ACTIONS_CELL_CLASS =
  'sticky [right:0] [z-index:1] min-width-1400 !padding-left-small !padding-right-small';
const NO_WRAP_CELL_CLASS = 'text-no-wrap';

type DevelopmentItemsListRowProps = {
  getSourceLabel: (item: DevelopmentItemsInventoryItem) => string;
  isArchivable: boolean;
  item: DevelopmentItemsInventoryItem;
  labels: Pick<DevelopmentItemsListLabels, 'assetIdCopied' | 'assetIdWithValue' | 'package'>;
  onArchiveStateChange: DevelopmentItemArchiveStateChangeHandler;
  onConfigureAsset: (item: DevelopmentItemsInventoryItem) => void;
  onSelectItem: (item: DevelopmentItemsInventoryItem) => void;
  onViewAssetDetails: (item: DevelopmentItemsInventoryItem) => void;
  pageNumber: number;
  pageSize: number;
  position: number;
  thumbnailUrl?: string;
  toolboxIds?: DevelopmentItemToolboxIds;
};

const DevelopmentItemsListRow: FunctionComponent<DevelopmentItemsListRowProps> = memo(
  ({
    getSourceLabel,
    isArchivable,
    item,
    labels,
    onArchiveStateChange,
    onConfigureAsset,
    onSelectItem,
    onViewAssetDetails,
    pageNumber,
    pageSize,
    position,
    thumbnailUrl,
    toolboxIds,
  }) => {
    const [contextMenuPosition, setContextMenuPosition] =
      useState<DevelopmentItemContextMenuPosition>();
    const logImpression = useCallback(() => {
      logDevelopmentItemImpression({
        item,
        pageNumber,
        pageSize,
        position,
        view: 'list',
      });
    }, [item, pageNumber, pageSize, position]);
    const itemRef = useVisibleImpression<HTMLTableRowElement>(logImpression);
    const handleSelect = useCallback(() => {
      if (window.getSelection()?.isCollapsed === false) {
        return;
      }
      logDevelopmentItemClick({
        item,
        pageNumber,
        pageSize,
        position,
        view: 'list',
      });
      onSelectItem(item);
    }, [item, onSelectItem, pageNumber, pageSize, position]);
    const handleCopyAssetId = useCallback(
      (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        if (window.getSelection()?.isCollapsed === false) {
          return;
        }
        logDevelopmentItemsMenuAction(item, 'copy_asset_id', 'table_cell');
        void navigator.clipboard.writeText(item.assetId.toString()).then(() => {
          toast({ title: labels.assetIdCopied });
        });
      },
      [item, labels.assetIdCopied],
    );
    const handleContextMenu = useCallback((event: MouseEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setContextMenuPosition({ x: event.clientX, y: event.clientY });
    }, []);
    const handleCloseContextMenu = useCallback(() => {
      setContextMenuPosition(undefined);
    }, []);

    return (
      <TableRow
        className='group'
        isInteractive
        onClick={handleSelect}
        onContextMenu={handleContextMenu}
        ref={itemRef}>
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
              {item.isPackage && <DevelopmentItemPackageBadge label={labels.package} />}
            </div>
            <span className='text-body-medium content-emphasis text-no-wrap text-truncate-split'>
              {item.name}
            </span>
          </div>
        </TableCell>
        <TableCell className={NO_WRAP_CELL_CLASS}>
          <button
            aria-label={labels.assetIdWithValue(item.assetId)}
            className='text-body-medium content-inherit bg-none stroke-none padding-none margin-none cursor-pointer [user-select:text] radius-small focus-visible:outline-focus'
            onClick={handleCopyAssetId}
            type='button'>
            {item.assetId}
          </button>
        </TableCell>
        <TableCell className={NO_WRAP_CELL_CLASS}>{getSourceLabel(item)}</TableCell>
        <TableCell className={NO_WRAP_CELL_CLASS}>
          {item.created == null ? undefined : getInternationalizedFormattedDate(item.created)}
        </TableCell>
        <TableCell className={NO_WRAP_CELL_CLASS}>
          {item.updated == null ? undefined : getInternationalizedFormattedDate(item.updated)}
        </TableCell>
        <TableCell align='end' className={STICKY_ACTIONS_CELL_CLASS}>
          <div className='flex justify-end'>
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
        </TableCell>
      </TableRow>
    );
  },
);

const DevelopmentItemsList: FunctionComponent<DevelopmentItemsListProps> = ({
  archivableAssetIds,
  getSourceLabel,
  items,
  labels,
  onArchiveStateChange,
  onConfigureAsset,
  onSelectItem,
  onViewAssetDetails,
  pagination,
  thumbnailUrls,
  toolboxIdsByAssetId,
}) => (
  <div className='flex flex-col width-full min-width-0'>
    <div className='width-full min-width-0 [&>div]:bg-none [&>div]:max-width-full [&>div]:!scroll-x'>
      <Table
        className='[min-width:1000px] [&_th:first-child]:[min-width:260px] [&_td:first-child]:[min-width:260px]'
        size='Medium'
        variant='Framed'>
        <TableHeader>
          <TableRow>
            <TableHeaderCell className={NO_WRAP_CELL_CLASS}>{labels.name}</TableHeaderCell>
            <TableHeaderCell className={NO_WRAP_CELL_CLASS}>{labels.assetId}</TableHeaderCell>
            <TableHeaderCell className={NO_WRAP_CELL_CLASS}>{labels.source}</TableHeaderCell>
            <TableHeaderCell className={NO_WRAP_CELL_CLASS}>{labels.dateCreated}</TableHeaderCell>
            <TableHeaderCell className={NO_WRAP_CELL_CLASS}>{labels.lastUpdated}</TableHeaderCell>
            <TableHeaderCell className={STICKY_ACTIONS_HEADER_CLASS}>
              <VisuallyHidden>{labels.actions}</VisuallyHidden>
            </TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <DevelopmentItemsListRow
              getSourceLabel={getSourceLabel}
              isArchivable={archivableAssetIds.has(item.assetId)}
              item={item}
              key={item.id}
              labels={labels}
              onArchiveStateChange={onArchiveStateChange}
              onConfigureAsset={onConfigureAsset}
              onSelectItem={onSelectItem}
              onViewAssetDetails={onViewAssetDetails}
              pageNumber={pagination.page + 1}
              pageSize={pagination.pageSize}
              position={pagination.page * pagination.pageSize + index + 1}
              thumbnailUrl={thumbnailUrls.get(item.assetId)}
              toolboxIds={toolboxIdsByAssetId.get(item.assetId)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
    <DevelopmentItemsPagination {...pagination} />
  </div>
);

export default DevelopmentItemsList;
