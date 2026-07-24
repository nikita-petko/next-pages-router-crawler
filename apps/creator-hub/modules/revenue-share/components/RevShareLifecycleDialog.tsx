// Provides the modal frame and close semantics for lifecycle flow content selected by page containers.
import { useCallback, type FunctionComponent, type ReactNode } from 'react';
import { Dialog, DialogBody, DialogContent, DialogTitle } from '@rbx/foundation-ui';

export type RevShareLifecycleDialogProps = {
  open: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  compactTopContent?: boolean;
};

const RevShareLifecycleDialog: FunctionComponent<RevShareLifecycleDialogProps> = ({
  open,
  title,
  closeLabel,
  onClose,
  children,
  compactTopContent = false,
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
      closeLabel={closeLabel}
      hasMarginTop={false}
      hasMarginBottom={false}>
      <DialogContent className='flex flex-col min-width-0 width-full [max-height:90vh]'>
        {!compactTopContent && (
          <div className='flex items-center height-1800 padding-left-large [padding-right:var(--size-1800)] shrink-0'>
            <DialogTitle className='text-heading-small margin-none'>{title}</DialogTitle>
          </div>
        )}
        <DialogBody
          className={
            compactTopContent
              ? 'flex flex-col gap-large scroll-y min-height-0 min-width-0 padding-large'
              : 'flex flex-col gap-large scroll-y min-height-0 min-width-0 padding-x-large padding-top-none padding-bottom-large'
          }>
          {compactTopContent && (
            <DialogTitle className='text-heading-small margin-none'>{title}</DialogTitle>
          )}
          {children}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export default RevShareLifecycleDialog;
