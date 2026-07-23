import { addDays } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { InfoOutlinedIcon, Step, StepLabel, Stepper, Tooltip, Typography } from '@rbx/ui';
import { Link } from '@modules/monetization-shared/link';
import {
  priceReviewDocLink,
  rootDocumentationLink,
  usePriceOptimizationDocLink,
} from '../../constants/links';
import { convertTimeSpanToWeeks, convertTimeSpanToDays } from '../../helpers/experimentUtils';
import { useFormatters } from '../../helpers/useFormatters';
import { useGetExperimentationMetadata } from '../../queries/useGetExperimentationMetadata';
import useStatusBannerStyles from './StatusBanner.styles';

const TimelineBanner = () => {
  const { translate, translateHTML } = useTranslation();
  const { classes } = useStatusBannerStyles();

  const { mediumDateFormatter } = useFormatters();

  const { holdoutDuration, experimentDuration } = useGetExperimentationMetadata();

  const holdoutDurationWeeks = convertTimeSpanToWeeks(holdoutDuration, true);

  const experimentDurationWeeks = convertTimeSpanToWeeks(experimentDuration, false);

  const experimentDays = convertTimeSpanToDays(experimentDuration, false);

  const experimentStartDate = new Date();
  const experimentEndDate = addDays(new Date(), experimentDays);

  const experimentStartDateString = mediumDateFormatter.format(experimentStartDate);
  const experimentEndDateString = mediumDateFormatter.format(experimentEndDate);

  return (
    <Stepper className={classes.stepper}>
      <Step active={false}>
        <StepLabel
          optional={translate('Description.Timeline.StartDate', {
            date: experimentStartDateString,
          })}>
          <span className={classes.tooltipContainer}>
            <Typography variant='subtitle2' color='primary'>
              {translate('Label.Timeline.StartPriceTest')}
            </Typography>
            <Tooltip
              title={translateHTML('Description.Timeline.StartTest', [
                {
                  opening: 'linkStart',
                  closing: 'linkEnd',
                  content: (chunks) => (
                    <Link href={rootDocumentationLink} target='_blank'>
                      {chunks}
                    </Link>
                  ),
                },
              ])}
              placement='top'
              arrow>
              <InfoOutlinedIcon />
            </Tooltip>
          </span>
        </StepLabel>
      </Step>
      <Step active={false}>
        <StepLabel
          optional={translate('Description.Timeline.TestDurationV2', {
            date: experimentEndDateString,
            numWeeks: experimentDurationWeeks,
          })}>
          <span className={classes.tooltipContainer}>
            <Typography variant='subtitle2' color='primary'>
              {translate('Label.Timeline.ViewTestResults')}
            </Typography>
            <Tooltip
              title={translateHTML('Description.Timeline.ReviewResults', [
                {
                  opening: 'linkStart',
                  closing: 'linkEnd',
                  content: (chunks) => (
                    <Link href={usePriceOptimizationDocLink} target='_blank'>
                      {chunks}
                    </Link>
                  ),
                },
              ])}
              placement='top'
              arrow>
              <InfoOutlinedIcon />
            </Tooltip>
          </span>
        </StepLabel>
      </Step>
      <Step active={false}>
        <StepLabel
          optional={translate('Description.Timeline.HoldoutDurationV2', {
            numWeeks: holdoutDurationWeeks,
          })}>
          <span className={classes.tooltipContainer}>
            <Typography variant='subtitle2' color='primary'>
              {translate('Label.Timeline.PriceReviewPeriod')}
            </Typography>
            <Tooltip
              title={translateHTML(
                'Description.Timeline.BeginHoldoutV2',
                [
                  {
                    opening: 'linkStart',
                    closing: 'linkEnd',
                    content: (chunks) => (
                      <Link href={priceReviewDocLink} target='_blank'>
                        {chunks}
                      </Link>
                    ),
                  },
                ],
                { numWeeks: holdoutDurationWeeks },
              )}
              placement='top'
              arrow>
              <InfoOutlinedIcon />
            </Tooltip>
          </span>
        </StepLabel>
      </Step>
    </Stepper>
  );
};

export default TimelineBanner;
