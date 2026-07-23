import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, DialogTemplate, Typography, useDialog, useSnackbar } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import GenericBEDEV1Error from '@modules/clients/errors/GenericBEDEV1Error';
import universesClient from '@modules/clients/universes';
import CreationData from '../interfaces/CreationData';
import UniverseAPIErrorCodes from '../enums/UniverseAPIErrorCodes';
import TrackedMenuItem from './TrackedMenuItem';

export interface ItemCardRemovePlacesButtonProps {
  creation: CreationData;
  removeItem: () => void;
  handleClose: () => void;
  isDisabled?: boolean;
}

const ItemCardRemovePlacesButton: FunctionComponent<
  React.PropsWithChildren<ItemCardRemovePlacesButtonProps>
> = ({ creation, removeItem, handleClose, isDisabled }) => {
  const [isRemoving, setIsRemoving] = useState<boolean>(false);
  const { open, close: closeDialog, configure } = useDialog();
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const { translate } = useTranslation();
  const { gameDetails } = useCurrentGame();

  const showSnackbar = useCallback(
    (msg: string, isSuccess: boolean) => {
      if (isSuccess) {
        enqueue({
          message: msg,
          anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
          autoHide: true,
          onClose: closeSnackbar,
        });
      } else {
        enqueue({
          children: <Alert severity='error'>{msg}</Alert>,
          autoHide: true,
          onClose: closeSnackbar,
        });
      }
    },
    [enqueue, closeSnackbar],
  );

  const handleRemoveFromExperience = useCallback(async () => {
    setIsRemoving(true);
    try {
      if (
        typeof creation.universeId === 'undefined' ||
        typeof creation.placeId === 'undefined' ||
        typeof creation.name === 'undefined'
      ) {
        throw new GenericBEDEV1Error(
          UniverseAPIErrorCodes.UnknownError,
          translate('Response.UnknownError'),
        );
      }
      const request = { universeId: creation.universeId, placeId: creation.placeId };
      await universesClient.removePlaceFromUniverse(request);
      removeItem();
      showSnackbar(translate('Message.RemovedSuccess', { placeName: creation.name }), true);
    } catch (error) {
      let errorMsg = translate('Response.UnknownError');
      if (
        error instanceof GenericBEDEV1Error &&
        Object.values(UniverseAPIErrorCodes).includes(error.code)
      ) {
        const errorCode = error.code as UniverseAPIErrorCodes;
        const nameOfError = UniverseAPIErrorCodes[errorCode];
        errorMsg = translate(`Error.${nameOfError}`);
      }
      showSnackbar(errorMsg, false);
    } finally {
      setIsRemoving(false);
      closeDialog();
      handleClose();
    }
  }, [
    closeDialog,
    removeItem,
    creation.name,
    creation.placeId,
    creation.universeId,
    handleClose,
    showSnackbar,
    translate,
  ]);

  const confirmRemoveFromExperienceDialog = useMemo(
    () => (
      <DialogTemplate
        color='destructive'
        onConfirm={handleRemoveFromExperience}
        onCancel={closeDialog}
        title={translate('Title.RemovePlace')}
        content={translate('Description.RemovePlaces', {
          placeName: creation.name ?? '',
          experienceName: gameDetails?.name ?? '',
        })}
        confirmText={translate('Action.Remove')}
        cancelText={translate('Action.Cancel')}
        loading={isRemoving}
      />
    ),
    [
      handleRemoveFromExperience,
      closeDialog,
      translate,
      creation.name,
      gameDetails?.name,
      isRemoving,
    ],
  );

  const handleOpenDialog = useCallback(() => {
    configure(confirmRemoveFromExperienceDialog);
    open();
  }, [configure, open, confirmRemoveFromExperienceDialog]);

  useEffect(() => {
    if (isRemoving) {
      configure(confirmRemoveFromExperienceDialog);
    }
  }, [configure, isRemoving, confirmRemoveFromExperienceDialog]);

  return (
    <TrackedMenuItem
      data-testid='experience-menu-item-remove-place'
      onClick={handleOpenDialog}
      itemKey='Action.RemovePlaces'
      disabled={isDisabled}>
      <Typography>{translate('Action.RemovePlaces')}</Typography>
    </TrackedMenuItem>
  );
};

export default ItemCardRemovePlacesButton;
