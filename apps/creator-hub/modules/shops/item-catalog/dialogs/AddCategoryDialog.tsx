import { useCallback, useMemo, useState, type ChangeEvent } from 'react';
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
  /** Existing category names already in the shop. Compared case-insensitively to block duplicates. */
  existingNames: readonly string[];
  onConfirm: (name: string) => void;
  onClose: () => void;
};

function AddCategoryDialogContent({ existingNames, onConfirm, onClose }: Props) {
  const { translate } = useTranslation();
  const [name, setName] = useState('');

  const existingNameSet = useMemo(
    () => new Set(existingNames.map((existing) => existing.toLowerCase())),
    [existingNames],
  );

  const trimmed = name.trim();
  const isEmpty = trimmed.length === 0;
  const isDuplicate = !isEmpty && existingNameSet.has(trimmed.toLowerCase());
  const isSaveDisabled = isEmpty || isDuplicate;

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
          {translate('Heading.AddCategory')}
        </DialogTitle>
        <span className='text-body-medium content-default margin-none padding-bottom-medium'>
          {translate('Description.AddCategory')}
        </span>
        <TextInput
          label={translate('Label.CategoryName')}
          placeholder={translate('Label.CategoryName')}
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

const TranslatedAddCategoryDialogContent = withTranslation(AddCategoryDialogContent, [
  TranslationNamespace.PersonalizedShop,
]);

// Counter incremented per open so React mounts a fresh instance each time.
let openId = 0;

export function openAddCategoryDialog(params: Omit<Props, 'onClose'>) {
  openId += 1;
  openDialog({
    content: <TranslatedAddCategoryDialogContent key={openId} {...params} onClose={closeDialog} />,
  });
}
