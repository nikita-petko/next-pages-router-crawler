import { Button, CloseIcon, Container, Drawer, Grid, IconButton, Typography } from '@rbx/ui';
import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  FormattedText,
  wellKnownAnalyticsTranslationNamespaces,
  withNamespaceSwitchedTranslation,
} from '@modules/analytics-translations';
import { FilterDrawerEventEmitterProvider } from '../../context/FilterDrawerEventEmitterContext';

import useFilterDrawerStyles from './FilterDrawer.styles';
import { DialogEventEmitterSource } from './DialogEventEmitter';

type FilterDrawerProps = {
  title: FormattedText;
  onClose: () => void;
  open?: boolean;
};

const FilterDrawer: FC<React.PropsWithChildren<FilterDrawerProps>> = ({
  children,
  title,
  onClose: givenOnClose,
  open = false,
}) => {
  const { translate } = useTranslation();

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
      drawerContainer,
      drawerTitle,
      drawerPaper,
      drawerFooter,
      drawerContent,
      drawerSecondRow,
      spacer,
      drawerButton,
    },
  } = useFilterDrawerStyles();

  const paperProps = useMemo(() => {
    return {
      className: drawerPaper,
    };
  }, [drawerPaper]);

  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
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
      variant='persistent'
      open={open}
      onClose={onClose}
      PaperProps={paperProps}
      onKeyDown={onKeyDown}>
      <Container className={drawerContainer}>
        <Grid container className={drawerTitle}>
          <Grid item>
            <Typography variant='h3'>{title}</Typography>
          </Grid>
          <Grid item>
            <IconButton
              ref={closeButtonRef}
              aria-label='Close'
              color='inherit'
              onClick={onClose}
              size='small'>
              <CloseIcon />
            </IconButton>
          </Grid>
        </Grid>
        <Grid container className={drawerSecondRow}>
          <Grid item>
            <Button variant='contained' color='secondary' onClick={onClearAll} size='large'>
              {translate('Action.ResetAll')}
            </Button>
          </Grid>
        </Grid>
        <Grid container className={drawerContent}>
          <FilterDrawerEventEmitterProvider emitter={emitter}>
            {children}
          </FilterDrawerEventEmitterProvider>
        </Grid>
        <Grid container className={drawerFooter}>
          <Button
            variant='outlined'
            color='secondary'
            onClick={onClose}
            size='large'
            className={drawerButton}>
            {translate('Action.Cancel')}
          </Button>
          <Grid item className={spacer} />
          <Button
            variant='contained'
            color='primaryBrand'
            onClick={onApply}
            size='large'
            className={drawerButton}>
            {translate('Action.Apply')}
          </Button>
        </Grid>
      </Container>
    </Drawer>
  );
};

export default withNamespaceSwitchedTranslation(
  FilterDrawer,
  wellKnownAnalyticsTranslationNamespaces,
);
