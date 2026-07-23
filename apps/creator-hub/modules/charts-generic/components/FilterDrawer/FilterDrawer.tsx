import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { CloseIcon, Container, Drawer, Grid, IconButton, Tooltip, Typography } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import wellKnownAnalyticsTranslationNamespaces from '@modules/analytics-translations/wellKnownAnalyticsTranslationNamespaces';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { FilterDrawerEventEmitterProvider } from '../../context/FilterDrawerEventEmitterContext';
import { DialogEventEmitterSource } from './DialogEventEmitter';
import useFilterDrawerStyles from './FilterDrawer.styles';

type FilterDrawerProps = {
  title: FormattedText;
  onClose: () => void;
  open?: boolean;
  /**
   * When provided, takes over the Reset All action: the drawer delegates the
   * entire Reset All behavior (clearing any filters AND closing the drawer) to
   * this callback, bypassing the default pending-state-clear behavior. A hint
   * tooltip is shown on the button to indicate this immediate-apply semantic.
   *
   * When omitted, Reset All falls back to the default behavior of clearing
   * pending state only (user still needs to Apply or Cancel to commit/revert).
   */
  onResetAll?: () => void;
};

const FilterDrawer: FC<React.PropsWithChildren<FilterDrawerProps>> = ({
  children,
  title,
  onClose: givenOnClose,
  onResetAll: givenOnResetAll,
  open = false,
}) => {
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());

  const resetAllLabel = tPendingTranslation(
    'Reset all',
    'Button label to reset all pending filter selections in the filter drawer.',
    translationKey('Action.ResetAll', TranslationNamespace.Analytics),
  );
  const resetAllClosesAndClearsTooltip = tPendingTranslation(
    'Clears all filters and closes this panel immediately.',
    'Tooltip shown when Reset All immediately clears filters and closes the filter drawer.',
    translationKey(
      'Description.FilterDrawer.ResetAllClosesAndClears',
      TranslationNamespace.Analytics,
    ),
  );

  // There are three actions we need to support: {close/cancel, reset, accept}
  // To support reset, we need to keep track of all the state as it was when the drawer was opened
  // To support cancel, we also need to hold changes until the user "accept"s
  const emitter = useMemo(() => new DialogEventEmitterSource(), []);

  const onClearAll = useCallback(() => {
    if (givenOnResetAll) {
      // Consumer takes full responsibility for the Reset All action, including
      // committing any cleared state and closing the drawer. Skip the default
      // emitter.clear() path to avoid double-handling.
      givenOnResetAll();
      return;
    }
    emitter.clear();
  }, [emitter, givenOnResetAll]);
  const onClose = useCallback(() => {
    emitter.reset();
    givenOnClose();
  }, [givenOnClose, emitter]);
  const onApply = useCallback(() => {
    emitter.apply();
    givenOnClose();
  }, [givenOnClose, emitter]);

  const {
    classes: { drawerContainer, drawerTitle, drawerPaper, drawerFooter, drawerContent },
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
      <Container className={drawerContainer} data-foundation-dropdown-portal-container>
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
        <Grid container className={drawerContent}>
          <FilterDrawerEventEmitterProvider emitter={emitter}>
            {children}
          </FilterDrawerEventEmitterProvider>
        </Grid>
        <div className={`${drawerFooter} flex gap-small`}>
          <Button variant='Emphasis' size='Medium' className='fill basis-0' onClick={onApply}>
            {translate(translationKey('Action.Apply', TranslationNamespace.Controls))}
          </Button>
          <Button variant='Standard' size='Medium' className='fill basis-0' onClick={onClose}>
            {translate(translationKey('Action.Close', TranslationNamespace.Controls))}
          </Button>
          {givenOnResetAll ? (
            <Tooltip title={resetAllClosesAndClearsTooltip} arrow>
              <Button variant='Utility' size='Medium' className='fill basis-0' onClick={onClearAll}>
                {resetAllLabel}
              </Button>
            </Tooltip>
          ) : (
            <Button variant='Utility' size='Medium' className='fill basis-0' onClick={onClearAll}>
              {resetAllLabel}
            </Button>
          )}
        </div>
      </Container>
    </Drawer>
  );
};

export default withNamespaceSwitchedTranslation(
  FilterDrawer,
  wellKnownAnalyticsTranslationNamespaces,
);
