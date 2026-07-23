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
import useTableListStyles from '../../common/list/useTableListStyles';
import { TAnimationTableItem } from '../types';
import useAnimationTableRowStyles from './items/AnimationTableRow.styles';
import AnimationTableRow from './items/AnimationTableRow';
import OpenStudioButton from '../../common/list/openStudioButton/OpenStudioButton';

export type TAnimationListContainerProps = {
  groupId?: number;
};

type TAnimationPagingParameters = PagingParameters & {
  isArchived: boolean;
  groupId?: number;
};

const AnimationListContainer: FunctionComponent<
  React.PropsWithChildren<TAnimationListContainerProps>
> = (props) => {
  const { groupId } = props;
  const { translate } = useTranslation();
  const {
    classes: { iconColumn, container, tableHeader, smInvisibleColumn, xsInvisibleColumn },

    cx,
  } = useTableListStyles();
  const {
    classes: { dateColumn },
  } = useAnimationTableRowStyles();
  const { isArchived } = useCreationsFilters();
  const loadItems = useCallback(async (p: TAnimationPagingParameters) => {
    return utils.loadDevItemFunctionDefaultFactory<TAnimationTableItem>((previousValue, item) => {
      if (typeof item.id === 'undefined' || typeof item.name === 'undefined') {
        return previousValue;
      }
      return [
        ...previousValue,
        {
          assetType: Asset.Animation,
          assetId: item.id,
          name: item.name,
          created: item.created || null,
          updated: item.updated || null,
        },
      ];
    })(
      Asset.Animation, // assetType
      p.isArchived, // isArchived
      p.groupId, // groupId
      p.count as V1CreationsGetAssetsGetLimitEnum, // limit
      p.cursor, // cursor
    );
  }, []);

  const pagingParameters: TAnimationPagingParameters = useMemo(
    () => ({
      isArchived,
      groupId,
      cursor: '',
    }),
    [groupId, isArchived],
  );

  const { isLoading, isEmpty, currentPageItems, error, paginationProps } = useItemPager<
    TAnimationTableItem,
    TAnimationPagingParameters
  >(
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
  return (
    <div className={container}>
      {isEmpty ? (
        <CreationsGridEmptyState assetType={Asset.Animation}>
          <OpenStudioButton />
        </CreationsGridEmptyState>
      ) : (
        <Table data-testid='animation-list-table'>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography className={tableHeader} variant='overline'>
                  {translate('Heading.Name')}
                </Typography>
              </TableCell>
              <TableCell className={cx(dateColumn, xsInvisibleColumn)}>
                <Typography className={tableHeader} variant='overline'>
                  {translate('Label.Created')}
                </Typography>
              </TableCell>
              <TableCell className={cx(dateColumn, smInvisibleColumn)}>
                <Typography className={tableHeader} variant='overline'>
                  {translate('Label.Updated')}
                </Typography>
              </TableCell>
              <TableCell className={iconColumn} />
            </TableRow>
          </TableHead>
          <TableBody>
            {currentPageItems &&
              currentPageItems.map((item) => <AnimationTableRow key={item.assetId} item={item} />)}
          </TableBody>
        </Table>
      )}
      {!error && !isEmpty && (
        <Pagination data-testid='animation-list-pagination' {...paginationProps} />
      )}
    </div>
  );
};

export default AnimationListContainer;
