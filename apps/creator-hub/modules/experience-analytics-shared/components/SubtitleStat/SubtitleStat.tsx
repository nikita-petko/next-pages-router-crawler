import type { FC } from 'react';
import React from 'react';
import type { ThumbUpIcon } from '@rbx/ui';
import { Grid } from '@rbx/ui';
import type { TFormattingSpec } from '@modules/charts-generic/charts/numberFormatters';
import MetricValue from '@modules/charts-generic/components/MetricValue/MetricValue';
import useSubtitleStatStyles from './SubtitleStat.styles';

type StatIcons = typeof ThumbUpIcon;

type SubtitleStatSpec = {
  Icon?: StatIcons;
  value: number | null;
  formattingSpec: TFormattingSpec;
};

const SubtitleStat: FC<SubtitleStatSpec> = ({ Icon, value, formattingSpec }) => {
  const {
    classes: { statIcon },
  } = useSubtitleStatStyles();
  return (
    <Grid container direction='row' alignItems='center' wrap='nowrap'>
      {Icon && (
        <Icon color='secondary' className={statIcon} fontSize='inherit' data-testid='icon' />
      )}
      <Grid item>
        <MetricValue
          value={value}
          analyticsFormattingSpec={formattingSpec}
          typographySpec={{ variant: 'captionHeader', color: 'secondary' }}
        />
      </Grid>
    </Grid>
  );
};

export default SubtitleStat;
