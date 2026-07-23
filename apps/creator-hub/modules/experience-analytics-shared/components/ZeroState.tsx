import React, { ReactElement, ReactNode } from 'react';
import { Button, Grid, NavigateNextIcon, Typography } from '@rbx/ui';
import useZeroStateStyles from './ZeroState.styles';

type ZeroStateSpec = {
  heading: ReactNode;
  description: ReactNode;
  buttonContent: ReactNode;
  buttonAction: {
    href?: string;
    onClick?: () => void;
  };
  imageSrc: string;
};

const ZeroState = ({
  heading,
  description,
  buttonContent,
  buttonAction,
  imageSrc,
}: ZeroStateSpec): ReactElement => {
  const {
    classes: { grid, descriptionMargin, buttonMargin, imageMargin, imageWidth },
  } = useZeroStateStyles();

  return (
    <Grid container direction='column' justifyContent='center' alignItems='center' className={grid}>
      <Grid item>
        <Typography variant='h3' color='primary'>
          {heading}
        </Typography>
      </Grid>
      <Grid item className={descriptionMargin}>
        <Typography variant='body1' color='secondary'>
          {description}
        </Typography>
      </Grid>
      <Grid item className={buttonMargin}>
        <Button
          size='large'
          variant='contained'
          color='primary'
          href={buttonAction.href}
          onClick={buttonAction.onClick}
          endIcon={<NavigateNextIcon />}>
          {buttonContent}
        </Button>
      </Grid>
      <Grid item className={imageMargin}>
        <img src={imageSrc} className={imageWidth} alt='zero state' />
      </Grid>
    </Grid>
  );
};

export default ZeroState;
