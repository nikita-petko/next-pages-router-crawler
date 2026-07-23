import { useCallback, useMemo, useState } from 'react';
import { RAQIV2DateRangeType, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { Grid, Typography } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import { TableSortOrder } from '@modules/charts-generic/tables/types/TableSort';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import NewUserRetentionTable from '@modules/experience-analytics/pages/RetentionPage/NewUserRetentionTable';
import useRetentionCohortPagination from '@modules/experience-analytics/pages/RetentionPage/useRetentionCohortPagination';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export type SimpleNewUserRetentionTableProps = {
  universeId: number;
  startDate: Date;
  endDate: Date;
};

const MAXIMUM_DYNAMIC_COLUMNS = 3;

const SimpleNewUserRetentionTable = ({
  universeId,
  startDate,
  endDate,
}: SimpleNewUserRetentionTableProps) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const tableContext = useMemo(
    () =>
      ({
        resource: {
          id: universeId,
          type: ChartResourceType.Universe,
        },
        timeSpec: {
          rangeType: RAQIV2DateRangeType.Custom,
          startTime: startDate,
          endTime: endDate,
        },
        filter: [],
        granularity: RAQIV2MetricGranularity.OneDay,
      }) as const,
    [universeId, startDate, endDate],
  );

  const pagination = useRetentionCohortPagination({
    startTime: startDate,
    endTime: endDate,
    granularity: tableContext.granularity,
  });

  const [cohortOrder, setCohortOrder] = useState(TableSortOrder.desc);
  const toggleOrder = useCallback(() => {
    setCohortOrder((order) =>
      order === TableSortOrder.asc ? TableSortOrder.desc : TableSortOrder.asc,
    );
  }, []);

  return (
    <Grid container item>
      <Grid item XSmall={12}>
        <Typography variant='h5'>
          {translate(translationKey('Label.NewUsersRetention', TranslationNamespace.Analytics))}
        </Typography>
      </Grid>

      <NewUserRetentionTable
        tableContext={tableContext}
        pagination={pagination}
        cohortOrder={cohortOrder}
        toggleOrder={toggleOrder}
        maximumDynamicColumns={MAXIMUM_DYNAMIC_COLUMNS}
      />
    </Grid>
  );
};

export default SimpleNewUserRetentionTable;
