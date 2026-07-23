import type { FunctionComponent } from 'react';
import { Grid, Typography, useMediaQuery } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';

export type AnalyticsPageTitleProps = {
  text: FormattedText;
};

export const AnalyticsPageTitle: FunctionComponent<AnalyticsPageTitleProps> = ({ text }) => {
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  return (
    <Grid item>
      <Typography variant={isCompactView ? 'h3' : 'h1'}>{text}</Typography>
    </Grid>
  );
};
