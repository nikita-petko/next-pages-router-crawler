import React, { FunctionComponent, ReactNode } from 'react';
import { Grid, makeStyles, Typography, CloseIcon, IconButton } from '@rbx/ui';
import { studioLogoDimensionCompact } from '../constants/navigationConstants';
import StudioIcon from './StudioIcon';
import TopNavigationDrawerHeader from './TopNavigationDrawerHeader';

type TopNavigationDrawerProductHeaderProps = {
  header: ReactNode;
  onClickClose: () => void;
};

const useTopNavigationDrawerProductHeaderStyles = makeStyles()((theme) => ({
  heading: {
    padding: theme.spacing(0, 0, 0, 0.5),
  },
}));

const TopNavigationDrawerProductHeader: FunctionComponent<
  TopNavigationDrawerProductHeaderProps
> = ({ header, onClickClose }) => {
  const {
    classes: { heading },
  } = useTopNavigationDrawerProductHeaderStyles();

  return (
    <TopNavigationDrawerHeader>
      <Grid container alignItems='center' wrap='nowrap' justifyContent='space-between'>
        <Grid container alignItems='center'>
          <StudioIcon size={studioLogoDimensionCompact} />
          <Typography className={heading} variant='h5'>
            {header}
          </Typography>
        </Grid>
        <Grid item>
          <IconButton color='secondary' aria-label='close' onClick={onClickClose} size='large'>
            <CloseIcon />
          </IconButton>
        </Grid>
      </Grid>
    </TopNavigationDrawerHeader>
  );
};

export default TopNavigationDrawerProductHeader;
