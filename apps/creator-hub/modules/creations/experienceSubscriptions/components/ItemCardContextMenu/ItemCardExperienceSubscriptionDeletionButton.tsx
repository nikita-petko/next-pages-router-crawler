import { Fragment, useCallback, useMemo, useEffect } from 'react';
import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Typography,
  useDialog,
  useSnackbar,
} from '@rbx/ui';
import { FormMode, toastDurationTime } from '@modules/miscellaneous/common';
import { experienceSubscriptionsClient } from '@modules/clients';
import { useTranslation, withTranslation } from '@rbx/intl';
import { getResponseFromError } from '@modules/clients/utils';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Controller, useForm } from 'react-hook-form';
import CreationData from '../../../common/interfaces/CreationData';
import parseExperienceSubscriptionErrorCode from '../../utils/parseExperienceSubscriptionErrorCode';
import useSubscriptionFormStyles from '../ExperienceSubscription.styles';

type Props = {
  creation: CreationData;
  removeItem: () => void;
};

function ItemCardExperienceSubscriptionDeletionButton({ creation, removeItem }: Props) {
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const { translate } = useTranslation();
  const { open, close: closeDialog, configure } = useDialog();
  const {
    classes: { createButton },
  } = useSubscriptionFormStyles();

  const { formState, watch, control } = useForm<{
    confirmedId: string;
  }>({
    mode: FormMode.OnTouched,
    reValidateMode: FormMode.OnChange,
    defaultValues: {
      confirmedId: '',
    },
    shouldUnregister: true,
  });

  const { isSubmitting, errors } = formState;
  const confirmedId = watch('confirmedId');

  const showCenterMsg = useCallback(
    (msg: string, isSuccessful: boolean) => {
      enqueue({
        children: <Alert severity={isSuccessful ? 'success' : 'error'}>{msg}</Alert>,
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: closeSnackbar,
      });
    },
    [enqueue, closeSnackbar],
  );

  const deleteExperienceSubscription = useCallback(async () => {
    try {
      const subProductId = creation.subscriptionProductId?.startsWith('EXP-')
        ? creation.subscriptionProductId.substring(4)
        : creation.subscriptionProductId;

      const { success } = await experienceSubscriptionsClient.deleteExperienceSubscription(
        creation.universeId ?? 0,
        subProductId ?? '',
      );
      if (success) {
        removeItem();
        showCenterMsg(translate('Message.SubscriptionDeleted'), success);
      } else {
        showCenterMsg(translate('Message.SubscriptionDeletionError'), false);
      }
    } catch (e) {
      const errorResponse = getResponseFromError(e);
      const { errorKey, serverErrorMessage } =
        await parseExperienceSubscriptionErrorCode(errorResponse);
      showCenterMsg(serverErrorMessage?.trim() ? serverErrorMessage : translate(errorKey), false);
    }
    closeDialog();
  }, [
    creation.universeId,
    creation.subscriptionProductId,
    closeDialog,
    removeItem,
    showCenterMsg,
    translate,
  ]);

  const confirmMakeDeletionDialog = useMemo(() => {
    return (
      <Fragment>
        <DialogTitle>{translate('Heading.DeleteSubscription')}</DialogTitle>
        <DialogContent dividers>
          <Typography color='primary'>
            {translate('Message.DeleteSubscriptionConfirmation')}
          </Typography>
          <br />
          <br />
          <Typography color='primary'>
            {translate('Message.SubscriptionDigitConfirmation', {
              subscriptionName: creation.name ?? '',
            })}
          </Typography>
          <br />
          <br />
          <Controller
            name='confirmedId'
            control={control}
            rules={{
              validate: (field) => {
                return field?.trim() === creation.subscriptionProductId?.slice(-4) || '';
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                error={!!errors.confirmedId}
                fullWidth
                required
                id='confirmedId'
                label={translate('Label.Last4SubscriptionIdDigits')}
                InputProps={{
                  inputProps: {
                    maxLength: 4,
                  },
                }}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Grid item XSmall={12} container direction='row' justifyContent='center'>
            <Button
              variant='outlined'
              color='primary'
              onClick={closeDialog}
              disabled={isSubmitting}
              size='large'>
              {translate('Action.KeepSubscription')}
            </Button>
            <Button
              classes={{ root: createButton }}
              variant='contained'
              color='primaryBrand'
              onClick={deleteExperienceSubscription}
              disabled={confirmedId !== creation.subscriptionProductId?.slice(-4)}
              size='large'
              loading={isSubmitting}>
              {translate('Action.Delete')}
            </Button>
          </Grid>
        </DialogActions>
      </Fragment>
    );
  }, [
    closeDialog,
    confirmedId,
    control,
    createButton,
    creation.name,
    creation.subscriptionProductId,
    deleteExperienceSubscription,
    errors.confirmedId,
    isSubmitting,
    translate,
  ]);

  const handleDialogOpen = useCallback(() => {
    configure(confirmMakeDeletionDialog);
    open();
  }, [configure, confirmMakeDeletionDialog, open]);

  useEffect(() => {
    if (confirmedId && confirmedId.length === 4) {
      configure(confirmMakeDeletionDialog);
      open();
    }
  }, [configure, confirmMakeDeletionDialog, confirmedId, open]);

  return (
    <MenuItem key='Action.Delete' onClick={handleDialogOpen}>
      <Typography color='error'>{translate('Action.Delete')}</Typography>
    </MenuItem>
  );
}

export default withTranslation(ItemCardExperienceSubscriptionDeletionButton, [
  TranslationNamespace.ExperienceSubscriptions,
  TranslationNamespace.Creations,
]);
