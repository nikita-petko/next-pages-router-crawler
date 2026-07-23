import {
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Tooltip,
  InfoOutlinedIcon,
  CircularProgress,
} from '@rbx/ui';
import { ExperimentMetric } from '@rbx/clients/priceExperimentationApi/v1';
import { useTranslation } from '@rbx/intl';
import { MetricMetadata } from '../../types/experiment';
import useGetExperimentMetrics from '../../queries/useGetExperimentMetrics';
import useGetExperimentationMetadata from '../../queries/useGetExperimentationMetadata';
import ComparisonChip from '../ComparisonChip/ComparisonChip';
import useScorecardStyles from './Scorecard.styles';
import useRoundedTableStyles from '../common/roundedTable.styles';
import { experimentScorecardMetadata, MICRO_MULTIPLE } from '../../constants/metricsMetadata';
import cohortsMetadata from '../../constants/cohortsMetadata';
import useFormatters from '../../helpers/useFormatters';
import { usePricingError } from '../../providers/PricingErrorProvider';
import { convertTimeSpanToWeeks } from '../../helpers/experimentUtils';

const Scorecard = () => {
  const { translate } = useTranslation();
  const { cx, classes } = useScorecardStyles();
  const {
    classes: { table: roundedTableClass },
  } = useRoundedTableStyles({ hasTableHead: true });

  const {
    metrics: metricValues,
    isLoading: isLoadingMetrics,
    isError: isErrorMetrics,
  } = useGetExperimentMetrics();

  usePricingError(isErrorMetrics);

  const { changeFormatter } = useFormatters();

  const { holdoutDuration } = useGetExperimentationMetadata();

  const holdoutDurationWeeks = convertTimeSpanToWeeks(holdoutDuration, true);

  /**
   * Summary of what we're trying to do in the next few lines:
   * We're given an array of results for each combination of metrics and cohorts.
   * We need to turn this into a map of metric name -> cohort name -> metric details
   * and get an ordered list of the cohorts present in the data (ordered by the cohort metadata order).
   */

  // Get all the cohorts in the metrics
  // And create a map of metric name -> cohort name -> metric details
  const experimentCohortsSet: Set<string> = new Set();
  const metricCohortMap: Map<string, Map<string, ExperimentMetric>> = new Map();

  metricValues.forEach((metricValue) => {
    experimentCohortsSet.add(metricValue.userCohort);
    if (!metricCohortMap.has(metricValue.name)) {
      metricCohortMap.set(metricValue.name, new Map());
    }
    // We know the metric is in the map since we just added it
    metricCohortMap.get(metricValue.name)!.set(metricValue.userCohort, metricValue);
  });

  // Get the cohorts in the experiments in the metadata ordering
  // e.g. we want price_75 to be before price_115.
  const experimentCohorts = cohortsMetadata.filter((cohort) =>
    experimentCohortsSet.has(cohort.name),
  );

  // Create the headers for the table
  const cohortHeaders = experimentCohorts.map((cohort) => (
    <TableCell key={cohort.name} className={cx(classes.cohortCell, classes.boldText)}>
      {translate('Heading.PriceLevel', {
        priceChangePercent: changeFormatter.format(cohort.priceChange),
      })}
    </TableCell>
  ));

  // Create the rows for the table
  const metricsToRows = (metadata: MetricMetadata[]) =>
    metadata.map((metric) => {
      const values = experimentCohorts.map((cohort) => {
        const metricValue = metricCohortMap.get(metric.name)?.get(cohort.name);
        if (!metricValue) {
          return <TableCell key={metric.name + cohort.name} className={classes.cohortCell} />;
        }

        const value = metricValue.valueInMicroUnits / MICRO_MULTIPLE;

        return (
          <TableCell key={metric.name + cohort.name} className={classes.cohortCell}>
            <ComparisonChip
              value={value}
              isStatSig={metricValue.isStatisticallySignificant}
              isPositiveGood={metric.isPositiveGood}
            />
          </TableCell>
        );
      });
      const row = (
        <TableRow key={metric.name}>
          <TableCell>
            <span className={classes.metricName}>
              <Typography variant='body2' className={classes.boldText}>
                {translate(metric.translationKey)}
              </Typography>
              {/* NumWeeks current passes in holdout duration, if new translation params are introduced, need to change this */}
              <Tooltip
                title={translate(metric.tooltipTranslationKey, { numWeeks: holdoutDurationWeeks })}
                placement='top'
                arrow>
                <InfoOutlinedIcon fontSize='small' color='secondary' />
              </Tooltip>
            </span>
          </TableCell>
          {values}
        </TableRow>
      );
      return row;
    });

  const resultRows = metricsToRows(
    experimentScorecardMetadata.filter((metric) => !metric.isPrediction),
  );
  const predictionRows = metricsToRows(
    experimentScorecardMetadata.filter((metric) => metric.isPrediction),
  );

  if (isErrorMetrics) {
    return null;
  }

  if (isLoadingMetrics) {
    return <CircularProgress />;
  }

  return (
    <TableContainer>
      <Table className={cx(roundedTableClass, classes.table)}>
        <TableHead>
          <TableRow>
            <TableCell className={classes.titleCell} />
            <TableCell colSpan={cohortHeaders.length} className={classes.titleCell}>
              <span className={classes.priceGroups}>
                <Typography variant='body2' className={classes.boldText}>
                  {translate('Heading.PriceGroups')}
                </Typography>
                <Tooltip title={translate('Description.Metrics.PriceGroups')} placement='top' arrow>
                  <InfoOutlinedIcon fontSize='small' color='secondary' />
                </Tooltip>
              </span>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell />
            {cohortHeaders}
          </TableRow>
        </TableHead>
        <TableBody>
          {resultRows}
          {predictionRows.length > 0 && (
            <TableRow>
              {/* Span all cohorts, the +1 is for the metric name column */}
              <TableCell colSpan={cohortHeaders.length + 1} className={classes.modeledOutcomeCell}>
                {translate('Heading.ModeledOutcomes')}
              </TableCell>
            </TableRow>
          )}
          {predictionRows}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default Scorecard;
