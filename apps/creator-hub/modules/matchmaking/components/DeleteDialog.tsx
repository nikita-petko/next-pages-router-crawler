import { Dialog, Typography, Grid, DialogTemplate, Divider } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import React, { Fragment, FunctionComponent, useCallback } from 'react';
import useConfigureAttributesFormStyles from './FormComponents/ConfigureAttributesForm.styles';

export interface DeleteDialogProps {
  isDialogOpen: boolean;
  name: string;
  onClose: () => void;
  onDeleteSuccess: () => void;
}

const DeleteDialog: FunctionComponent<React.PropsWithChildren<DeleteDialogProps>> = ({
  isDialogOpen,
  name,
  onClose,
  onDeleteSuccess,
}) => {
  const {
    classes: { dialogBoxDescription, divider },
  } = useConfigureAttributesFormStyles();
  const { translate } = useTranslation();

  const handleCancel = () => {
    onClose();
  };

  const handleConfirmDeletion = useCallback(async () => {
    onDeleteSuccess();
  }, [onDeleteSuccess]);

  return (
    <Dialog open={isDialogOpen}>
      <DialogTemplate
        color='destructive'
        title={translate('Label.DeleteDialog')}
        cancelText={translate('Action.Cancel')}
        confirmText={translate('Button.YesDelete')}
        onConfirm={handleConfirmDeletion}
        onCancel={handleCancel}
        content={
          <Fragment>
            <Typography variant='h4'>
              {translate('Dialog.DeleteAttribute', {
                attribute: name,
              })}
            </Typography>
            <Divider className={divider} />
            <Grid className={dialogBoxDescription}>
              <Typography variant='body1'>{translate('Message.DeleteAttribute')}</Typography>
            </Grid>
            <Divider />
          </Fragment>
        }
      />
    </Dialog>
  );
};

export default DeleteDialog;
