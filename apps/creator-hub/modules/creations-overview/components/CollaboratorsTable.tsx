import type { FC } from 'react';
import React, { useMemo, useCallback, useState } from 'react';
import { Chip, Icon } from '@rbx/foundation-ui';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Avatar, makeStyles } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { GenericTablePaginationSpec } from '@modules/charts-generic/tables/GenericTablePagination';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import type { TableColumnConfig } from '@modules/charts-generic/tables/types/GenericColumnType';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { CellDataType } from '@modules/charts-generic/tables/types/GenericTableType';
import { TableSortOrder } from '@modules/charts-generic/tables/types/TableSort';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getUserUrl } from '@modules/miscellaneous/urls/www';
import type { OwnerCollaborator, TrustRelationship } from '../types/ownerCollaborators';
import { CollaboratorsColumnKey } from '../types/ownerCollaborators';

const useStyles = makeStyles()({
  tableContainer: {
    '& table': {
      tableLayout: 'auto',
    },
    '& th': {
      whiteSpace: 'nowrap',
    },
  },
});

const PAGE_SIZE_OPTIONS = [5, 10, 25];
const DEFAULT_PAGE_SIZE = 10;

interface CollaboratorsTableProps {
  data: OwnerCollaborator[];
  isLoading: boolean;
  isError: boolean;
  userOnly?: boolean;
  universeId?: number;
  tab?: 'needsAction' | 'notImpacting';
}

export const UserCell: FC<{
  collaborator: OwnerCollaborator;
  onProfileClick?: (userId: number) => void;
}> = ({ collaborator, onProfileClick }) => (
  <a
    href={getUserUrl(collaborator.userId)}
    target='_blank'
    rel='noopener noreferrer'
    onClick={() => onProfileClick?.(collaborator.userId)}
    className='radius-circle bg-shift-300'
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--size-150)',
      padding: 'var(--size-100) var(--size-200) var(--size-100) var(--size-100)',
      textDecoration: 'none',
      color: 'inherit',
    }}>
    <Avatar alt={collaborator.displayName} sx={{ width: 24, height: 24, flexShrink: 0 }}>
      <Thumbnail2d
        targetId={collaborator.userId}
        type={ThumbnailTypes.avatarHeadshot}
        alt={collaborator.displayName}
        returnPolicy={ReturnPolicy.PlaceHolder}
        includeBackground
      />
    </Avatar>
    <span className='text-label-small' style={{ whiteSpace: 'nowrap' }}>
      {collaborator.username}
    </span>
  </a>
);

const BlockingCell: FC<{ count: number }> = ({ count }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--size-150)',
      padding: 'var(--size-200) 0',
    }}>
    <Icon name='icon-regular-circle-slash' size='Small' />
    <span>{count}</span>
  </div>
);

const TrustUserPill: FC<{
  rel: TrustRelationship;
  onProfileClick?: (userId: number) => void;
}> = ({ rel, onProfileClick }) => (
  <a
    href={getUserUrl(rel.userId)}
    target='_blank'
    rel='noopener noreferrer'
    onClick={() => onProfileClick?.(rel.userId)}
    className='radius-circle bg-shift-300'
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--size-150)',
      padding: 'var(--size-100) var(--size-200) var(--size-100) var(--size-100)',
      textDecoration: 'none',
      color: 'inherit',
      flexShrink: 0,
    }}>
    <Avatar alt={rel.displayName} sx={{ width: 24, height: 24, flexShrink: 0 }}>
      <Thumbnail2d
        targetId={rel.userId}
        type={ThumbnailTypes.avatarHeadshot}
        alt={rel.displayName}
        returnPolicy={ReturnPolicy.PlaceHolder}
        includeBackground
      />
    </Avatar>
    <span className='text-label-small' style={{ whiteSpace: 'nowrap' }}>
      {rel.username}
    </span>
  </a>
);

const DEFAULT_VISIBLE_PILLS = 3;

const TrustChipsCell: FC<{
  relationships: TrustRelationship[];
  onProfileClick?: (userId: number) => void;
  onExpandTrustPills?: () => void;
}> = ({ relationships, onProfileClick, onExpandTrustPills }) => {
  const [expanded, setExpanded] = useState(false);

  if (relationships.length === 0) {
    return null;
  }

  const chipsToShow = expanded ? relationships : relationships.slice(0, DEFAULT_VISIBLE_PILLS);
  const remaining = relationships.length - chipsToShow.length;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--size-150)',
        flexWrap: expanded ? 'wrap' : 'nowrap',
      }}>
      {chipsToShow.map((rel) => (
        <TrustUserPill key={rel.username} rel={rel} onProfileClick={onProfileClick} />
      ))}
      {!expanded && remaining > 0 && (
        <Chip
          as='button'
          isChecked={false}
          onCheckedChange={() => {
            onExpandTrustPills?.();
            setExpanded(true);
          }}
          size='Medium'
          variant='Utility'
          className='bg-shift-100'
          style={{ flexShrink: 0 }}
          text={`+${remaining}`}
        />
      )}
    </div>
  );
};

const sortCollaborators = (
  items: OwnerCollaborator[],
  column: CollaboratorsColumnKey,
  direction: TableSortOrder,
): OwnerCollaborator[] => {
  const sorted = [...items].sort((a, b) => {
    switch (column) {
      case CollaboratorsColumnKey.User:
        return a.username.localeCompare(b.username, undefined, { sensitivity: 'base' });
      case CollaboratorsColumnKey.Blocking:
        return a.blockingCount - b.blockingCount;
      case CollaboratorsColumnKey.RemainingTrust:
      default:
        return 0;
    }
  });
  return direction === TableSortOrder.desc ? sorted.toReversed() : sorted;
};

const CollaboratorsTable: FC<CollaboratorsTableProps> = ({
  data,
  isLoading,
  isError,
  userOnly = false,
  universeId,
  tab,
}) => {
  const { classes } = useStyles();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortColumn, setSortColumn] = useState<CollaboratorsColumnKey>(
    CollaboratorsColumnKey.Blocking,
  );
  const [sortDirection, setSortDirection] = useState<TableSortOrder>(TableSortOrder.desc);

  const handleProfileClick = useCallback(
    (userId: number) => {
      unifiedLogger.logClickEvent({
        eventName: CreatorDashboardEventType.SafetyCollaboratorsClick,
        parameters: {
          view: 'owner',
          action: 'viewCollaboratorProfile',
          collaboratorUserId: userId.toString(),
          ...(universeId !== undefined && { universeId: universeId.toString() }),
          ...(tab !== undefined && { tab }),
        },
      });
    },
    [unifiedLogger, universeId, tab],
  );

  const handleExpandTrustPills = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: CreatorDashboardEventType.SafetyCollaboratorsClick,
      parameters: {
        view: 'owner',
        action: 'expandTrustPills',
        ...(universeId !== undefined && { universeId: universeId.toString() }),
        ...(tab !== undefined && { tab }),
      },
    });
  }, [unifiedLogger, universeId, tab]);

  const handleSort = useCallback(
    (key: CollaboratorsColumnKey, direction?: TableSortOrder) => {
      const resolvedDirection = direction ?? TableSortOrder.desc;
      setSortColumn(key);
      setSortDirection(resolvedDirection);
      setPage(0);
      unifiedLogger.logClickEvent({
        eventName: CreatorDashboardEventType.SafetyCollaboratorsClick,
        parameters: {
          view: 'owner',
          action: 'sort',
          column: key,
          direction: resolvedDirection,
          ...(universeId !== undefined && { universeId: universeId.toString() }),
          ...(tab !== undefined && { tab }),
        },
      });
    },
    [unifiedLogger, universeId, tab],
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      unifiedLogger.logClickEvent({
        eventName: CreatorDashboardEventType.SafetyCollaboratorsClick,
        parameters: {
          view: 'owner',
          action: 'paginate',
          direction: 'pageSize',
          pageSize: newSize.toString(),
          ...(universeId !== undefined && { universeId: universeId.toString() }),
          ...(tab !== undefined && { tab }),
        },
      });
      setPageSize(newSize);
      setPage(0);
    },
    [unifiedLogger, universeId, tab],
  );

  const handleNextPage = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: CreatorDashboardEventType.SafetyCollaboratorsClick,
      parameters: {
        view: 'owner',
        action: 'paginate',
        direction: 'next',
        pageSize: pageSize.toString(),
        ...(universeId !== undefined && { universeId: universeId.toString() }),
        ...(tab !== undefined && { tab }),
      },
    });
    setPage((p) => p + 1);
  }, [unifiedLogger, pageSize, universeId, tab]);

  const handlePreviousPage = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: CreatorDashboardEventType.SafetyCollaboratorsClick,
      parameters: {
        view: 'owner',
        action: 'paginate',
        direction: 'previous',
        pageSize: pageSize.toString(),
        ...(universeId !== undefined && { universeId: universeId.toString() }),
        ...(tab !== undefined && { tab }),
      },
    });
    setPage((p) => Math.max(0, p - 1));
  }, [unifiedLogger, pageSize, universeId, tab]);

  const columnConfigs: TableColumnConfig<CollaboratorsColumnKey>[] = useMemo(() => {
    const configs: TableColumnConfig<CollaboratorsColumnKey>[] = [
      {
        columnKey: CollaboratorsColumnKey.User,
        columnType: ColumnType.Other,
        titleKey: translationKey('TableHeader.User', TranslationNamespace.Creations),
        widthWeight: 1,
        sort: {
          direction: TableSortOrder.asc,
          onClick: handleSort,
        },
      },
    ];

    if (!userOnly) {
      configs.push(
        {
          columnKey: CollaboratorsColumnKey.Blocking,
          columnType: ColumnType.Other,
          titleKey: translationKey('TableHeader.Blocking', TranslationNamespace.Creations),
          widthWeight: 0.5,
          sort: {
            direction: TableSortOrder.desc,
            onClick: handleSort,
          },
        },
        {
          columnKey: CollaboratorsColumnKey.RemainingTrust,
          columnType: ColumnType.Other,
          titleKey: translationKey('TableHeader.NeedsTrust', TranslationNamespace.Creations),
          widthWeight: 3,
        },
      );
    }

    return configs;
  }, [userOnly, handleSort]);

  const sortedData = useMemo(
    () => sortCollaborators(data, sortColumn, sortDirection),
    [data, sortColumn, sortDirection],
  );

  const paginatedData = useMemo(() => {
    const start = page * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  const rowData = useMemo(() => {
    return paginatedData.map((collaborator) => {
      const cells: [CollaboratorsColumnKey, CellDataType][] = [
        [
          CollaboratorsColumnKey.User,
          {
            type: ColumnType.Other,
            value: <UserCell collaborator={collaborator} onProfileClick={handleProfileClick} />,
          },
        ],
      ];

      if (!userOnly) {
        cells.push(
          [
            CollaboratorsColumnKey.Blocking,
            {
              type: ColumnType.Other,
              value: <BlockingCell count={collaborator.blockingCount} />,
            },
          ],
          [
            CollaboratorsColumnKey.RemainingTrust,
            {
              type: ColumnType.Other,
              value: (
                <TrustChipsCell
                  relationships={collaborator.trustRelationships}
                  onProfileClick={handleProfileClick}
                  onExpandTrustPills={handleExpandTrustPills}
                />
              ),
            },
          ],
        );
      }

      return new Map<CollaboratorsColumnKey, CellDataType>(cells);
    });
  }, [paginatedData, userOnly, handleProfileClick, handleExpandTrustPills]);

  const pagination: GenericTablePaginationSpec = useMemo(
    () => ({
      page,
      total: data.length,
      pageSize,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
      setPageSize: handlePageSizeChange,
      onNextPage: handleNextPage,
      onPreviousPage: handlePreviousPage,
      hasNext: (page + 1) * pageSize < data.length,
      hasPrevious: page > 0,
    }),
    [page, pageSize, data.length, handlePageSizeChange, handleNextPage, handlePreviousPage],
  );

  const getRowKey = useCallback(
    (_: Map<CollaboratorsColumnKey, CellDataType>, index: number) =>
      `collaborator-${paginatedData[index]?.userId ?? String(index)}`,
    [paginatedData],
  );

  const tableConfig = useMemo(
    () => ({
      hover: true,
      tableBorder: false,
      defaultActiveSort: userOnly ? undefined : CollaboratorsColumnKey.Blocking,
    }),
    [userOnly],
  );

  return (
    <GenericTableV2
      columnConfigs={columnConfigs}
      rowData={rowData}
      isDataLoading={isLoading}
      isResponseFailed={isError}
      isUserForbidden={false}
      showNoDataMessage={data.length === 0}
      pagination={data.length > DEFAULT_PAGE_SIZE ? pagination : null}
      tableConfig={tableConfig}
      getRowKey={getRowKey}
      classes={{ tableContainer: classes.tableContainer }}
    />
  );
};

export default React.memo(CollaboratorsTable);
