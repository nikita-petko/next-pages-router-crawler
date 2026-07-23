import { useId } from 'react';
import { Card, CardContent, InfoOutlinedIcon, Tooltip, Typography } from '@rbx/ui';
import useExperimentResultCardStyles from './ExperimentResultCard.styles';

export enum ExperimentResultTextColor {
  NEUTRAL = 0,
  NEGATIVE = 1,
  POSITIVE = 2,
}

export interface ExperimentResultCardProps {
  title: string;
  text: string;
  primary?: boolean;
  tooltip?: string;
  textColor?: ExperimentResultTextColor;
  className?: string;
}

const ExperimentResultCard = ({
  title,
  text,
  className,
  primary,
  tooltip,
  textColor = ExperimentResultTextColor.NEUTRAL,
}: ExperimentResultCardProps) => {
  const { classes, cx } = useExperimentResultCardStyles();

  // Used both for accessibility and also so getByLabelText works in tests.
  const titleId = useId();

  return (
    <Card aria-labelledby={titleId} className={className}>
      <CardContent className={classes.cardContentContainer}>
        <span className={classes.header}>
          <Typography variant='body2' color='secondary' id={titleId}>
            {title}
          </Typography>
          {tooltip && (
            <Tooltip title={tooltip} placement='top' arrow>
              <InfoOutlinedIcon fontSize='small' color='secondary' />
            </Tooltip>
          )}
        </span>
        <Typography
          variant={primary ? 'h2' : 'h5'}
          component='p'
          className={cx({
            [classes.successText]: textColor === ExperimentResultTextColor.POSITIVE,
            [classes.failureText]: textColor === ExperimentResultTextColor.NEGATIVE,
          })}>
          {text}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ExperimentResultCard;
