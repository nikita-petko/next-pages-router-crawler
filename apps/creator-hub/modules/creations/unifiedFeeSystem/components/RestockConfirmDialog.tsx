import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Divider,
  Icon,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';

/** Minimum width shared by the presave and restock confirmation dialogs. */
export const CONFIRM_DIALOG_MIN_WIDTH = '580px';

interface RestockConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  quantity?: number;
  originalQuantity?: number;
  restockingFee?: number;
}

function RestockConfirmDialog({
  open,
  onConfirm,
  onCancel,
  quantity,
  originalQuantity,
  restockingFee,
}: RestockConfirmDialogProps) {
  const { translate } = useTranslation();

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel();
        }
      }}
      size='Medium'
      isModal
      hasCloseAffordance={false}>
      <DialogContent className='min-width-[580px]'>
        <DialogBody>
          <DialogTitle className='text-heading-medium margin-y-none padding-bottom-small'>
            {translate('Label.ConfirmRestock')}
          </DialogTitle>
          <span className='text-body-medium'>{translate('Message.RestockWarning')}</span>
          <div className='margin-top-[24px]'>
            <div className='grid items-center padding-[16px] [grid-template-columns:1fr_1fr]'>
              <span className='text-body-medium'>{translate('Label.AdditionalQuantity')}</span>
              <span className='text-body-medium content-muted flex flex-col'>
                {quantity && originalQuantity ? quantity - originalQuantity : 0}
              </span>
            </div>
            <Divider />
            <div className='grid items-center padding-[16px] [grid-template-columns:1fr_1fr]'>
              <span className='text-body-medium'>{translate('Label.NewTotalQuantity')}</span>
              <span className='text-body-medium content-muted flex flex-col'>{quantity}</span>
            </div>
            <Divider />
            <div className='grid items-center padding-[16px] [grid-template-columns:1fr_1fr]'>
              <span className='text-body-medium'>
                {translate('Label.RestockingFeeModalContent')}
              </span>
              <span className='text-body-medium content-muted flex items-center'>
                {restockingFee !== undefined ? (
                  <>
                    <Icon name='icon-filled-robux' size='Small' className='text-align-y-bottom' />{' '}
                    {restockingFee.toLocaleString()}
                  </>
                ) : (
                  translate('Label.Calculating')
                )}
              </span>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <div className='flex justify-end gap-small'>
            <Button variant='Standard' type='button' onClick={onCancel}>
              {translate('Action.Cancel')}
            </Button>
            <Button variant='Emphasis' type='button' onClick={onConfirm}>
              {translate('Action.ConfirmRestock')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RestockConfirmDialog;
