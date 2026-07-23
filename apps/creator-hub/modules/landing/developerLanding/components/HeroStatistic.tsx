import type { FunctionComponent } from 'react';
import React from 'react';
import { makeStyles, Typography } from '@rbx/ui';

const useStyles = makeStyles()((theme) => ({
  heroStatisticsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    alignItems: 'center',
    textAlign: 'center',
    [theme.breakpoints.down('Medium')]: {
      maxWidth: '30%',
    },
  },
  heroStatisticsText: {
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: 600,
    lineHeight: 'normal',
    [theme.breakpoints.up('Medium')]: {
      fontSize: 32,
    },
    [theme.breakpoints.up('Large')]: {
      fontSize: 48,
    },
  },
  heroStatisticsDescription: {
    fontSize: 16,
    [theme.breakpoints.down('Medium')]: {
      fontSize: 14,
    },
    fontWeight: 400,
    lineHeight: '140%',
    display: 'inline-block',
  },
}));

type THeroStatisticProps = {
  statistic: React.ReactNode;
  description: React.ReactNode;
};

const HeroStatistic: FunctionComponent<React.PropsWithChildren<THeroStatisticProps>> = ({
  statistic,
  description,
}) => {
  const {
    classes: { heroStatisticsContainer, heroStatisticsText, heroStatisticsDescription },
  } = useStyles();
  return (
    <div className={heroStatisticsContainer}>
      <Typography classes={{ root: heroStatisticsText }} variant='hero'>
        {statistic}
      </Typography>
      <Typography classes={{ root: heroStatisticsDescription }} variant='footer'>
        {description}
      </Typography>
    </div>
  );
};

export default HeroStatistic;
