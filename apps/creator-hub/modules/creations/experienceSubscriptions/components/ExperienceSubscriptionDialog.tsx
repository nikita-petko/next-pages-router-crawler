import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogTitle,
  DialogFooter,
  Button,
} from '@rbx/foundation-ui';

type Props = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  content: React.ReactNode;
  confirmText: string;
  cancelText: string;
  loading: boolean;
};

function ExperienceSubscriptionDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  content,
  confirmText,
  cancelText,
  loading,
}: Props) {
  const { translate } = useTranslation();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      size='Medium'
      isModal
      hasCloseAffordance
      closeLabel={translate('Action.Close')}>
      <DialogContent>
        <DialogBody className='flex flex-col gap-y-xsmall'>
          <DialogTitle className='text-heading-small content-emphasis margin-none'>
            {translate(title)}
          </DialogTitle>
          <div className='text-body-medium content-default'>{content}</div>
        </DialogBody>
        <DialogFooter className='flex gap-x-small'>
          <Button variant='Emphasis' onClick={onConfirm} isLoading={loading}>
            {translate(confirmText)}
          </Button>
          <Button variant='Standard' onClick={onCancel}>
            {translate(cancelText)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default withTranslation(ExperienceSubscriptionDialog, [
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.ExperienceSubscriptions,
  TranslationNamespace.Error,
]);
