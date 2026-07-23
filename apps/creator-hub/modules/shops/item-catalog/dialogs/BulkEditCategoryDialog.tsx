import { useCallback, useMemo, useState } from 'react';
import type { Category } from '@rbx/client-shops-api/v1';
import { Button, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { closeDialog, openDialog } from '@modules/monetization-shared/dialog/actions';
import { Tooltip } from '@modules/monetization-shared/tooltip';
import { ShopCategoryCombobox } from '../../components/ShopCategoryCombobox';
import { MAX_CATEGORY_NAME_LENGTH, MAX_SHOP_CATEGORIES } from '../../constants';
import { findCategoryByName } from '../../utils/categorySelection';

type ConfirmPayload = { type: 'existing'; category: Category } | { type: 'new'; name: string };

type Props = {
  availableCategories: readonly Category[];
  onConfirm: (payload: ConfirmPayload) => void;
  onClose: () => void;
};

function BulkEditCategoryDialogContent({ availableCategories, onConfirm, onClose }: Props) {
  const { translate } = useTranslation();
  const [name, setName] = useState('');
  const [pendingNewCategoryName, setPendingNewCategoryName] = useState<string | undefined>();

  const trimmed = name.trim();
  const matchingCategory = useMemo(
    () => findCategoryByName(availableCategories, trimmed),
    [availableCategories, trimmed],
  );
  const isAtCategoryLimit = availableCategories.length >= MAX_SHOP_CATEGORIES;
  // Save creates a new category whenever the typed name matches no existing one.
  const wouldCreateNewCategory = trimmed.length > 0 && !matchingCategory;
  const isNewCategoryBlocked = isAtCategoryLimit && wouldCreateNewCategory;
  const isSaveDisabled = trimmed.length === 0 || isNewCategoryBlocked;

  const hint = translate('Message.CategoryNameCharacterLimit', {
    limit: MAX_CATEGORY_NAME_LENGTH.toString(),
  });

  const handleValueChange = useCallback(
    (next: string) => {
      setName(next);
      if (pendingNewCategoryName && next.trim() !== pendingNewCategoryName) {
        setPendingNewCategoryName(undefined);
      }
    },
    [pendingNewCategoryName],
  );

  const handleAddCategorySelect = useCallback((trimmedName: string) => {
    // Only one local draft category can be staged in this dialog. If the user
    // picks "Add category" again before Save, this replaces the prior draft name.
    setPendingNewCategoryName(trimmedName);
    setName(trimmedName);
  }, []);

  const handleConfirm = useCallback(() => {
    /* istanbul ignore if -- Save is disabled while empty or blocked; this guard protects programmatic calls. */
    if (isSaveDisabled) {
      return;
    }
    if (matchingCategory) {
      onConfirm({ type: 'existing', category: matchingCategory });
    } else {
      onConfirm({ type: 'new', name: pendingNewCategoryName ?? trimmed });
    }
    onClose();
  }, [isSaveDisabled, matchingCategory, onConfirm, onClose, pendingNewCategoryName, trimmed]);

  return (
    <DialogContent
      className='!min-width-[280px] width-full'
      // Prevent focusing on first input on open
      onOpenAutoFocus={(e) => e.preventDefault()}>
      <DialogBody className='flex flex-col gap-y-xsmall'>
        <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
          {translate('Heading.EditCategory')}
        </DialogTitle>
        <span className='text-body-medium content-default margin-none padding-bottom-medium'>
          {translate('Description.EditCategory')}
        </span>
        <ShopCategoryCombobox
          availableCategories={availableCategories}
          value={name}
          onValueChange={handleValueChange}
          label={translate('Label.CategoryName')}
          placeholder={translate('Label.CategoryName')}
          size='Medium'
          hint={hint}
          onAddCategorySelect={handleAddCategorySelect}
        />
      </DialogBody>
      <DialogFooter className='flex flex-col gap-small small:flex-row'>
        <div className='fill small:basis-0'>
          <Tooltip
            title={translate('Message.MaxCategoriesReached', {
              limit: MAX_SHOP_CATEGORIES.toString(),
            })}
            disabled={!isNewCategoryBlocked}
            addTriggerSlot>
            <Button
              variant='Emphasis'
              size='Medium'
              className='width-full'
              onClick={handleConfirm}
              isDisabled={isSaveDisabled}>
              {translate('Action.Save')}
            </Button>
          </Tooltip>
        </div>
        <Button variant='Standard' size='Medium' className='fill small:basis-0' onClick={onClose}>
          {translate('Action.Cancel')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

const TranslatedBulkEditCategoryDialogContent = withTranslation(BulkEditCategoryDialogContent, [
  TranslationNamespace.PersonalizedShop,
]);

export function openBulkEditCategoryDialog(params: Omit<Props, 'onClose'>) {
  openDialog({
    content: <TranslatedBulkEditCategoryDialogContent {...params} onClose={closeDialog} />,
    options: { shouldUnmountOnClose: true },
  });
}
