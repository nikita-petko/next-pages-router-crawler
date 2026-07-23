import type { ExperimentMetric } from '@rbx/client-price-experimentation-api/v1';
import { useTranslation } from '@rbx/intl';
import {
  CircularProgress,
  InfoOutlinedIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tooltip,
  Typography,
} from '@rbx/ui';
import { HOLDOUT_COMPARISON_COHORT } from '../../constants/cohortsMetadata';
import { holdoutScorecardMetadata, MICRO_MULTIPLE } from '../../constants/metricsMetadata';
import { usePricingError } from '../../providers/PricingErrorProvider';
import { useGetHoldoutMetrics } from '../../queries/useGetHoldoutMetrics';
import useRoundedTableStyles from '../common/roundedTable.styles';
import ComparisonChip from '../ComparisonChip/ComparisonChip';
import useScorecardStyles from './Scorecard.styles';

const HoldoutScorecard = () => {
  const {
    classes: { table: roundedTableClass },
  } = useRoundedTableStyles({ hasTableHead: false });
  const { cx, classes } = useScorecardStyles();

  const { translate } = useTranslation();

  const {
    metrics: rawMetricValues,
    isLoading: isLoadingMetrics,
    isError: isErrorMetrics,
  } = useGetHoldoutMetrics();

  usePricingError(isErrorMetrics);

  // The endpoint should only return price100 cohorts anyway, but filtering out non price100 cohorts to be safe.
  const filteredMetricValues = rawMetricValues.filter(
    (metric) => metric.userCohort === HOLDOUT_COMPARISON_COHORT,
  );

  // Create a map of metric name -> metric details to be used to order them in metadata order
  const metricValuesMap = new Map<string, ExperimentMetric>();
  filteredMetricValues.forEach((metric) => {
    metricValuesMap.set(metric.name, metric);
  });

  // Create the rows for the table
  const rows = holdoutScorecardMetadata.map((metric) => {
    let cell = <TableCell />;
    const metricValue = metricValuesMap.get(metric.name);
    if (metricValue) {
      const value = metricValue.valueInMicroUnits / MICRO_MULTIPLE;
      cell = (
        <TableCell>
          <ComparisonChip
            value={value}
            isStatSig={metricValue.isStatisticallySignificant}
            isPositiveGood={metric.isPositiveGood}
          />
        </TableCell>
      );
    }
    return (
      <TableRow key={metric.name}>
        <TableCell>
          <span className={classes.metricName}>
            <Typography variant='body2' className={classes.boldText}>
              {translate(metric.translationKey)}
            </Typography>
            <Tooltip title={translate(metric.tooltipTranslationKey)} placement='top' arrow>
              <InfoOutlinedIcon fontSize='small' color='secondary' />
            </Tooltip>
          </span>
        </TableCell>
        {cell}
      </TableRow>
    );
  });

  if (isErrorMetrics) {
    return null;
  }

  if (isLoadingMetrics) {
    return <CircularProgress />;
  }

  return (
    <TableContainer>
      <Table className={cx(roundedTableClass, classes.table)}>
        <TableBody>{rows}</TableBody>
      </Table>
    </TableContainer>
  );
};

export default HoldoutScorecard;
