import { Button, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import type { TPendingTranslationFunction } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
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

const getDialogTitle = (
  tPendingTranslation: TPendingTranslationFunction,
  { isArchived, itemCount }: { isArchived: boolean; itemCount?: number },
) => {
  if (itemCount === undefined) {
    return isArchived
      ? tPendingTranslation(
          'Unarchive item',
          'Title of the confirmation dialog shown when a creator unarchives a single monetization item from the row menu.',
          translationKey('Heading.UnarchiveItem', TranslationNamespace.Creations),
        )
      : tPendingTranslation(
          'Archive item',
          'Title of the confirmation dialog shown when a creator archives a single monetization item from the row menu.',
          translationKey('Heading.ArchiveItem', TranslationNamespace.Creations),
        );
  }

  const countArgs = { count: itemCount.toString() };

  return isArchived
    ? pluralize(
        itemCount,
        tPendingTranslation(
          'Unarchive {count} item',
          'Title of the bulk unarchive confirmation dialog when exactly one item is selected; {count} is the selection count.',
          translationKey('Heading.UnarchiveItemWithCount', TranslationNamespace.Creations),
          countArgs,
        ),
        tPendingTranslation(
          'Unarchive {count} items',
          'Title of the bulk unarchive confirmation dialog when multiple items are selected; {count} is the selection count.',
          translationKey('Heading.UnarchiveItems', TranslationNamespace.Creations),
          countArgs,
        ),
      )
    : pluralize(
        itemCount,
        tPendingTranslation(
          'Archive {count} item',
          'Title of the bulk archive confirmation dialog when exactly one item is selected; {count} is the selection count.',
          translationKey('Heading.ArchiveItemWithCount', TranslationNamespace.Creations),
          countArgs,
        ),
        tPendingTranslation(
          'Archive {count} items',
          'Title of the bulk archive confirmation dialog when multiple items are selected; {count} is the selection count.',
          translationKey('Heading.ArchiveItems', TranslationNamespace.Creations),
          countArgs,
        ),
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
  const unwrapped = useTranslation();
  const { translate, tPendingTranslation } = useTranslationWrapper(unwrapped);
  // Row-menu copy carries no count, so it reads as a single item.
  const selectionCount = itemCount ?? 1;
  const countArgs = { count: selectionCount.toString() };

  const title = getDialogTitle(tPendingTranslation, { isArchived, itemCount });

  const body = isArchived
    ? tPendingTranslation(
        "This item will be restored to your Current tab, but won't be visible to buyers until you put it back on sale.",
        'Body text of the confirmation dialog shown when unarchiving a monetization item.',
        translationKey('Message.UnarchiveItemWarning', TranslationNamespace.Creations),
      )
    : pluralize(
        selectionCount,
        tPendingTranslation(
          'If you archive this item, it will be taken off sale and removed from Managed Pricing.',
          'Body text of the confirmation dialog shown when archiving a monetization item.',
          translationKey('Message.ArchiveItemWarning', TranslationNamespace.Creations),
        ),
        tPendingTranslation(
          'If you archive these items, they will be taken off sale and removed from Managed Pricing.',
          'Body text of the confirmation dialog shown when bulk-archiving monetization items.',
          translationKey('Message.ArchiveItemsWarning', TranslationNamespace.Creations),
        ),
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
        const toastTitle = isArchived
          ? pluralize(
              selectionCount,
              tPendingTranslation(
                'Item unarchived',
                'Toast confirming a monetization item was unarchived.',
                translationKey('Message.ItemUnarchived', TranslationNamespace.Creations),
              ),
              tPendingTranslation(
                '{count} items unarchived',
                'Toast confirming multiple monetization items were unarchived; {count} is the number that succeeded.',
                translationKey('Message.ItemsUnarchived', TranslationNamespace.Creations),
                countArgs,
              ),
            )
          : pluralize(
              selectionCount,
              tPendingTranslation(
                'Item archived',
                'Toast confirming a monetization item was archived.',
                translationKey('Message.ItemArchived', TranslationNamespace.Creations),
              ),
              tPendingTranslation(
                '{count} items archived',
                'Toast confirming multiple monetization items were archived; {count} is the number that succeeded.',
                translationKey('Message.ItemsArchived', TranslationNamespace.Creations),
                countArgs,
              ),
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
          {translate(translationKey('Action.Cancel', TranslationNamespace.Creations))}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export const TranslatedArchiveConfirmationDialogContent = withTranslation(
  ArchiveConfirmationDialogContent,
  [TranslationNamespace.Creations],
);
