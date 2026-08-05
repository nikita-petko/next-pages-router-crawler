import { Button, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import type { UseTranslationWithNamespaceResult } from '@rbx/intl';
import { useTranslationWithNamespace, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { pluralize } from '../pluralize';
import { toast } from '../snackbar/actions';

type ArchiveConfirmationDialogContentProps = {
  isArchived: boolean;
  isPending: boolean;
  onConfirm: (callbacks: { onSuccess: () => void }) => void;
  onSuccess?: () => void;
  onClose: () => void;
  /**
   * When omitted, singular (row-menu) titles are used.
   * When provided (including `1`), bulk titles are used — even for a single selection.
   */
  itemCount?: number;
};

type TranslateCreations =
  UseTranslationWithNamespaceResult<TranslationNamespace.Creations>['translate'];

const getDialogTitle = (
  translate: TranslateCreations,
  { isArchived, itemCount }: { isArchived: boolean; itemCount?: number },
) => {
  if (itemCount === undefined) {
    return isArchived ? translate('Heading.UnarchiveItem') : translate('Heading.ArchiveItem');
  }

  const countArgs = { count: itemCount.toString() };

  return isArchived
    ? pluralize(
        itemCount,
        translate('Heading.UnarchiveItemWithCount', countArgs),
        translate('Heading.UnarchiveItems', countArgs),
      )
    : pluralize(
        itemCount,
        translate('Heading.ArchiveItemWithCount', countArgs),
        translate('Heading.ArchiveItems', countArgs),
      );
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
  itemCount,
}: ArchiveConfirmationDialogContentProps) {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.Creations);
  // Row-menu copy carries no count, so it reads as a single item.
  const selectionCount = itemCount ?? 1;
  const countArgs = { count: selectionCount.toString() };

  const title = getDialogTitle(translate, { isArchived, itemCount });

  const body = isArchived
    ? translate('Message.UnarchiveItemWarning')
    : pluralize(
        selectionCount,
        translate('Message.ArchiveItemWarning'),
        translate('Message.ArchiveItemsWarning'),
      );

  const confirmLabel = !isArchived ? translate('Action.Archive') : translate('Action.Unarchive');

  const handleConfirm = () => {
    onConfirm({
      onSuccess: () => {
        const toastTitle = isArchived
          ? pluralize(
              selectionCount,
              translate('Message.ItemUnarchived'),
              translate('Message.ItemsUnarchived', countArgs),
            )
          : pluralize(
              selectionCount,
              translate('Message.ItemArchived'),
              translate('Message.ItemsArchived', countArgs),
            );

        toast({ title: toastTitle });
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
  [TranslationNamespace.Creations],
);
