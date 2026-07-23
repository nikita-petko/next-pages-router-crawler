import type { FunctionComponent, ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, Grid, Link, Typography } from '@rbx/ui';
import type { TranslationKey } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import useChartStyles from './Chart.styles';

export type ChartFooterActionLink = { url: string; label: TranslationKey; onClick?: () => void };
export type ChartFooterProps = {
  warnings: Array<ReactNode>;
  actionLink?: ChartFooterActionLink;
};

const ChartFooter: FunctionComponent<ChartFooterProps> = ({
  warnings: warningTexts,
  actionLink,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const {
    classes: { secondaryText, warningPadding, annotationLegend },
  } = useChartStyles();

  const warnings = warningTexts.map((warningText) => {
    return (
      <Grid item key={warningText?.toString()}>
        <Typography align='left' className={secondaryText} variant='body2' color='secondary'>
          {warningText}
        </Typography>
      </Grid>
    );
  });

  const actionButton = useMemo(() => {
    return actionLink ? (
      <Grid item className={annotationLegend}>
        <Link href={actionLink.url} onClick={actionLink.onClick}>
          <Button color='primary' variant='outlined'>
            {translate(actionLink.label)}
          </Button>
        </Link>
      </Grid>
    ) : null;
  }, [actionLink, annotationLegend, translate]);

  if (!warnings.length && !actionButton) {
    return null;
  }

  return (
    <Grid container direction='column' className={warningPadding}>
      {actionButton}
      {warnings}
    </Grid>
  );
};

export default ChartFooter;
