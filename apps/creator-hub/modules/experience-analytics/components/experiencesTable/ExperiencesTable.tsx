import React, { Children, FC } from 'react';
import { Table, TableCell, TableContainer, TableHead, TableRow } from '@rbx/ui';
import {
  GenericChartState,
  GenericTableBodyWrapper,
  GenericTablePagination,
  GenericTablePaginationSpec,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
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
