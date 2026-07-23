import React, { FunctionComponent, useCallback, useMemo } from 'react';
import {
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@rbx/ui';
import { Asset, Pagination } from '@modules/miscellaneous/common';
import { PagingParameters } from '@rbx/core';
import { developClient, toolboxClient } from '@modules/clients';
import {
  useCreationsFilters,
  useItemPager,
  CreationsGridEmptyState,
} from '@modules/creations/common';
import { useTranslation } from '@rbx/intl';
import { V1CreationsGetAssetsGetLimitEnum } from '@rbx/client-itemconfiguration/v1';
import {
  tablePaginationDefaultLoadingSize,
  tablePaginationDefaultPageSize,
} from '../../common/list/constants/tablePagination';
import utils from '../../common/list/utils/utils';
import UploadAssetButton from '../../common/list/uploadAssetButton/UploadAssetButton';
import { MediaAssetType, TMediaTableItem } from '../types';
import useMediaListContainerStyles from './MediaListContainer.styles';
import useMediaTableRowStyles from './items/MediaTableRow.styles';
import MediaTableRow from './items/MediaTableRow';
import useTableListStyles from '../../common/list/useTableListStyles';

export type TAnimationListContainerProps = {
  mediaAssetType: MediaAssetType;
  groupId?: number;
};

type TMediaPagingParameters = PagingParameters & {
  groupId?: number;
  isArchived: boolean;
};

const MediaListContainer: FunctionComponent<
  React.PropsWithChildren<TAnimationListContainerProps>
> = (props) => {
  const { mediaAssetType, groupId } = props;
  const { translate } = useTranslation();
  const {
    classes: { operationSection },

    cx,
  } = useMediaListContainerStyles();
  const {
    classes: {
      container,
      iconColumn,
      mdInvisibleColumn,
      smInvisibleColumn,
      tableHeader,
      xsInvisibleColumn,
    },
  } = useTableListStyles();
  const {
    classes: { fixWidthColumn },
  } = useMediaTableRowStyles();
  const { isArchived } = useCreationsFilters();
  const loadItems = useCallback(
    async (p: TMediaPagingParameters) => {
      return utils.loadAssetFactory<TMediaTableItem>(async (assetIds) => {
        const [detailResponse, mediaDetails] = await Promise.all([
          developClient.getAssetDetails(assetIds),
          toolboxClient.getItemDetails(assetIds),
        ]);
        if (!detailResponse.data) {
          throw new Error('Asset detail endpoint returns no data');
        }
        const assetDetails = detailResponse.data;
        return mediaDetails.items.reduce<TMediaTableItem[]>((previousValue, item) => {
          const { asset } = item;
          if (
            !asset ||
            typeof asset.createdUtc === 'undefined' ||
            typeof asset.duration === 'undefined' ||
            typeof asset.id === 'undefined' ||
            typeof asset.name === 'undefined' ||
            asset.name === null
          ) {
            return previousValue;
          }
          const assetDetail = assetDetails.find((detail) => detail.id === asset.id);
          return [
            ...previousValue,
            {
              assetId: asset.id,
              assetType: mediaAssetType,
              created: asset.createdUtc,
              description: asset.description || '',
              durationSeconds: asset.duration || 0,
              isArchivable: assetDetail?.isArchivable || true,
              isArchived: p.isArchived,
              isOnMarketplace: assetDetail?.isCopyingAllowed || false,
              name: asset.name,
            },
          ];
        }, []);
      })(
        mediaAssetType, // assetType
        p.isArchived, // isArchived
        p.groupId, // groupId
        p.count as V1CreationsGetAssetsGetLimitEnum, // limit
        p.cursor, // cursor
      );
    },
    [mediaAssetType],
  );
  const pagingParameters: TMediaPagingParameters = useMemo(
    () => ({
      cursor: '',
      groupId,
      isArchived,
    }),
    [groupId, isArchived],
  );

  const { currentPageItems, error, isEmpty, isLoading, paginationProps, removeItemAtIndex } =
    useItemPager<TMediaTableItem, TMediaPagingParameters>(
      loadItems,
      pagingParameters,
      undefined,
      tablePaginationDefaultPageSize,
      tablePaginationDefaultLoadingSize,
    );
  if (isLoading) {
    return (
      <Grid item container justifyContent='center' alignItems='center' className={container}>
        <CircularProgress />
      </Grid>
    );
  }

  // NOTE(nkachkovsky 08/22/2023): Remove conditional rendering for the duration field on video once video length is supported
  return (
    <div className={container}>
      {!isEmpty && (
        <div className={operationSection} data-testid='media-upload-button'>
          <UploadAssetButton assetType={mediaAssetType} />
        </div>
      )}
      {isEmpty ? (
        <CreationsGridEmptyState assetType={mediaAssetType} />
      ) : (
        <Table data-testid='media-list-table'>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography className={tableHeader} variant='overline'>
                  {translate('Heading.Name')}
                </Typography>
              </TableCell>
              <TableCell className={mdInvisibleColumn}>
                <Typography className={tableHeader} variant='overline'>
                  {translate('Heading.Description')}
                </Typography>
              </TableCell>
              {mediaAssetType !== Asset.Video && (
                <TableCell className={cx(fixWidthColumn, mdInvisibleColumn)}>
                  <Typography className={tableHeader} variant='overline'>
                    {translate('Label.AudioLength')}
                  </Typography>
                </TableCell>
              )}
              <TableCell className={cx(fixWidthColumn, xsInvisibleColumn)}>
                <Typography className={tableHeader} variant='overline'>
                  {translate('Label.Created')}
                </Typography>
              </TableCell>
              <TableCell className={cx(fixWidthColumn, smInvisibleColumn)}>
                <Typography className={tableHeader} variant='overline'>
                  {translate('Label.OnCreatorStore')}
                </Typography>
              </TableCell>
              <TableCell className={iconColumn} />
            </TableRow>
          </TableHead>
          <TableBody>
            {currentPageItems &&
              currentPageItems.map((item, index) => (
                <MediaTableRow
                  item={item}
                  key={item.assetId}
                  onRemove={() => removeItemAtIndex(index)}
                />
              ))}
          </TableBody>
        </Table>
      )}
      {!error && !isEmpty && <Pagination {...paginationProps} />}
    </div>
  );
};

export default MediaListContainer;
