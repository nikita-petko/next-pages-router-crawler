import type { FC } from 'react';
import React, { Children } from 'react';
import { Table, TableCell, TableContainer, TableHead, TableRow } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import GenericTableBodyWrapper from '@modules/charts-generic/tables/GenericTableBodyWrapper';
import GenericTablePagination, {
  type GenericTablePaginationSpec,
} from '@modules/charts-generic/tables/GenericTablePagination';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  ExperiencesTableMetricColumnsOrder,
  ExperiencesTableMetricsTranslationKeys,
} from './ExperiencesTableMetrics';

type ExperiencesTableSpec = GenericChartState & GenericTablePaginationSpec;

const ExperiencesTable: FC<React.PropsWithChildren<ExperiencesTableSpec>> = ({
  isDataLoading,
  isResponseFailed,
  isUserForbidden,
  total,
  page,
  pageSize,
  pageSizeOptions,
  setPageSize,
  onNextPage,
  onPreviousPage,
  hasNext,
  hasPrevious,
  children,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();

  const metricColumnsCombinedWidth = 70;
  const metricColumns = ExperiencesTableMetricColumnsOrder.map((metric) => (
    <TableCell
      align='right'
      key={metric}
      width={`${metricColumnsCombinedWidth / ExperiencesTableMetricColumnsOrder.length}%`}>
      {translate(ExperiencesTableMetricsTranslationKeys[metric])}
    </TableCell>
  ));

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell width='25%'>
              {translate(translationKey('Label.Experience', TranslationNamespace.Analytics))}
            </TableCell>
            <TableCell width='5%' />
            {metricColumns}
          </TableRow>
        </TableHead>
        <GenericTableBodyWrapper
          isDataLoading={isDataLoading}
          isUserForbidden={isUserForbidden}
          isResponseFailed={isResponseFailed}
          showNoDataMessage={Children.count(children) === 0}>
          {children}
        </GenericTableBodyWrapper>
        <GenericTablePagination
          page={page}
          total={total}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          setPageSize={setPageSize}
          onNextPage={onNextPage}
          onPreviousPage={onPreviousPage}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
        />
      </Table>
    </TableContainer>
  );
};

export default ExperiencesTable;
