import type { FunctionComponent, ReactNode } from 'react';
import { useMemo } from 'react';
import { Grid, InfoOutlinedIcon, Tooltip, Typography } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import useAnalyticsPageStyles from './AnalyticsPage.styles';

export type AnalyticsPageDescriptionProps = {
  text: FormattedText | ReactNode;
  tooltipText?: FormattedText;
};

export const AnalyticsPageDescription: FunctionComponent<AnalyticsPageDescriptionProps> = ({
  text,
  tooltipText,
}) => {
  const {
    classes: { descriptionGrid, description, tooltipContainer },
  } = useAnalyticsPageStyles();
  const tooltip = useMemo(() => {
    return tooltipText ? (
      <Tooltip arrow title={tooltipText} placement='top' enterTouchDelay={0} leaveTouchDelay={3000}>
        <div className={tooltipContainer}>
          <InfoOutlinedIcon fontSize='small' />
        </div>
      </Tooltip>
    ) : null;
  }, [tooltipContainer, tooltipText]);

  return (
    <Grid item className={descriptionGrid}>
      <Typography className={description} variant='body1'>
        {text}
      </Typography>
      {tooltip}
    </Grid>
  );
};
