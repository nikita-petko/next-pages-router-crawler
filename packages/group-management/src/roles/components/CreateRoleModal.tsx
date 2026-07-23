import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  TextInput,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import TranslationNamespace from '../../constants/TranslationNamespace';
import { useGetGroupConfigurationMetadata } from '../../queries/rolesQueries';
import { DefaultRoleNameMaxLength } from '../../utils/constants';

export type CreateRoleModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string) => Promise<void>;
  saving?: boolean;
};

const CreateRoleModal: FunctionComponent<CreateRoleModalProps> = ({
  open,
  onClose,
  onConfirm,
  saving = false,
}) => {
  const { translateWithNamespace } = useTranslation();
  const { data: configMetadata } = useGetGroupConfigurationMetadata();
  const roleConfig = configMetadata?.roleConfiguration;
  const nameMaxLength = roleConfig?.nameMaxLength ?? DefaultRoleNameMaxLength;

  const [name, setName] = useState('');

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setName('');
    }
  }

  const isCreateDisabled = !name.trim() || saving;

  const handleCreate = useCallback(async () => {
    if (isCreateDisabled) {
      return;
    }
    await onConfirm(name.trim());
  }, [isCreateDisabled, onConfirm, name]);

  const onNameChanged = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
      isModal
      size='Medium'
      hasCloseAffordance
      closeLabel={translateWithNamespace(TranslationNamespace.GroupManagement, 'Action.Close')}>
      <DialogContent>
        <DialogBody className='flex flex-col gap-medium'>
          <DialogTitle className='text-heading-small margin-none'>
            {translateWithNamespace(TranslationNamespace.GroupManagement, 'Heading.CreateRole')}
          </DialogTitle>
          <div className='flex flex-col gap-small'>
            <div>
              <TextInput
                label={translateWithNamespace(
                  TranslationNamespace.GroupManagement,
                  'Label.RoleName',
                )}
                maxLength={nameMaxLength}
                value={name}
                isDisabled={saving}
                onChange={onNameChanged}
              />
              <span className='block text-caption-medium text-align-x-end'>
                {name.length}/{nameMaxLength}
              </span>
            </div>
          </div>
        </DialogBody>
        <DialogFooter className='flex width-full gap-x-small'>
          <Button
            variant='Emphasis'
            size='Medium'
            isDisabled={isCreateDisabled}
            isLoading={saving}
            className='grow-1'
            onClick={handleCreate}>
            {translateWithNamespace(TranslationNamespace.GroupManagement, 'Action.Create')}
          </Button>
          <Button
            variant='Standard'
            size='Medium'
            isDisabled={saving}
            className='grow-1'
            onClick={onClose}>
            {translateWithNamespace(TranslationNamespace.GroupManagement, 'Action.Cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoleModal;
