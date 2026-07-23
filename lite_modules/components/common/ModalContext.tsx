import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  makeStyles,
} from '@rbx/ui';
import { memo, ReactNode, useCallback } from 'react';

import { useModalStore } from '@stores/modalStoreProvider';

interface ModalContextProps {
  children: ReactNode;
}

const ModalContext = memo(({ children }: ModalContextProps) => {
  const { isOpen: modalOpen, modalConfig: modalConfigData } = useModalStore();

  const {
    classes: { dialogContextTextRoot },
  } = makeStyles()(() => ({
    dialogContextTextRoot: {
      marginBottom: 0,
    },
  }))();

  const hasDialogContent = useCallback(
    () => Boolean(modalConfigData && modalConfigData.dialogContent),
    [modalConfigData],
  );

  const hasDialogCompletelyCustomContent = useCallback(
    () => Boolean(modalConfigData && modalConfigData.completelyCustomModalContents),
    [modalConfigData],
  );

  const defaultModalMarkup = (
    <>
      <DialogTitle>{modalConfigData.title}</DialogTitle>
      <DialogContent>
        <DialogContentText classes={{ root: dialogContextTextRoot }}>
          {modalConfigData.dialogContent}
        </DialogContentText>
      </DialogContent>
      <DialogActions>{modalConfigData.dialogActions}</DialogActions>
    </>
  );

  const modalContent = hasDialogCompletelyCustomContent()
    ? modalConfigData.completelyCustomModalContents
    : defaultModalMarkup;

  return (
    <>
      {children}
      <Dialog
        fullWidth={modalConfigData?.fullWidth}
        onClose={modalConfigData.handleClose}
        open={modalOpen && (hasDialogContent() || hasDialogCompletelyCustomContent())}
        TransitionProps={{
          onExit: modalConfigData.handleClose as (node: HTMLElement) => void,
        }}>
        {modalContent}
      </Dialog>
    </>
  );
});

export default ModalContext;
