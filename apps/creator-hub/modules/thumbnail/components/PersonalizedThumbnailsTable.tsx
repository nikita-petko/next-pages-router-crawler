import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import {
  GenericTableV2,
  logAnalyticsError,
  CellDataType,
  TableSortOrder,
  ColumnType,
  getComparator,
} from '@modules/charts-generic';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Button, makeStyles, Tooltip, useMediaQuery } from '@rbx/ui';
import { useGetHomepageThumbnailsQuery } from '@modules/react-query/thumbnailPersonalization';
import {
  PersonalizedThumbnailsTableColumnConfigs,
  PersonalizedThumbnailsTableConfig,
  usePersonalizedThumbnailsRAQIV2RowData,
  TPersonalizedThumbnailsTableColumnKey,
  PersonalizedThumbnailsNonRAQITableColumnKey,
  getOrderedThumbnailTableColumnKeys,
} from '@modules/experience-analytics-shared';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { Flex } from '@modules/miscellaneous/common/components';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import usePersonalizedThumbnailsSelectionStatus from '../hooks/usePersonalizedThumbnailsSelectionStatus';
import PersonalizedThumbnailsTableHeader from './PersonalizedThumbnailsTableHeader';
import useCreateOptionMenuCellData from '../hooks/useCreateOptionMenuCellData';
import useCreateThumbnailImageCellData from '../hooks/useCreateThumbnailImageCellData';
import useCreateThumbnailSelectionCellData from '../hooks/useCreateThumbnailSelectionCellData';
import SaveChangeButton from './SaveChangeButton';
import ThumbnailPersonalizationInfoBanner from './ThumbnailPersonalizationInfoBanner';
import PersonalizedThumbnailExportButton, {
  PersonalizedThumbnailExportButtonType,
} from './PersonalizedThumbnailExportButton';
import HomepageThumbnailUploadButton from './HomepageThumbnailUploadButton';
import useCreateThumbnailStatusCellData from '../hooks/useCreateThumbnailStatusCellData';
import SpammyThumbnailAlert from './SpammyThumbnailAlert';
import { useNewlyUploadedThumbnailIdsContext } from '../context/NewlyUploadedThumbnailIdsProvider';
import useThumbnailTableMode from '../hooks/useThumbnailTableMode';

const useStyles = makeStyles()(() => {
  return {
    buttonsContainer: {
      marginBottom: '24px',
    },
  };
});

type PersonalizedThumbnailsTableProps = {
  universeId: number;
  isUserViewAnalyticsOnly?: boolean;
};

const PersonalizedThumbnailsTable: FC<PersonalizedThumbnailsTableProps> = ({
  universeId,
  isUserViewAnalyticsOnly,
}) => {
  // Display a simplified table showing only asset IDs when user has access to personalization data
  // i.e. they are under visibleAssetIdInPersonalizationEnabled
  // Purpose: Enables moderators to identify and collect asset IDs of thumbnails targeted for removal
  // Context: Implementation related to content moderation incident - see detailed documentation:
  // https://docs.google.com/document/d/1ZoBRM2ivcPZBnkzbVYKEEiDb0XcoPKuG5lrDM6N5Gcg/edit?tab=t.0
  const { visibleAssetIdInPersonalizationEnabled } = useFeatureFlagsForNamespace(
    'visibleAssetIdInPersonalizationEnabled',
    FeatureFlagNamespace.Analytics,
  );

  const {
    classes: { buttonsContainer },
  } = useStyles();
  const { translate } = useTranslationWrapper(useTranslation());
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const { isEditing, turnOffEditingMode, turnOnEditingMode } = useThumbnailTableMode({
    universeId,
  });

  const orderedColumnKeys = useMemo(
    () =>
      getOrderedThumbnailTableColumnKeys({
        inCompactView: isCompactView,
        inEditingMode: isEditing,
        allowAssetIdColumn: visibleAssetIdInPersonalizationEnabled,
      }),
    [isCompactView, isEditing, visibleAssetIdInPersonalizationEnabled],
  );

  const { data: thumbnailsData, isPending } = useGetHomepageThumbnailsQuery(universeId);

  const {
    rowData: rowsWithRAQIOnlyData,
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
    startTimeUTC,
    endTimeUTC,
    createdTimeUTC,
  } = usePersonalizedThumbnailsRAQIV2RowData(universeId, orderedColumnKeys);

  const [sortColumn, setSortColumn] = useState<TPersonalizedThumbnailsTableColumnKey | null>(null);
  const [order, setOrder] = React.useState<TableSortOrder>(TableSortOrder.desc);

  const thumbnailByAssetId = useMemo(
    () =>
      new Map(
        thumbnailsData?.thumbnails.map((thumbnail) => [thumbnail.assetId.toString(), thumbnail]),
      ),
    [thumbnailsData?.thumbnails],
  );

  const { initialActiveThumbnailIds, selectedThumbnailIds, updateSelectedThumbnailIds } =
    usePersonalizedThumbnailsSelectionStatus(universeId);
  const { setNewlyUploadedThumbnailIds } = useNewlyUploadedThumbnailIdsContext();

  const onThumbnailRemove = useCallback(
    (thumbnailIds: string[]) => {
      updateSelectedThumbnailIds((selectedIds) =>
        selectedIds.filter((selectedId) => !thumbnailIds.includes(selectedId)),
      );
      setNewlyUploadedThumbnailIds((prev) => prev.filter((id) => !thumbnailIds.includes(id)));
    },
    [setNewlyUploadedThumbnailIds, updateSelectedThumbnailIds],
  );
  const createOptionMenuCellData = useCreateOptionMenuCellData(
    universeId,
    onThumbnailRemove,
    initialActiveThumbnailIds,
  );
  const createThumbnailImageCellData = useCreateThumbnailImageCellData();
  const createThumbnailSelectionCellData = useCreateThumbnailSelectionCellData(
    selectedThumbnailIds,
    updateSelectedThumbnailIds,
    isUserViewAnalyticsOnly,
  );
  const createThumbnailStatusCellData = useCreateThumbnailStatusCellData();

  const tableRowData = useMemo(() => {
    let totalRow: Map<TPersonalizedThumbnailsTableColumnKey, CellDataType> | null = new Map();
    const activeRows: Map<TPersonalizedThumbnailsTableColumnKey, CellDataType>[] = [];
    const nonActiveRows: Map<TPersonalizedThumbnailsTableColumnKey, CellDataType>[] = [];

    rowsWithRAQIOnlyData.forEach(({ isTotalRow, cellData }) => {
      const thumbnailAssetCell = cellData.get(RAQIV2Dimension.ThumbnailAsset);
      if (thumbnailAssetCell?.type !== ColumnType.Text) {
        logAnalyticsError(`thumbnailAssetCell ${thumbnailAssetCell} is not text type`);
        return;
      }

      const rowData = new Map<TPersonalizedThumbnailsTableColumnKey, CellDataType>(
        Array.from(cellData).filter(([key]) => key in PersonalizedThumbnailsTableColumnConfigs) as [
          TPersonalizedThumbnailsTableColumnKey,
          CellDataType,
        ][],
      );

      const thumbnail = thumbnailByAssetId.get(thumbnailAssetCell.value);
      if (isTotalRow) {
        rowData.set(
          PersonalizedThumbnailsNonRAQITableColumnKey.Thumbnail,
          createThumbnailImageCellData({
            thumbnail,
            displayTextForSummaryRow: translate(
              translationKey('Label.Total', TranslationNamespace.Analytics),
            ),
          }),
        );
        totalRow = rowData;
        return;
      }

      if (!thumbnail) {
        // thumbnail is likely deleted don't show it in table
        return;
      }

      const { active } = thumbnail;
      rowData.set(
        PersonalizedThumbnailsNonRAQITableColumnKey.ActiveCheckBox,
        createThumbnailSelectionCellData(thumbnail),
      );
      rowData.set(
        PersonalizedThumbnailsNonRAQITableColumnKey.Status,
        createThumbnailStatusCellData(thumbnail),
      );
      rowData.set(
        PersonalizedThumbnailsNonRAQITableColumnKey.Thumbnail,
        createThumbnailImageCellData({
          thumbnail,
        }),
      );

      if (visibleAssetIdInPersonalizationEnabled) {
        rowData.set(PersonalizedThumbnailsNonRAQITableColumnKey.ThumbnailAssetId, {
          type: ColumnType.Number,
          value: thumbnail.assetId,
        });
      }

      if (!isUserViewAnalyticsOnly) {
        // hide the option menu column if user has view analytics only permission
        rowData.set(
          PersonalizedThumbnailsNonRAQITableColumnKey.OptionMenu,
          createOptionMenuCellData(thumbnail, false),
        );
      }

      if (active) {
        activeRows.push(rowData);
      } else if (isEditing) {
        // only show non-active rows in editing mode
        nonActiveRows.push(rowData);
      }
    });

    if (sortColumn) {
      // only sort active rows (rows with stats)
      activeRows.sort(getComparator(order, sortColumn));
    }

    // active rows should be on top
    return [totalRow, ...activeRows, ...nonActiveRows];
  }, [
    rowsWithRAQIOnlyData,
    sortColumn,
    thumbnailByAssetId,
    createThumbnailSelectionCellData,
    createThumbnailStatusCellData,
    createThumbnailImageCellData,
    visibleAssetIdInPersonalizationEnabled,
    isUserViewAnalyticsOnly,
    isEditing,
    translate,
    createOptionMenuCellData,
    order,
  ]);

  const columnConfigs = useMemo(() => {
    return orderedColumnKeys.map((columnKey) => {
      const config = PersonalizedThumbnailsTableColumnConfigs[columnKey];
      // hide the option menu column if
      // 1. the user has view analytics only permission
      // 2. or the user is not in editing mode
      if (
        config.columnKey === PersonalizedThumbnailsNonRAQITableColumnKey.OptionMenu &&
        (isUserViewAnalyticsOnly || !isEditing)
      ) {
        return {
          ...config,
          hidden: true,
        };
      }

      if (config.sort) {
        return {
          ...config,
          sort: {
            direction: config.sort.direction,
            onClick: () => {
              setSortColumn(columnKey);
              setOrder((oldOrder) =>
                oldOrder === TableSortOrder.asc ? TableSortOrder.desc : TableSortOrder.asc,
              );
            },
          },
        };
      }
      return config;
    });
  }, [isEditing, isUserViewAnalyticsOnly, orderedColumnKeys]);

  const onSaveConfirmed = useCallback(() => {
    turnOffEditingMode();
    setNewlyUploadedThumbnailIds([]);
  }, [setNewlyUploadedThumbnailIds, turnOffEditingMode]);

  const editThumbnailsButton = useMemo(() => {
    return isEditing ? (
      <SaveChangeButton
        universeId={universeId}
        initialActiveThumbnailIds={initialActiveThumbnailIds}
        selectedThumbnailIds={selectedThumbnailIds}
        updateSelectedThumbnailIds={updateSelectedThumbnailIds}
        onSaveConfirmed={onSaveConfirmed}
        loading={isPending}
        exportButton={
          <PersonalizedThumbnailExportButton
            tableRowData={tableRowData}
            startTimeUTC={startTimeUTC}
            endTimeUTC={endTimeUTC}
            displayType={PersonalizedThumbnailExportButtonType.ExportButton}
          />
        }
      />
    ) : (
      <Tooltip
        title={
          isUserViewAnalyticsOnly
            ? translate(
                translationKey('Label.NoPermissionToEdit', TranslationNamespace.PlaceThumbnails),
              )
            : undefined
        }
        placement='right'
        arrow>
        {/** Need to wrap Button with a <span> element because
         * Tooltip component does not work on a disabled button with pointer-event: none
         */}
        <span>
          <Button
            color='primaryBrand'
            variant='contained'
            disableRipple
            disabled={isUserViewAnalyticsOnly}
            onClick={turnOnEditingMode}>
            {translate(
              translationKey('Label.EditActiveThumbnails', TranslationNamespace.PlaceThumbnails),
            )}
          </Button>
        </span>
      </Tooltip>
    );
  }, [
    endTimeUTC,
    initialActiveThumbnailIds,
    isEditing,
    isPending,
    isUserViewAnalyticsOnly,
    onSaveConfirmed,
    selectedThumbnailIds,
    startTimeUTC,
    tableRowData,
    translate,
    turnOnEditingMode,
    universeId,
    updateSelectedThumbnailIds,
  ]);

  const tableHeader = useMemo(() => {
    return (
      <PersonalizedThumbnailsTableHeader
        isDataLoading={isDataLoading}
        startTimeUTC={startTimeUTC}
        endTimeUTC={endTimeUTC}
        exportButton={
          <PersonalizedThumbnailExportButton
            tableRowData={tableRowData}
            startTimeUTC={startTimeUTC}
            endTimeUTC={endTimeUTC}
          />
        }
      />
    );
  }, [endTimeUTC, isDataLoading, startTimeUTC, tableRowData]);

  const hasSpammyThumbnail =
    thumbnailsData?.thumbnails.some((thumbnail) => thumbnail.isThumbnailSpammy) || false;

  const onUploadSuccess = useCallback(
    (thumbnailIds: string[]) => {
      setNewlyUploadedThumbnailIds((prev) => [...prev, ...thumbnailIds]);
    },
    [setNewlyUploadedThumbnailIds],
  );

  return (
    <React.Fragment>
      <Flex classes={{ root: buttonsContainer }} gap={8}>
        {editThumbnailsButton}
        {isEditing && (
          <HomepageThumbnailUploadButton
            universeId={universeId}
            variant='contained'
            size='medium'
            color='secondary'
            onUploadSuccess={onUploadSuccess}
          />
        )}
      </Flex>
      <ThumbnailPersonalizationInfoBanner universeId={universeId} createdTimeUtc={createdTimeUTC} />
      <SpammyThumbnailAlert hasSpammyThumbnail={hasSpammyThumbnail} />
      <GenericTableV2
        isDataLoading={isDataLoading}
        isResponseFailed={isResponseFailed}
        isUserForbidden={isUserForbidden}
        isNoDataAvailable={rowsWithRAQIOnlyData.length === 0}
        columnConfigs={columnConfigs}
        tableConfig={PersonalizedThumbnailsTableConfig}
        rowData={tableRowData}
        tableHeader={tableHeader}
      />
    </React.Fragment>
  );
};

export default memo(PersonalizedThumbnailsTable);
