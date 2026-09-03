import { useState, useCallback, Fragment } from 'react';
import { Typography } from '@rbx/ui';
import type { ConfirmDialogProp } from '@modules/miscellaneous/components';
import { ConfirmDialog } from '@modules/miscellaneous/components';
import type { DialogContentProps } from '../../interfaces/v1/ConfirmationDialogControls';
import type ConfirmationDialogControls from '../../interfaces/v1/ConfirmationDialogControls';

// remove content as a prop so we avoid storing the dialog body react node in a state object
export type PartialConfirmDialogProp = Omit<ConfirmDialogProp, 'content'>;

/** Functional component for building the dialog body w/a single or double paragraph */
export const BuildDialogBody = ({
  firstMessage,
  secondMessage,
  bodyTextAlign,
}: DialogContentProps) => {
  return (
    <>
      <Typography align={bodyTextAlign} component='p'>
        {firstMessage}
      </Typography>
      {typeof secondMessage !== 'undefined' && (
        <Fragment>
          <br />
          <Typography align={bodyTextAlign} component='p'>
            {secondMessage}
          </Typography>
        </Fragment>
      )}
    </>
  );
};

/**
 * Exp Dialog hook utility that can be used to create a boilerplate confirmation dialog with either synchronous or
 * asynchronous confirm and cancel handlers.
 *
 * @param onConfirm the asynchronous method to invoke when the dialog "confirm" button is clicked (optional)
 * @param onCancel the asynchronous method to invoke when the dialog "cancel" button is clicked (optional)
 * @returns the custom ConfirmDialog component with its generated props based on the hook input configuration,
 * and an openDialog method to trigger the initial opening of the dialog body.
 */
function useConfirmationDialog(
  onConfirm?: () => void | Promise<void>,
  onCancel?: () => void | Promise<void>,
) {
  const [open, setIsDialogOpen] = useState<boolean>(false);
  const [loading, setIsDialogLoading] = useState<boolean>(false);
  const [controls, setControls] = useState<ConfirmationDialogControls>();

  const openDialog = useCallback((dialogControls: ConfirmationDialogControls) => {
    setIsDialogOpen(true);
    setControls(dialogControls);
  }, []);

  const onDialogCancel = useCallback(async () => {
    setIsDialogLoading(true);
    await onCancel?.();
    setIsDialogOpen(false);
    setIsDialogLoading(false);
  }, [onCancel]);

  const onDialogConfirm = useCallback(async () => {
    setIsDialogLoading(true);
    await onConfirm?.();
    setIsDialogLoading(false);
    setIsDialogOpen(false);
  }, [onConfirm]);

  const partialConfirmDialogProps: PartialConfirmDialogProp = {
    open,
    isLoading: loading,
    maxWidth: 'Medium',
    title: controls?.title ?? '',
    cancelText: controls?.cancelBtnTxt ?? '',
    confirmText: controls?.confirmBtnTxt ?? '',
    onCancel: onDialogCancel,
    onConfirm: onDialogConfirm,
  };

  return {
    openDialog,
    buildDialogBodyProps: controls?.buildDialogBodyProps,
    BuildDialogBody,
    partialConfirmDialogProps,
    ConfirmDialog,
  };
}

export default useConfirmationDialog;
