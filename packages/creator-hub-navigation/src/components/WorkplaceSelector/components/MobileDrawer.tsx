import React, { useEffect, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, ChevronLeftIcon, Drawer, Grid, makeStyles } from '@rbx/ui';
import type { TSorts } from '../../../providers/WorkspaceProvider/constants';
import SortMenu from './SortMenu';

const useStyles = makeStyles()((theme) => ({
  container: {
    width: '200%',
    transition: 'transform 200ms',
    overflow: 'hidden',
  },
  item: {
    gap: 4,
    padding: 12,
    width: '50%',
    maxHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
  },
  workspaces: {
    overflowY: 'auto',
    scrollbarColor: 'grey transparent',
    scrollbarWidth: 'thin',
    '&::-webkit-scrollbar': {
      width: 6,
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'grey',
      borderRadius: '10rem',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
  },
  paper: {
    overflow: 'hidden',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: theme.palette.surface[300],
  },
  saveSortButton: {
    marginTop: 'auto',
  },
  backButton: {
    minHeight: 48,
    justifyContent: 'left',
    '&:hover': {
      backgroundColor: 'unset',
    },
  },
}));

type TMobileDrawerProps = {
  sortBy: TSorts;
  isDrawerOpen: boolean;
  isSortMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  setIsSortMenuOpen: (open: boolean) => void;
  onSortUpdate: (sort: TSorts) => void;
};

const MobileDrawer: React.FunctionComponent<React.PropsWithChildren<TMobileDrawerProps>> = ({
  sortBy,
  isDrawerOpen,
  isSortMenuOpen,
  setIsMenuOpen,
  setIsSortMenuOpen,
  onSortUpdate,
  children,
}) => {
  const {
    cx,
    classes: { container, paper, saveSortButton, item, backButton, workspaces },
  } = useStyles();
  const { translate } = useTranslation();
  const [pendingSortBy, setPendingSortBy] = useState(sortBy);

  useEffect(() => {
    if (!isSortMenuOpen) {
      setPendingSortBy(sortBy);
    }
  }, [isSortMenuOpen, sortBy]);

  return (
    <Drawer
      slotProps={{
        backdrop: {
          onClick: () => {
            setIsMenuOpen(false);
          },
        },
      }}
      PaperProps={{
        classes: { root: paper },
      }}
      anchor='bottom'
      onClose={() => setIsMenuOpen(false)}
      open={isDrawerOpen}>
      <Grid
        container
        classes={{ root: container }}
        sx={{ transform: isSortMenuOpen ? 'translateX(-50%)' : undefined }}>
        <Grid classes={{ root: cx(item, workspaces) }}>{children}</Grid>
        <Grid classes={{ root: item }}>
          <Button
            classes={{ root: backButton }}
            color='primary'
            onClick={() => {
              setIsSortMenuOpen(false);
            }}
            startIcon={<ChevronLeftIcon />}>
            {translate('Label.SortBy')}
          </Button>
          <SortMenu sortBy={pendingSortBy} onSortUpdate={setPendingSortBy} />
          <Button
            fullWidth
            classes={{ root: saveSortButton }}
            variant='contained'
            onClick={() => {
              setIsSortMenuOpen(false);
              onSortUpdate(pendingSortBy);
            }}>
            {translate('Action.Save')}
          </Button>
        </Grid>
      </Grid>
    </Drawer>
  );
};

export default MobileDrawer;
