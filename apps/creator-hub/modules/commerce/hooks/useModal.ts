import { useCallback } from 'react';
import { makeStyles, useDialog } from '@rbx/ui';
import type { TDialogProps, TTheme } from '@rbx/ui';

export type Breakpoint = keyof TTheme['breakpoints']['values'];

const useStyles = makeStyles()((theme) => ({
  paper: {
    padding: theme.spacing(1),
  },
}));

const useHigherContrastStyles = makeStyles()((theme) => ({
  paper: {
    padding: theme.spacing(1),
    backgroundColor: theme.palette.surface[100],
  },
}));

const useModal = () => {
  const { configure, open, close: closeModal } = useDialog();
  const { classes } = useStyles();
  const higherContrastClasses = useHigherContrastStyles();

  const getModalProps = useCallback(
    ({
      maxWidth,
      onBackdropClick,
      useHigherContrast,
    }: {
      maxWidth: Breakpoint;
      onBackdropClick: () => void;
      useHigherContrast?: boolean;
    }) => {
      return {
        PaperProps: {
          classes: useHigherContrast
            ? { root: higherContrastClasses.classes.paper }
            : { root: classes.paper },
        },
        maxWidth,
        onBackdropClick,
        disableEscapeKeyDown: true,
      };
    },
    [classes, higherContrastClasses],
  );

  const getSidePanelProps = useCallback(
    ({
      maxWidth,
      onBackdropClick,
      useHigherContrast,
    }: {
      maxWidth: Breakpoint;
      onBackdropClick: () => void;
      useHigherContrast?: boolean;
    }) => {
      return {
        PaperProps: {
          classes: useHigherContrast
            ? { root: higherContrastClasses.classes.paper }
            : { root: classes.paper },
          sx: {
            width: '601px',
            maxWidth: '50%',
            position: 'fixed',
            marginTop: '75px',
            top: 0,
            right: 0,
            paddingTop: '100px',
            borderRadius: '8px',
            height: 'calc(100% - 100px)',
          },
        },
        sx: {
          '& .MuiDialog-paperAnchorRight': {
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
          },
        },
        maxWidth,
        onBackdropClick,
        disableEscapeKeyDown: true,
      };
    },
    [classes, higherContrastClasses],
  );

  const openModal = useCallback(
    (
      modalChildren: TDialogProps['children'],
      modalProps?: Omit<TDialogProps, 'onClose' | 'open' | 'children' | 'ref'>,
    ) => {
      configure(modalChildren, modalProps);
      open();
    },
    [configure, open],
  );

  return {
    openModal,
    closeModal,
    getModalProps,
    getSidePanelProps,
  };
};

export default useModal;
