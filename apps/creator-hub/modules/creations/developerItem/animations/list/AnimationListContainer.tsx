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
import { Asset } from '@modules/miscellaneous/common';
import { Pagination } from '@modules/miscellaneous/components';
import CreationsGridEmptyState from '../../../common/components/CreationsGridEmptyState/CreationsGridEmptyState';
import useCreationsFilters from '../../../common/hooks/useCreationsFilters';
import useItemPager from '../../../common/hooks/useItemPager';
import {
  tablePaginationDefaultLoadingSize,
  tablePaginationDefaultPageSize,
} from '../../common/list/constants/tablePagination';
import OpenStudioButton from '../../common/list/openStudioButton/OpenStudioButton';
import useTableListStyles from '../../common/list/useTableListStyles';
import utils from '../../common/list/utils/utils';
import type { TAnimationTableItem } from '../types';
import AnimationTableRow from './items/AnimationTableRow';
import useAnimationTableRowStyles from './items/AnimationTableRow.styles';

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
