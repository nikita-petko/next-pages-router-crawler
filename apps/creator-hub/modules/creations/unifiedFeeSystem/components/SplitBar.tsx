import { Grid, LinearProgress, useTheme } from '@rbx/ui';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { useSaleLocationAndRevenueStyles } from '../helper/StyleHooks';

interface SplitBarProps {
  percentages: number[];
  names: string[];
}

function SplitBar(props: SplitBarProps) {
  const { percentages, names } = props;
  const { classes } = useSaleLocationAndRevenueStyles();
  const theme = useTheme();
  const { translate } = useTranslation();

  interface progressBarStyle {
    color: 'primary' | 'secondary';
    colorCode: string;
  }

  const linearProgressStyles: progressBarStyle[] = [
    {
      color: 'primary',
      colorCode: theme.palette.actionV2.primaryBrand.fill,
    },
    {
      color: 'secondary',
      colorCode: theme.palette.content.muted,
    },
    {
      color: 'secondary',
      colorCode: theme.palette.states.focus,
    },
    {
      color: 'primary',
      colorCode: theme.palette.states.disabledBackground,
    },
  ];

  const robloxStyle: progressBarStyle = {
    color: 'secondary',
    colorCode: theme.palette.states.focus,
  };

  function getStyle(index: number, nameLabel: string) {
    if (nameLabel === 'Label.Roblox') {
      return robloxStyle;
    }
    return linearProgressStyles[index];
  }

  return (
    <div className={classes.splitBarContainer}>
      <Grid container className={classes.gridContainer} direction='row' spacing={1}>
        {percentages.map((percentage, index) => (
          <Grid
            item
            key={`${names[index]}-${percentage}`}
            style={{ width: `${percentage}%` }}
            className={classes.percentageItem}>
            <LinearProgress
              className={`${classes.percentageLinearProgress} ${index === 0 ? classes.leftPercentageBar : null} ${index === percentages.length - 1 ? classes.rightPercentageBar : null}`}
              style={{ backgroundColor: getStyle(index, names[index]).colorCode }}
              title={`${names[index]} (${percentages[index]}%)`}
              variant='determinate'
              color={getStyle(index, names[index]).color}
              value={-20} // at 0 sometimes a pixel is shown, setting to -20 is safer (translateX(-120%)).
            />
          </Grid>
        ))}
      </Grid>
      <br />
      <Grid
        container
        className={classes.legendContainer}
        direction='row'
        justifyContent='flex-end'
        spacing={1}>
        {names.map((name, index) => (
          <Grid item key={`${name}`} className={classes.legendItem}>
            <div
              className={classes.colorIndicator}
              style={{
                backgroundColor: getStyle(index, name).colorCode,
              }}
            />
            <span>{`${translate(name)} (${percentages[index]}%)`}</span>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

export default SplitBar;
