import { Button, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { toast } from '../snackbar/actions';

/**
 * Monetization item kinds that share this archive confirmation dialog.
 * Game passes will plug in once their archive mutation path lands.
 */
export type ArchiveItemType = 'developerProduct' | 'gamePass';

type ArchiveConfirmationDialogContentProps = {
  isArchived: boolean;
  isPending: boolean;
  onConfirm: (callbacks: { onSuccess: () => void }) => void;
  onSuccess?: () => void;
  onClose: () => void;
};

/**
 * Shared archive/unarchive confirmation UI. Feature modules supply the mutation
 * via `onConfirm`; toast + close live here so copy stays in one place.
 */
function ArchiveConfirmationDialogContent({
  isArchived,
  isPending,
  onConfirm,
  onSuccess,
  onClose,
}: ArchiveConfirmationDialogContentProps) {
  const unwrapped = useTranslation();
  const { translate } = unwrapped;
  const { tPendingTranslation } = useTranslationWrapper(unwrapped);

  const title = !isArchived
    ? tPendingTranslation(
        'Archive item?',
        'Title of the confirmation dialog shown when a creator archives a monetization item.',
        translationKey('Heading.ArchiveItem', TranslationNamespace.Creations),
      )
    : tPendingTranslation(
        'Unarchive item?',
        'Title of the confirmation dialog shown when a creator unarchives a monetization item.',
        translationKey('Heading.UnarchiveItem', TranslationNamespace.Creations),
      );

  const body = !isArchived
    ? tPendingTranslation(
        'Archiving this item removes it from sale and hides it from your experience. You can unarchive it later.',
        'Body text of the confirmation dialog shown when archiving a monetization item.',
        translationKey('Message.ArchiveItemWarning', TranslationNamespace.Creations),
      )
    : tPendingTranslation(
        'Unarchiving this item makes it available again. You can put it back on sale from its settings.',
        'Body text of the confirmation dialog shown when unarchiving a monetization item.',
        translationKey('Message.UnarchiveItemWarning', TranslationNamespace.Creations),
      );

  const confirmLabel = !isArchived
    ? tPendingTranslation(
        'Archive',
        'Label for the action to archive a monetization item.',
        translationKey('Action.Archive', TranslationNamespace.Creations),
      )
    : tPendingTranslation(
        'Unarchive',
        'Label for the action to unarchive a monetization item.',
        translationKey('Action.Unarchive', TranslationNamespace.Creations),
      );

  const handleConfirm = () => {
    onConfirm({
      onSuccess: () => {
        toast({
          title: isArchived
            ? tPendingTranslation(
                'Item unarchived',
                'Toast confirming a monetization item was unarchived.',
                translationKey('Message.ItemUnarchived', TranslationNamespace.Creations),
              )
            : tPendingTranslation(
                'Item archived',
                'Toast confirming a monetization item was archived.',
                translationKey('Message.ItemArchived', TranslationNamespace.Creations),
              ),
        });
        onClose();
        onSuccess?.();
      },
    });
  };

  return (
    <DialogContent className='!min-width-[280px] width-full'>
      <DialogBody className='flex flex-col gap-y-xsmall'>
        <DialogTitle className='text-heading-small margin-y-none padding-bottom-small'>
          {title}
        </DialogTitle>
        <span className='text-body-medium content-default margin-none'>{body}</span>
      </DialogBody>
      <DialogFooter className='flex flex-col gap-small small:flex-row'>
        <Button
          variant={!isArchived ? 'Alert' : 'Emphasis'}
          size='Medium'
          className='fill small:basis-0'
          onClick={handleConfirm}
          isLoading={isPending}
          isDisabled={isPending}>
          {confirmLabel}
        </Button>
        <Button
          variant='Standard'
          size='Medium'
          className='fill small:basis-0'
          onClick={onClose}
          isDisabled={isPending}>
          {translate('Action.Cancel')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export const TranslatedArchiveConfirmationDialogContent = withTranslation(
  ArchiveConfirmationDialogContent,
  [TranslationNamespace.Creations, TranslationNamespace.Controls],
);
