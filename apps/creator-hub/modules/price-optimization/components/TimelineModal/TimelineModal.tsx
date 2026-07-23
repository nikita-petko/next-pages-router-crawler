import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InfoOutlinedIcon,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tooltip,
  Typography,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { addDays } from '@rbx/core';
import { maxNumCohorts, maxTestPopulation } from '../../constants/experimentConstants';
import useFormatters from '../../helpers/useFormatters';
import useTimelineModalStyles from './TimelineModal.styles';
import useRoundedTableStyles from '../common/roundedTable.styles';
import cohortsMetadata from '../../constants/cohortsMetadata';
import { convertTimeSpanToWeeks, convertTimeSpanToDays } from '../../helpers/experimentUtils';
import useGetExperimentationMetadata from '../../queries/useGetExperimentationMetadata';

export interface TimelineModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onAgree: () => void;
}

const TimelineModal = ({ open, setOpen, onAgree }: TimelineModalProps) => {
  const { translate } = useTranslation();
  const { mediumDateFormatter, percentageFormatter, changeFormatter } = useFormatters();

  const { cx, classes } = useTimelineModalStyles();
  const {
    classes: { table: roundedTableClass },
  } = useRoundedTableStyles({ hasTableHead: false });

  const { holdoutDuration, experimentDuration } = useGetExperimentationMetadata();

  const experimentDays = convertTimeSpanToDays(experimentDuration, false);

  const startTestDate = new Date();
  const reviewResultsDate = addDays(startTestDate, experimentDays);
  const reviewResultsDateString = mediumDateFormatter.format(reviewResultsDate);

  const maxTestPopulationString = percentageFormatter.format(maxTestPopulation);
  const minCohortString = changeFormatter.format(cohortsMetadata[0].priceChange);
  const maxCohortString = changeFormatter.format(
    cohortsMetadata[cohortsMetadata.length - 1].priceChange,
  );

  const holdoutDurationWeeks = convertTimeSpanToWeeks(holdoutDuration, true);

  const experimentDurationWeeks = convertTimeSpanToWeeks(experimentDuration, false);

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth='Medium'>
      <DialogTitle>{translate('Heading.Timeline')}</DialogTitle>
      <DialogContent>
        <Stepper orientation='horizontal'>
          <Step expanded active>
            <StepLabel optional={mediumDateFormatter.format(startTestDate)}>
              <Typography component='h3' variant='subtitle2'>
                {translate('Heading.Timeline.StartTest')}
              </Typography>
            </StepLabel>
          </Step>
          <Step expanded>
            <StepLabel
              optional={translate('Description.Timeline.TestDurationV2', {
                date: reviewResultsDateString,
                numWeeks: experimentDurationWeeks,
              })}>
              <Typography component='h3' variant='subtitle2'>
                {translate('Heading.Timeline.ReviewResults')}
              </Typography>
            </StepLabel>
          </Step>
          <Step expanded>
            <StepLabel
              optional={translate('Description.Timeline.HoldoutDurationV2', {
                numWeeks: holdoutDurationWeeks,
              })}>
              <Typography component='h3' variant='subtitle2'>
                {translate('Heading.Timeline.BeginHoldout')}
              </Typography>
            </StepLabel>
          </Step>
        </Stepper>

        <TableContainer className={classes.tableContainer}>
          <Table className={roundedTableClass}>
            <TableBody>
              <TableRow>
                <TableCell className={classes.boldCell}>
                  {translate('Label.Timeline.Duration')}
                </TableCell>
                <TableCell>
                  {translate('Description.Timeline.DurationV2', {
                    numWeeks: experimentDurationWeeks,
                  })}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className={cx(classes.boldCell, classes.tooltipCell)}>
                  {translate('Label.Timeline.TestPopulation')}
                  <Tooltip
                    title={translate('Description.Timeline.TestPopulationTooltip', {
                      maxTestPopulation: maxTestPopulationString,
                    })}
                    placement='top'
                    arrow>
                    <InfoOutlinedIcon fontSize='small' color='secondary' />
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {translate('Description.Timeline.TestPopulation', {
                    maxTestPopulation: maxTestPopulationString,
                  })}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className={cx(classes.boldCell, classes.tooltipCell)}>
                  {translate('Label.Timeline.Percentages')}
                  <Tooltip
                    title={translate('Description.Timeline.PercentagesTooltip', {
                      numPriceGroups: maxNumCohorts.toString(),
                    })}
                    placement='top'
                    arrow>
                    <InfoOutlinedIcon fontSize='small' color='secondary' />
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {translate('Description.Timeline.Percentages', {
                    minCohort: minCohortString,
                    maxCohort: maxCohortString,
                  })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Typography variant='footer' className={classes.footer}>
            {translate('Description.Timeline.Disclaimer')}
          </Typography>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button variant='outlined' color='primary' size='large' onClick={() => setOpen(false)}>
          {translate('Action.Cancel')}
        </Button>
        <Button
          variant='contained'
          color='primary'
          size='large'
          onClick={() => {
            setOpen(false);
            onAgree();
          }}>
          {translate('Action.AgreeAndContinue')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TimelineModal;
