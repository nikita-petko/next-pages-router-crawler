import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { ProductStatusType } from '@rbx/client-developer-subscriptions-api/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Alert,
  DialogTemplate,
  FormControl,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Typography,
  useDialog,
  useSnackbar,
} from '@rbx/ui';
import experienceSubscriptionsClient from '@modules/clients/experienceSubscriptions';
import { toastDurationTime } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type CreationData from '../../../common/interfaces/CreationData';

type Props = {
  creation: CreationData;
  handleClose: () => void;
  updateItem: (item: CreationData) => void;
};

function ItemCardExperienceSubscriptionTakeOffSaleButton({
  creation,
  handleClose,
  updateItem,
}: Props) {
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const { translate } = useTranslation();
  const { open, close: closeDialog, configure } = useDialog();
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [cancelRenewalsRadio, setCancelRenewalsRadio] = useState<boolean>(false);

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

  const handleRadioChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const radioOption = (event.target as HTMLInputElement).value;
    const radioVal = radioOption === 'true';
    setCancelRenewalsRadio(radioVal);
  };

  const deactivateExperienceSubscription = useCallback(
    async (cancelRenewalsVal: boolean) => {
      setIsDeactivating(true);
      const subProductId = creation.subscriptionProductId?.startsWith('EXP-')
        ? creation.subscriptionProductId.slice(4)
        : creation.subscriptionProductId;

      try {
        const { success } = await experienceSubscriptionsClient.deactivateExperienceSubscription(
          creation.universeId ?? 0,
          subProductId ?? '',
          cancelRenewalsVal,
        );
        if (success) {
          const targetStatus = cancelRenewalsVal
            ? ProductStatusType.Inactive
            : ProductStatusType.OffSale;
          updateItem({ ...creation, productStatus: targetStatus });
          showCenterMsg(translate('Message.DeactivateSubscriptionSuccess'), success);
        } else {
          showCenterMsg(translate('Error.UnknownSubscriptionError'), false);
        }
      } catch {
        showCenterMsg(translate('Error.UnknownSubscriptionError'), false);
      }
      setIsDeactivating(false);
      closeDialog();
      handleClose();
    },
    [creation, closeDialog, handleClose, updateItem, showCenterMsg, translate],
  );

  const confirmMakeOffSaleDialog = useMemo(() => {
    return (
      <DialogTemplate
        onConfirm={() => deactivateExperienceSubscription(cancelRenewalsRadio)}
        onCancel={closeDialog}
        title={translate('Heading.SubscriptionOffSale')}
        content={
          <>
            <Typography color='primary'>
              {translate('Description.SubscriptionOffSale', {
                name: creation.name ?? '',
              })}
            </Typography>
            <FormControl>
              <RadioGroup
                name='cancelRenewalsOptions'
                defaultValue='false'
                onChange={handleRadioChange}>
                <FormControlLabel
                  value='false'
                  labelPlacement='end'
                  control={
                    <Radio
                      size='small'
                      color='primary'
                      aria-label={translate('Label.KeepRenewals')}
                    />
                  }
                  label={
                    <Typography variant='captionBody'>{translate('Label.KeepRenewals')}</Typography>
                  }
                />
                <FormControlLabel
                  value='true'
                  labelPlacement='end'
                  control={
                    <Radio
                      size='small'
                      color='primary'
                      aria-label={translate('Label.CancelRenewals')}
                    />
                  }
                  label={
                    <Typography variant='captionBody'>
                      {translate('Label.CancelRenewals')}
                    </Typography>
                  }
                />
              </RadioGroup>
            </FormControl>
          </>
        }
        confirmText={translate('Action.TakeOffSale')}
        cancelText={translate('Action.KeepOnSale')}
        loading={isDeactivating}
      />
    );
  }, [
    deactivateExperienceSubscription,
    closeDialog,
    translate,
    creation.name,
    isDeactivating,
    cancelRenewalsRadio,
  ]);

  const handleDialogOpen = useCallback(() => {
    configure(confirmMakeOffSaleDialog);
    open();
  }, [configure, confirmMakeOffSaleDialog, open]);

  useEffect(() => {
    configure(confirmMakeOffSaleDialog);
  }, [cancelRenewalsRadio, confirmMakeOffSaleDialog, configure]);

  useEffect(() => {
    if (isDeactivating) {
      configure(confirmMakeOffSaleDialog);
    }
  }, [isDeactivating, confirmMakeOffSaleDialog, configure]);

  // If the product is not active, don't show this button
  if (creation.productStatus !== ProductStatusType.Active) {
    return null;
  }

  return (
    <MenuItem key='Action.TakeOffSale' onClick={handleDialogOpen}>
      <Typography>{translate('Action.TakeOffSale')}</Typography>
    </MenuItem>
  );
}

export default withTranslation(ItemCardExperienceSubscriptionTakeOffSaleButton, [
  TranslationNamespace.ExperienceSubscriptions,
  TranslationNamespace.Creations,
]);
