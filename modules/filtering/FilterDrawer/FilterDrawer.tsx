// Adapted from creator-hub: https://github.rbx.com/Roblox/creator-hub/blob/master/apps/creator-hub/modules/charts-generic/components/FilterDrawer/FilterDrawer.tsx

import { Button, CloseIcon, Container, Drawer, Grid, IconButton, Typography } from '@rbx/ui';
import { KeyboardEvent, PropsWithChildren, useCallback, useEffect, useMemo, useRef } from 'react';

import { FilterDrawerEventEmitterProvider } from '../FilterDrawerEventEmitterContext';
import { DialogEventEmitterSource } from './DialogEventEmitter';
import useFilterDrawerStyles from './FilterDrawer.styles';
import { getText } from '../utils/filterStrings';

type FilterDrawerProps = {
  onClose: () => void;
  open?: boolean;
  title: string;
};

const FilterDrawer = ({
  children,
  onClose: givenOnClose,
  open = false,
  title,
}: PropsWithChildren<FilterDrawerProps>) => {
  // There are three actions we need to support: {close/cancel, reset, accept}
  // To support reset, we need to keep track of all the state as it was when the drawer was opened
  // To support cancel, we also need to hold changes until the user "accept"s
  const emitter = useMemo(() => new DialogEventEmitterSource(), []);

  const onClearAll = useCallback(() => {
    emitter.clear();
  }, [emitter]);
  const onClose = useCallback(() => {
    emitter.reset();
    givenOnClose();
  }, [givenOnClose, emitter]);
  const onApply = useCallback(() => {
    emitter.apply();
    givenOnClose();
  }, [givenOnClose, emitter]);

  const {
    classes: {
      drawerButton,
      drawerContainer,
      drawerContent,
      drawerFooter,
      drawerPaper,
      drawerRoot,
      drawerSecondRow,
      drawerTitle,
      spacer,
    },
  } = useFilterDrawerStyles();

  const paperProps = useMemo(() => {
    return {
      className: drawerPaper,
    };
  }, [drawerPaper]);

  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        event.stopPropagation();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    }
  }, [open]);

  return (
    <Drawer
      anchor='right'
      classes={{ root: drawerRoot }}
      onClose={onClose}
      onKeyDown={onKeyDown}
      open={open}
      PaperProps={paperProps}
      variant='persistent'>
      <Container className={drawerContainer}>
        <Grid className={drawerTitle} container>
          <Grid item>
            <Typography variant='h3'>{title}</Typography>
          </Grid>
          <Grid item>
            <IconButton
              aria-label='Close'
              color='inherit'
              onClick={onClose}
              ref={closeButtonRef}
              size='small'>
              <CloseIcon />
            </IconButton>
          </Grid>
        </Grid>
        <Grid className={drawerSecondRow} container>
          <Grid item>
            <Button color='secondary' onClick={onClearAll} size='large' variant='contained'>
              {getText('Action.ResetAll')}
            </Button>
          </Grid>
        </Grid>
        <Grid className={drawerContent} container>
          <FilterDrawerEventEmitterProvider emitter={emitter}>
            {children}
          </FilterDrawerEventEmitterProvider>
        </Grid>
        <Grid className={drawerFooter} container>
          <Button
            className={drawerButton}
            color='secondary'
            onClick={onClose}
            size='large'
            variant='outlined'>
            {getText('Action.Cancel')}
          </Button>
          <Grid className={spacer} item />
          <Button
            className={drawerButton}
            color='primaryBrand'
            onClick={onApply}
            size='large'
            variant='contained'>
            {getText('Action.Apply')}
          </Button>
        </Grid>
      </Container>
    </Drawer>
  );
};

export default FilterDrawer;
