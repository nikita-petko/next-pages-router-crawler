import { useCallback, useMemo, useState, type ChangeEvent } from 'react';
import type { Category } from '@rbx/client-shops-api/v1';
import {
  Button,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  TextInput,
} from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { closeDialog, openDialog } from '@modules/monetization-shared/dialog/actions';
import { MAX_CATEGORY_NAME_LENGTH } from '../../constants';

type Props = {
  category: Category;
  /**
   * Other category names already in the shop. Must NOT include `category.name`
   * (callers strip it) so the user can keep the same name without tripping the
   * duplicate check. Compared case-insensitively.
   */
  existingNames: readonly string[];
  onConfirm: (newName: string) => void;
  onClose: () => void;
};

function RenameCategoryDialogContent({ category, existingNames, onConfirm, onClose }: Props) {
  const { translate } = useTranslation();
  const [name, setName] = useState(category.name);

  const existingNameSet = useMemo(
    () => new Set(existingNames.map((existing) => existing.toLowerCase())),
    [existingNames],
  );

  const trimmed = name.trim();
  const isUnchanged = trimmed === category.name;
  const isEmpty = trimmed.length === 0;
  const isDuplicate = !isEmpty && !isUnchanged && existingNameSet.has(trimmed.toLowerCase());
  const isSaveDisabled = isEmpty || isUnchanged || isDuplicate;

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  }, []);

  const handleConfirm = useCallback(() => {
    if (isSaveDisabled) {
      return;
    }
    onConfirm(trimmed);
    onClose();
  }, [isSaveDisabled, onConfirm, trimmed, onClose]);

  return (
    <DialogContent className='!min-width-[280px] width-full'>
      <DialogBody className='flex flex-col gap-y-xsmall'>
        <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
          {translate('Heading.RenameCategory')}
        </DialogTitle>
        <span className='text-body-medium content-default margin-none padding-bottom-medium'>
          {translate('Description.RenameCategory')}
        </span>
        <TextInput
          label={translate('Label.CategoryName')}
          value={name}
          onChange={handleChange}
          size='Medium'
          variant='Standard'
          maxLength={MAX_CATEGORY_NAME_LENGTH}
          error={isDuplicate ? translate('Message.DuplicateCategoryName') : undefined}
          helperText={translate('Message.CategoryNameCharacterLimit', {
            limit: MAX_CATEGORY_NAME_LENGTH.toString(),
          })}
        />
      </DialogBody>
      <DialogFooter className='flex flex-col gap-small small:flex-row'>
        <Button
          variant='Emphasis'
          size='Medium'
          className='fill small:basis-0'
          onClick={handleConfirm}
          isDisabled={isSaveDisabled}>
          {translate('Action.Save')}
        </Button>
        <Button variant='Standard' size='Medium' className='fill small:basis-0' onClick={onClose}>
          {translate('Action.Cancel')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

const TranslatedRenameCategoryDialogContent = withTranslation(RenameCategoryDialogContent, [
  TranslationNamespace.PersonalizedShop,
]);

export function openRenameCategoryDialog(params: Omit<Props, 'onClose'>) {
  openDialog({
    content: <TranslatedRenameCategoryDialogContent {...params} onClose={closeDialog} />,
    options: { shouldUnmountOnClose: true },
  });
}
