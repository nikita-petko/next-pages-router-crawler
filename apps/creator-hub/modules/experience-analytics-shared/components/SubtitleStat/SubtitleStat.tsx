import { Grid, PeopleIcon, ThumbUpIcon } from '@rbx/ui';
import React, { FC } from 'react';
import { FormattingSpec, MetricValue } from '@modules/charts-generic';
import useSubtitleStatStyles from './SubtitleStat.styles';

type StatIcons = typeof ThumbUpIcon | typeof PeopleIcon;

type SubtitleStatSpec = {
  Icon?: StatIcons;
  value: number | null;
  formattingSpec: FormattingSpec;
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
          formattingSpec={formattingSpec}
          typographySpec={{ variant: 'captionHeader', color: 'secondary' }}
        />
      </Grid>
    </Grid>
  );
};

export default SubtitleStat;
