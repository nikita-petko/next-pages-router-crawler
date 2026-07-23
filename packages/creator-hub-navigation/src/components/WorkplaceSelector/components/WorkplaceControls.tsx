import React from 'react';
import { useTranslation } from '@rbx/intl';
import { AddIcon, AdjustIcon, Grid, IconButton, makeStyles, Typography } from '@rbx/ui';

const useStyles = makeStyles()((theme) => ({
  controls: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 12px',
    gap: 4,
  },
  caption: {
    flex: 1,
    color: theme.palette.content.muted,
  },
  square: {
    borderRadius: theme.border.radius.medium.borderRadius,
  },
}));

type TWorkplaceControlProps = {
  sortButtonRef: React.RefObject<HTMLButtonElement | null>;
  onCreate: VoidFunction;
  setIsSortMenuOpen: (open: boolean) => void;
};

const WorkplaceControls: React.FunctionComponent<TWorkplaceControlProps> = ({
  sortButtonRef,
  onCreate,
  setIsSortMenuOpen,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { controls, caption, square },
  } = useStyles();

  return (
    <Grid key='controls' classes={{ root: controls }}>
      <Typography classes={{ root: caption }} variant='captionHeader'>
        {translate('Label.SwitchTo')}
      </Typography>
      <IconButton
        size='small'
        classes={{ root: square }}
        color='inherit'
        aria-label='create'
        onClick={onCreate}>
        <AddIcon />
      </IconButton>

      <IconButton
        size='small'
        ref={sortButtonRef}
        classes={{ root: square }}
        color='inherit'
        aria-label='sort'
        onClick={() => {
          setIsSortMenuOpen(true);
        }}>
        <AdjustIcon />
      </IconButton>
    </Grid>
  );
};

export default WorkplaceControls;
