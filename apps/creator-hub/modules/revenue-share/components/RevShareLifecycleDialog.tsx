// Provides the modal frame and close semantics for lifecycle flow content selected by page containers.
import { useCallback, type FunctionComponent, type ReactNode } from 'react';
import { Dialog, DialogBody, DialogContent, DialogTitle } from '@rbx/foundation-ui';

export type RevShareLifecycleDialogProps = {
  open: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
};

const RevShareLifecycleDialog: FunctionComponent<RevShareLifecycleDialogProps> = ({
  open,
  title,
  closeLabel,
  onClose,
  children,
}) => {
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      size='Large'
      isModal
      hasCloseAffordance
      closeLabel={closeLabel}>
      <DialogContent className='flex flex-col min-width-0 width-full [max-height:90vh]'>
        <DialogBody className='flex flex-col gap-large scroll-y min-height-0 min-width-0'>
          <DialogTitle className='text-heading-medium margin-none'>{title}</DialogTitle>
          {children}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export default RevShareLifecycleDialog;
