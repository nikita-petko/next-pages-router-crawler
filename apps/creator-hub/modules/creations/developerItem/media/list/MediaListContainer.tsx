import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo } from 'react';
import type { V1CreationsGetAssetsGetLimitEnum } from '@rbx/client-itemconfiguration/v1';
import type { PagingParameters } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
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
import developClient from '@modules/clients/develop';
import toolboxClient from '@modules/clients/toolboxService';
import { Asset } from '@modules/miscellaneous/common';
import { Pagination } from '@modules/miscellaneous/components';
import CreationsGridEmptyState from '../../../common/components/CreationsGridEmptyState/CreationsGridEmptyState';
import useCreationsFilters from '../../../common/hooks/useCreationsFilters';
import useItemPager from '../../../common/hooks/useItemPager';
import {
  tablePaginationDefaultLoadingSize,
  tablePaginationDefaultPageSize,
} from '../../common/list/constants/tablePagination';
import UploadAssetButton from '../../common/list/uploadAssetButton/UploadAssetButton';
import useTableListStyles from '../../common/list/useTableListStyles';
import utils from '../../common/list/utils/utils';
import type { MediaAssetType, TMediaTableItem } from '../types';
import MediaTableRow from './items/MediaTableRow';
import useMediaTableRowStyles from './items/MediaTableRow.styles';
import useMediaListContainerStyles from './MediaListContainer.styles';

export type TAnimationListContainerProps = {
  mediaAssetType: MediaAssetType;
  groupId?: number;
};

type TMediaPagingParameters = Omit<PagingParameters, 'count'> & {
  count?: V1CreationsGetAssetsGetLimitEnum;
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
        return mediaDetails.items.reduce<TMediaTableItem[]>((acc, item) => {
          const { asset } = item;
          if (
            !asset ||
            typeof asset.createdUtc === 'undefined' ||
            typeof asset.duration === 'undefined' ||
            typeof asset.id === 'undefined' ||
            typeof asset.name === 'undefined' ||
            asset.name === null
          ) {
            return acc;
          }
          const assetDetail = assetDetails.find((detail) => detail.id === asset.id);
          acc.push({
            assetId: asset.id,
            assetType: mediaAssetType,
            created: asset.createdUtc,
            description: asset.description ?? '',
            durationSeconds: asset.duration ?? 0,
            isArchivable: assetDetail?.isArchivable ?? true,
            isArchived: p.isArchived,
            isOnMarketplace: item.fiatProduct?.purchasable ?? false,
            name: asset.name,
          });
          return acc;
        }, []);
      })(
        mediaAssetType, // assetType
        p.isArchived, // isArchived
        p.groupId, // groupId
        p.count, // limit
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
