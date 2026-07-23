import type { FC } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ChartCardHeaderAction, ChartCardHeaderMenuAction } from '@rbx/analytics-ui';
import { IconButton } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FileCopyOutlinedIcon,
  Menu,
  MenuItem,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import CodeEditor from '@modules/charts-generic/components/CodeEditors/CodeEditor';
import CodeEditorSupportedLanguages from '@modules/charts-generic/components/CodeEditors/CodeEditorSupportedLanguages';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';

type ChartOverflowMenuProps = {
  readonly action: ChartCardHeaderMenuAction;
  readonly actions: readonly ChartCardHeaderAction[];
};

const ChartOverflowMenu: FC<ChartOverflowMenuProps> = ({ action, actions }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const moreOptionsLabel = tPendingTranslation(
    'More options',
    'Aria label for the more options menu button.',
    translationKey('Action.ExploreMode.MoreOptions', TranslationNamespace.Analytics),
  );

  return (
    <>
      <IconButton
        variant='Standard'
        size='Medium'
        icon='icon-filled-three-dots-vertical'
        ariaLabel={action.label ?? moreOptionsLabel}
        aria-controls={open ? action.id : undefined}
        aria-haspopup='true'
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        data-testid={action.testId ?? 'chart-overflow-menu-button'}
      />
      <Menu
        id={action.id}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}>
        {actions.map((menuAction) => (
          <ChartOverflowMenuItem action={menuAction} closeMenu={handleClose} key={menuAction.id} />
        ))}
      </Menu>
      {actions.map((menuAction) =>
        menuAction.kind === 'custom' && menuAction.renderOverlay ? (
          <React.Fragment key={`${menuAction.id}-overlay`}>
            {menuAction.renderOverlay()}
          </React.Fragment>
        ) : null,
      )}
    </>
  );
};

const ChartOverflowMenuItem: FC<{
  readonly action: ChartCardHeaderAction;
  readonly closeMenu: () => void;
}> = ({ action, closeMenu }) => {
  const handleButtonClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (action.kind === 'button') {
        action.onClick();
      }
      closeMenu();
    },
    [action, closeMenu],
  );

  if (action.kind === 'button') {
    return (
      <MenuItem onClick={handleButtonClick} disabled={action.disabled} data-testid={action.testId}>
        {action.label}
      </MenuItem>
    );
  }

  if (action.kind === 'link') {
    return (
      <MenuItem
        component='a'
        href={action.disabled ? undefined : action.href}
        target={action.target}
        rel={action.rel}
        onClick={closeMenu}
        disabled={action.disabled}
        data-testid={action.testId}>
        {action.label}
      </MenuItem>
    );
  }

  if (action.kind === 'custom') {
    return <>{action.render({ closeMenu })}</>;
  }

  return null;
};

export const ChartSourceQueryMenuItem: FC<{
  readonly onClick: (event: React.MouseEvent) => void;
}> = ({ onClick }) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  const viewSourceQueryLabel = tPendingTranslation(
    'View source query',
    'Menu item label to view the source query for the chart.',
    translationKey('Action.ExploreMode.ViewSourceQuery', TranslationNamespace.Analytics),
  );

  return (
    <MenuItem onClick={onClick} data-testid='chart-overflow-view-source-query'>
      {viewSourceQueryLabel}
    </MenuItem>
  );
};

export const ChartSourceQueryDialog: FC<{
  readonly open: boolean;
  readonly spec: RAQIV2ChartSpec;
  readonly onClose: () => void;
}> = ({ open, spec, onClose }) => {
  const [isCopied, setIsCopied] = useState(false);
  const copiedResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const handleCloseSourceDialog = useCallback(() => {
    setIsCopied(false);
    onClose();
  }, [onClose]);

  useEffect(
    () => () => {
      if (copiedResetTimeoutRef.current) {
        clearTimeout(copiedResetTimeoutRef.current);
      }
    },
    [],
  );

  const specJson = JSON.stringify(spec, null, 2);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(specJson);
      setIsCopied(true);
      if (copiedResetTimeoutRef.current) {
        clearTimeout(copiedResetTimeoutRef.current);
      }
      copiedResetTimeoutRef.current = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      // clipboard unavailable
    }
  }, [specJson]);

  const viewSourceQueryLabel = tPendingTranslation(
    'View source query',
    'Menu item label to view the source query for the chart.',
    translationKey('Action.ExploreMode.ViewSourceQuery', TranslationNamespace.Analytics),
  );
  const closeLabel = tPendingTranslation(
    'Close',
    'Button label to close the dialog.',
    translationKey('Action.ExploreMode.Close', TranslationNamespace.Analytics),
  );
  const copyLabel = tPendingTranslation(
    'Copy',
    'Button label to copy content to clipboard.',
    translationKey('Action.ExploreMode.Copy', TranslationNamespace.Analytics),
  );
  const copiedLabel = tPendingTranslation(
    'Copied!',
    'Button label shown after content is copied to clipboard.',
    translationKey('Message.Copied', TranslationNamespace.Analytics),
  );

  return (
    <Dialog
      open={open}
      onClose={handleCloseSourceDialog}
      maxWidth='Medium'
      fullWidth
      data-testid='chart-source-query-dialog'>
      <DialogTitle>{viewSourceQueryLabel}</DialogTitle>
      <DialogContent>
        <CodeEditor
          value={specJson}
          readOnly
          language={CodeEditorSupportedLanguages.Json}
          height='400px'
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleCopy}
          variant='contained'
          color='primary'
          startIcon={<FileCopyOutlinedIcon />}
          data-testid='chart-source-query-copy'>
          {isCopied ? copiedLabel : copyLabel}
        </Button>
        <Button onClick={handleCloseSourceDialog} variant='contained' color='secondary'>
          {closeLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChartOverflowMenu;
