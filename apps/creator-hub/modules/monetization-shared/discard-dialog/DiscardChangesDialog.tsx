import { Button, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { closeDialog, openDialog } from '../dialog/actions';

type Props = {
  /** Invoked when the user confirms the discard; the dialog closes afterwards. */
  onConfirm: () => void;
  /** Closes the dialog — wired to Cancel and to the post-confirm cleanup. */
  onClose: () => void;
};

function DiscardChangesDialog({ onConfirm, onClose }: Props) {
  const { translate } = useTranslation();

  return (
    <DialogContent className='!min-width-[280px] width-full'>
      <DialogBody className='flex flex-col gap-y-xsmall'>
        <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
          {translate('Heading.DiscardChangesDialog')}
        </DialogTitle>
        <span className='text-body-medium content-default margin-none'>
          {translate('Description.DiscardChangesDialog')}
        </span>
      </DialogBody>
      <DialogFooter className='flex justify-end gap-small'>
        <Button
          variant='Emphasis'
          size='Medium'
          onClick={() => {
            onConfirm();
            onClose();
          }}>
          {translate('Action.Discard')}
        </Button>
        <Button variant='Standard' size='Medium' onClick={onClose}>
          {translate('Action.Cancel')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

/**
 * Self-contained confirm/cancel dialog for discarding unsaved edits,
 * shown through the shared dialog outlet via {@link openDiscardChangesDialog}.
 */
const TranslatedDiscardChangesDialog = withTranslation(DiscardChangesDialog, [
  TranslationNamespace.Creations,
]);

/** Opens the discard changes dialog through the shared dialog outlet. */
export function openDiscardChangesDialog({ onConfirm }: Omit<Props, 'onClose'>) {
  openDialog({
    content: <TranslatedDiscardChangesDialog onConfirm={onConfirm} onClose={closeDialog} />,
  });
}
