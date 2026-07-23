import React, { FunctionComponent } from 'react';
import { Typography, IconButton, NavigateNextIcon, makeStyles, Grid } from '@rbx/ui';

const useStyles = makeStyles()({
  root: {
    marginBottom: 16,
  },
});

type TSectionHeaderProps = {
  header: React.ReactNode;
  viewAllUrl?: string;
  onViewAllClick?: () => void;
};

const SectionHeader: FunctionComponent<React.PropsWithChildren<TSectionHeaderProps>> = ({
  header,
  viewAllUrl,
  onViewAllClick,
}) => {
  const {
    classes: { root },
  } = useStyles();
  return (
    <Grid container className={root} data-testid='section-header'>
      <Grid item display='flex' alignItems='center'>
        <Typography variant='h5'>{header}</Typography>
        {viewAllUrl && (
          <a href={viewAllUrl} onClick={onViewAllClick} target='_self'>
            <IconButton size='small' color='default' aria-label='view all'>
              <NavigateNextIcon />
            </IconButton>
          </a>
        )}
      </Grid>
    </Grid>
  );
};

export default SectionHeader;
