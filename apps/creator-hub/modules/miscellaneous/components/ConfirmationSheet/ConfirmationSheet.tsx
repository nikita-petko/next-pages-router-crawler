import type { FunctionComponent, ReactNode } from 'react';
import {
  Button,
  SheetActions,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetRoot,
  SheetTitle,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';

export type ConfirmationSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  confirmVariant?: 'Emphasis' | 'Alert';
  onConfirm: () => void;
};

const ConfirmationSheet: FunctionComponent<ConfirmationSheetProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmVariant = 'Emphasis',
  onConfirm,
}) => {
  const { translate } = useTranslation();
  const cancelLabel = translate('Action.Cancel');
  const closeLabel = translate('Action.Close');

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };
  const handleCancel = () => onOpenChange(false);

  return (
    <SheetRoot open={open} onOpenChange={onOpenChange}>
      <SheetContent centerSheetSize='Medium' largeScreenVariant='center' closeLabel={closeLabel}>
        <SheetTitle>{title}</SheetTitle>
        <SheetBody className='padding-bottom-xlarge'>
          <SheetDescription>
            <p className='text-body-medium content-default margin-none'>{description}</p>
          </SheetDescription>
        </SheetBody>
        <SheetActions className='flex gap-small'>
          <Button variant={confirmVariant} className='fill basis-0' onClick={handleConfirm}>
            {confirmLabel}
          </Button>
          <Button variant='Standard' className='fill basis-0' onClick={handleCancel}>
            {cancelLabel}
          </Button>
        </SheetActions>
      </SheetContent>
    </SheetRoot>
  );
};

export default ConfirmationSheet;
