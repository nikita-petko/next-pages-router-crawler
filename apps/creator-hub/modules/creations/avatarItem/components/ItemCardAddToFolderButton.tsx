import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import TrackedMenuItem from '../../common/components/TrackedMenuItem';
import type CreationData from '../../common/interfaces/CreationData';
import AddItemToFolderModal from './AddItemToFolderModal';

export interface ItemCardAddToFolderButtonProps {
  creation: CreationData;
  handleClose: () => void;
}

const ItemCardAddToFolderButton: FunctionComponent<
  React.PropsWithChildren<ItemCardAddToFolderButtonProps>
> = ({ creation, handleClose }) => {
  const { translate } = useTranslation();
  const currentGroup = useCurrentGroup();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    handleClose();
  }, [handleClose]);

  return (
    <>
      <TrackedMenuItem onClick={() => setIsModalOpen(true)} itemKey='Action.AddToFolder'>
        {translate('Action.AddToFolder')}
      </TrackedMenuItem>
      <AddItemToFolderModal
        open={isModalOpen}
        onClose={handleModalClose}
        creation={creation}
        groupId={currentGroup?.id}
      />
    </>
  );
};

export default ItemCardAddToFolderButton;
