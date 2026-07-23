import React, { useEffect, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import LookDeleteDialog from '../../look/components/LookDeleteDialog';
import TrackedMenuItem from './TrackedMenuItem';

export interface ItemCardDeleteLookButtonProps {
  lookId: string;
}

const ItemCardDeleteLookButton: React.FunctionComponent<
  React.PropsWithChildren<ItemCardDeleteLookButtonProps>
> = ({ lookId }) => {
  const [showDeleteLookDialog, setShowDeleteLookDialog] = useState(false);
  const [deleteCompleted, setDeleteCompleted] = useState<boolean | null>(null);
  const { translate } = useTranslation();
  const handleClick = () => {
    setShowDeleteLookDialog(true);
  };

  useEffect(() => {
    if (deleteCompleted) {
      window.location.reload();
    }
  }, [deleteCompleted, showDeleteLookDialog]);

  if (!lookId) {
    return null;
  }

  return (
    <>
      <TrackedMenuItem onClick={handleClick} itemKey='Action.DeleteLook'>
        {translate('Action.Delete')}
      </TrackedMenuItem>
      <LookDeleteDialog
        lookId={lookId}
        showDeleteLookDialog={showDeleteLookDialog}
        setShowDeleteLookDialog={setShowDeleteLookDialog}
        setDeleteCompleted={setDeleteCompleted}
      />
    </>
  );
};

export default ItemCardDeleteLookButton;
