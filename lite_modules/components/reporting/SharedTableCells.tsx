import { Icon, TableCell } from '@rbx/foundation-ui';
import { Grid, Tooltip } from '@rbx/ui';
import { cloneElement, ReactNode } from 'react';

import useGenericTableRowStyles from '@components/reporting/GenericTableRow.styles';
import { UNAVAILABLE_VALUE_DISPLAY } from '@constants/displayConstants';
import { TranslationNamespace } from '@constants/localization';
import ReportingStatType from '@constants/reportingStatsConstants';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { GenericTableRowProps, RowCell } from '@type/genericManagementTable';
import { GetCPPFallbackValue, GetTableDisplayValue } from '@utils/reportingStats';

const RECENT_CAMPAIGN_THRESHOLD_MS = 48 * 60 * 60 * 1000;

type SharedTableCellsProps = GenericTableRowProps;

const SharedTableCells = ({ row, unsortableData }: SharedTableCellsProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);
  const {
    classes: { centerAlignedContentRow, robuxContainer },
  } = useGenericTableRowStyles();

  const paymentType = unsortableData?.paymentType;

  // Check if reporting is disabled for this off-platform campaign
  const isReportingDisabled = row.is_off_platform_request && !row.is_reporting_enabled;

  // For recently launched campaigns, metrics may not be available yet. Render a
  // clock icon instead of the generic "—" placeholder so it's clear the data is
  // still pending rather than missing.
  const isRecentlyCreated =
    !isReportingDisabled &&
    row.created_timestamp_ms !== undefined &&
    Date.now() - row.created_timestamp_ms < RECENT_CAMPAIGN_THRESHOLD_MS;
  const renderMetric = (value: string): ReactNode => {
    if (value !== UNAVAILABLE_VALUE_DISPLAY || !isRecentlyCreated) {
      return value;
    }
    return (
      <Tooltip arrow placement='top' title={translate('Tooltip.MetricsPending')}>
        <span data-testid='metrics-pending-icon'>
          <Icon name='icon-regular-clock' size='Small' />
        </span>
      </Tooltip>
    );
  };

  const spend = GetTableDisplayValue({
    isReportingDisabled,
    paymentType,
    reportingStatType: ReportingStatType.REPORTING_STAT_SPEND,
    value: row.display_spending_usd,
  });
  const plays = GetTableDisplayValue({
    isReportingDisabled,
    reportingStatType: ReportingStatType.REPORTING_STAT_PLAYS,
    value: row.play_count,
  });
  let cpp = GetTableDisplayValue({
    isReportingDisabled,
    paymentType,
    reportingStatType: ReportingStatType.REPORTING_STAT_COST_PER_PLAY,
    value: row.cost_per_play_usd,
  });
  // If CPP is <0.001 it will be returned to us as 0. We want to display '<0.001' in the case that spend and plays are nonzero.
  if (
    !isReportingDisabled &&
    cpp === UNAVAILABLE_VALUE_DISPLAY &&
    spend !== UNAVAILABLE_VALUE_DISPLAY &&
    plays !== UNAVAILABLE_VALUE_DISPLAY
  ) {
    cpp = GetCPPFallbackValue(paymentType);
  }
  const playtime7dDisplayValue = GetTableDisplayValue({
    isReportingDisabled,
    reportingStatType: ReportingStatType.REPORTING_STAT_TOTAL_PLAY_TIME_7D,
    value: row.total_play_time_hours_7d,
  });
  const robuxRevenue30dDisplayValue = GetTableDisplayValue({
    isReportingDisabled,
    reportingStatType: ReportingStatType.REPORTING_STAT_TOTAL_ROBUX_REVENUE_30D,
    value: row.total_robux_revenue_30d,
  });

  const impressions = GetTableDisplayValue({
    isReportingDisabled,
    reportingStatType: ReportingStatType.REPORTING_STAT_IMPRESSIONS,
    value: row.impression,
  });
  const clickThroughRate = GetTableDisplayValue({
    isReportingDisabled,
    reportingStatType: ReportingStatType.REPORTING_STAT_CLICK_THROUGH_RATE,
    value: row.click_through_rate,
  });
  const clicks = GetTableDisplayValue({
    isReportingDisabled,
    reportingStatType: ReportingStatType.REPORTING_STAT_CLICKS,
    value: row.click_count,
  });

  const rowCells: RowCell[] = [
    {
      cell: (
        <TableCell align='end' className={centerAlignedContentRow}>
          {renderMetric(spend)}
        </TableCell>
      ),
      id: 'display_spending_usd',
    },
    {
      cell: (
        <TableCell align='end' className={centerAlignedContentRow}>
          {renderMetric(impressions)}
        </TableCell>
      ),
      id: 'impression',
    },
    {
      cell: (
        <TableCell align='end' className={centerAlignedContentRow}>
          {renderMetric(clickThroughRate)}
        </TableCell>
      ),
      id: 'click_through_rate',
    },
    {
      cell: (
        <TableCell align='end' className={centerAlignedContentRow}>
          {renderMetric(clicks)}
        </TableCell>
      ),
      id: 'click_count',
    },
    {
      cell: (
        <TableCell align='end' className={centerAlignedContentRow}>
          {renderMetric(plays)}
        </TableCell>
      ),
      id: 'play_count',
    },
    {
      cell: (
        <TableCell align='end' className={centerAlignedContentRow}>
          {renderMetric(cpp)}
        </TableCell>
      ),
      id: 'cost_per_play_usd',
    },
    {
      cell: (
        <TableCell align='end' className={centerAlignedContentRow}>
          {renderMetric(playtime7dDisplayValue)}
          {!isReportingDisabled &&
            playtime7dDisplayValue !== UNAVAILABLE_VALUE_DISPLAY &&
            ` ${translate('Label.Hours')}`}
        </TableCell>
      ),
      id: 'total_play_time_hours_7d',
    },
    {
      cell: (
        <TableCell align='end' className={centerAlignedContentRow}>
          <Grid className={robuxContainer} container>
            {!isReportingDisabled && robuxRevenue30dDisplayValue !== UNAVAILABLE_VALUE_DISPLAY && (
              <Icon name='icon-filled-robux' size='Small' />
            )}
            {renderMetric(robuxRevenue30dDisplayValue)}
          </Grid>
        </TableCell>
      ),
      id: 'total_robux_revenue_30d',
    },
  ];
  return <>{rowCells.map((rowCell) => cloneElement(rowCell.cell, { key: rowCell.id }))}</>;
};

export default SharedTableCells;
