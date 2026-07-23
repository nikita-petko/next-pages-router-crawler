import React, { useCallback } from 'react';
import { Typography, Dialog, DialogContentText, DialogTemplate } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { Item as ItemType } from '@modules/miscellaneous/common';
import { getPublishPageUrl } from '../../unifiedFeeSystem/helper/UnifiedFeeSystemHelper';

interface AddVariantDialogProps {
  showAddVariantDialog: boolean;
  setShowAddVariantDialog: (show: boolean) => void;
  itemType: ItemType;
  itemId: number;
}

function AddVariantDialog(props: AddVariantDialogProps) {
  const { showAddVariantDialog, setShowAddVariantDialog, itemType, itemId } = props;
  const { translate } = useTranslation();

  const toPublishPage = useCallback(async () => {
    setShowAddVariantDialog(false);
    window.location.href = getPublishPageUrl(itemType, itemId);
  }, [setShowAddVariantDialog, itemType, itemId]);

  return (
    <Dialog onClose={() => setShowAddVariantDialog(false)} open={showAddVariantDialog}>
      <DialogTemplate
        onConfirm={toPublishPage}
        confirmText={translate('Action.Continue')}
        onCancel={() => setShowAddVariantDialog(false)}
        cancelText={translate('Action.Cancel')}
        title='Lorem ipsum' // TODO @mryumae: replace with translation
        content={
          <DialogContentText>
            {/* TODO @mryumae: replace with translation */}
            <Typography variant='body1'>Lorem ipsum</Typography>
          </DialogContentText>
        }
      />
    </Dialog>
  );
}

export default AddVariantDialog;
