import React, { FunctionComponent, useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  TextField,
  Typography,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useSellingPaidModelCopyModalStyles from './SellingPaidModelCopyModal.styles';

const MAX_DEEP_COPY_MODEL_NAME_LENGTH = 50;

export type SellingPaidModelCopyModalProps = {
  open: boolean;
  defaultModelName?: string;
  onCancel: () => void;
  onStartCopy: (modelName: string) => void;
};

const SellingPaidModelCopyModal: FunctionComponent<
  React.PropsWithChildren<SellingPaidModelCopyModalProps>
> = ({ open, defaultModelName, onCancel, onStartCopy }) => {
  const { translate } = useTranslation();
  const { classes } = useSellingPaidModelCopyModalStyles();
  const [name, setName] = useState<string>('');
  const placeholder = useMemo(
    () => `[${defaultModelName ?? translate('Placeholder.ModelName')}]`,
    [defaultModelName, translate],
  );

  return (
    <Dialog open={open} PaperProps={{ classes: { root: classes.dialogPaper } }}>
      <DialogTitle classes={{ root: classes.title }}>{translate('Heading.CopyModel')}</DialogTitle>
      <DialogContent classes={{ root: classes.content }}>
        <Grid container direction='column'>
          <Typography variant='h6' classes={{ root: classes.fieldLabel }}>
            {translate('Label.NewModelName')}
          </Typography>
          <TextField
            fullWidth
            id='newModelName'
            label=''
            placeholder={placeholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            classes={{ root: classes.field }}
            inputProps={{ maxLength: MAX_DEEP_COPY_MODEL_NAME_LENGTH }}
          />
          <Typography variant='body1' classes={{ root: classes.intro }}>
            {translate('Description.DeepCopyIntroWithInventory')}
          </Typography>
          <Typography variant='body1' color='secondary' classes={{ root: classes.disclaimer }}>
            {translate('Description.DeepCopyDisclaimer')}
          </Typography>
          <Divider classes={{ root: classes.divider }} />
        </Grid>
      </DialogContent>
      <DialogActions classes={{ root: classes.actions }}>
        <Button color='secondary' variant='outlined' onClick={onCancel}>
          {translate('Action.Cancel')}
        </Button>
        <Button variant='contained' onClick={() => onStartCopy(name)}>
          {translate('Action.StartCopy')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SellingPaidModelCopyModal;
