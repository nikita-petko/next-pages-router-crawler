import React, { useEffect, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import TrackedMenuItem from './TrackedMenuItem';
import LookDeleteDialog from '../../look/components/LookDeleteDialog';

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
    <React.Fragment>
      <TrackedMenuItem onClick={handleClick} itemKey='Action.DeleteLook'>
        {translate('Action.Delete')}
      </TrackedMenuItem>
      <LookDeleteDialog
        lookId={lookId}
        showDeleteLookDialog={showDeleteLookDialog}
        setShowDeleteLookDialog={setShowDeleteLookDialog}
        setDeleteCompleted={setDeleteCompleted}
      />
    </React.Fragment>
  );
};

export default ItemCardDeleteLookButton;
