import React, { useCallback, useMemo, useState } from 'react';

import { ChartResourceType, TableSortOrder } from '@modules/charts-generic';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import {
  RAQIV2MetricGranularityToSeriesIntervalMeaning,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import NewUserRetentionTable from '@modules/experience-analytics/pages/RetentionPage/NewUserRetentionTable';
import useRetentionCohortPagination from '@modules/experience-analytics/pages/RetentionPage/useRetentionCohortPagination';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Grid, Typography } from '@rbx/ui';

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
    seriesIntervalMeaning: RAQIV2MetricGranularityToSeriesIntervalMeaning(tableContext.granularity),
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
