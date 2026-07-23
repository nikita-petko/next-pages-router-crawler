import React, { FunctionComponent } from 'react';
import { Dialog, DialogContent, DialogTitle, Grid, Typography, CircularProgress } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useSellingPaidModelCopyingModalStyles from './SellingPaidModelCopyingModal.styles';

export type SellingPaidModelCopyingModalProps = {
  open: boolean;
};

const SellingPaidModelCopyingModal: FunctionComponent<
  React.PropsWithChildren<SellingPaidModelCopyingModalProps>
> = ({ open }) => {
  const { translate } = useTranslation();
  const { classes } = useSellingPaidModelCopyingModalStyles();

  return (
    <Dialog open={open} PaperProps={{ classes: { root: classes.dialogPaper } }}>
      <DialogTitle>
        <div className={classes.titleRow}>
          <Typography component='span' variant='h5'>
            {translate('Heading.Copying')}
          </Typography>
          <CircularProgress size={16} />
        </div>
      </DialogTitle>
      <DialogContent classes={{ root: classes.content }}>
        <Grid container direction='column'>
          <Typography variant='body1' classes={{ root: classes.paragraph }}>
            {translate('Description.DeepCopyInProgress')}
          </Typography>
          <Typography variant='body1' component='div' classes={{ root: classes.paragraph }}>
            {translate('Description.KeepDialogOpenWithInventory')}
          </Typography>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default SellingPaidModelCopyingModal;
