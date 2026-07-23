import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Dialog, DialogTemplate, Divider, Grid, RobuxIcon, Typography, makeStyles } from '@rbx/ui';

/** Minimum width shared by the presave and restock confirmation dialogs. */
export const CONFIRM_DIALOG_MIN_WIDTH = '580px';

const useStyles = makeStyles()((theme) => ({
  container: {
    minWidth: CONFIRM_DIALOG_MIN_WIDTH,
    padding: '0 10px 10px 10px',
    color: theme.palette.mode === 'light' ? 'black' : 'white',
  },
  title: {
    fontSize: '20px',
    fontWeight: '450',
    textAlign: 'center',
  },
  divider: {
    margin: '24px 0',
  },
  label: {
    fontSize: '14px',
    fontWeight: '400',
  },
  value: {
    color: theme.palette.content.muted,
  },
  robuxIcon: {
    verticalAlign: 'text-bottom',
  },
}));

interface RestockConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  quantity?: number;
  originalQuantity?: number;
  restockingFee?: number;
}

function RestockConfirmDialog({
  open,
  onConfirm,
  onCancel,
  quantity,
  originalQuantity,
  restockingFee,
}: RestockConfirmDialogProps) {
  const { translate } = useTranslation();
  const { classes } = useStyles();

  return (
    <Dialog open={open}>
      <DialogTemplate
        onConfirm={onConfirm}
        onCancel={onCancel}
        title=''
        content={
          <div className={classes.container}>
            <Typography className={classes.title}>{translate('Label.ConfirmRestock')}</Typography>
            <Divider className={classes.divider} />
            <Typography>{translate('Message.RestockWarning')}</Typography>

            <Grid container item XSmall={12} alignItems='center' padding='16px'>
              <Grid item XSmall={6}>
                <Typography className={classes.label}>
                  {translate('Label.AdditionalQuantity')}
                </Typography>
              </Grid>
              <Grid item XSmall={6}>
                <Typography variant='body2' className={classes.value}>
                  {quantity && originalQuantity ? quantity - originalQuantity : 0}
                </Typography>
              </Grid>
            </Grid>
            <Divider />

            <Grid container item XSmall={12} alignItems='center' padding='16px'>
              <Grid item XSmall={6}>
                <Typography className={classes.label}>
                  {translate('Label.NewTotalQuantity')}
                </Typography>
              </Grid>
              <Grid item XSmall={6}>
                <Typography variant='body2' className={classes.value}>
                  {quantity}
                </Typography>
              </Grid>
            </Grid>
            <Divider />

            <Grid container item XSmall={12} alignItems='center' padding='16px'>
              <Grid item XSmall={6}>
                <Typography className={classes.label}>
                  {translate('Label.RestockingFeeModalContent')}
                </Typography>
              </Grid>
              <Grid item XSmall={6}>
                <Typography variant='body2' className={classes.value}>
                  {restockingFee !== undefined ? (
                    <>
                      <RobuxIcon fontSize='small' className={classes.robuxIcon} />{' '}
                      {restockingFee.toLocaleString()}
                    </>
                  ) : (
                    translate('Label.Calculating')
                  )}
                </Typography>
              </Grid>
            </Grid>
          </div>
        }
        confirmText={translate('Action.ConfirmRestock')}
        cancelText={translate('Action.Cancel')}
      />
    </Dialog>
  );
}

export default RestockConfirmDialog;
