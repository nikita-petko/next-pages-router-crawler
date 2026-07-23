import { useQueryClient } from '@tanstack/react-query';
import type { FC } from 'react';
import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  DialogTemplate,
  IconButton,
  Menu,
  MenuItem,
  MoreVertIcon,
  Tooltip,
  Typography,
  useDialog,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import useDisassociateAssetFromPlaceMutation from '../../hooks/useDisassociateAssetFromPlaceMutation';
import { getPlaceMediaQueryKey } from '../../hooks/useGetPlaceMediaQuery';
import type { Media } from '../../types/Media';
import { MediaType } from '../../types/Media';
import AltTextEditDialog from './AltTextEditDialog';

type MediaListItemOptionMenuButtonProps = {
  mediaItem: Media;
  placeId: number;
  isAssetUploading: boolean;
};

const MediaListItemOptionMenuButton: FC<MediaListItemOptionMenuButtonProps> = ({
  mediaItem,
  placeId,
  isAssetUploading,
}) => {
  const { gameDetails } = useCurrentGame();
  const { translate } = useTranslationWrapper(useTranslation());
  const queryClient = useQueryClient();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const buttonClick = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);
  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  const { configure, open: openDialog, close: closeDialog } = useDialog();
  const onSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getPlaceMediaQueryKey(placeId) });
    closeDialog();
  }, [closeDialog, placeId, queryClient]);
  const { disassociateAssetFromPlace, isUpdating } = useDisassociateAssetFromPlaceMutation(
    placeId,
    onSuccess,
  );

  const confirmDeleteDialog = useMemo(() => {
    return (
      <DialogTemplate
        variant='alert'
        loading={isUpdating}
        title={translate(
          translationKey('Label.DeleteThumbnail', TranslationNamespace.PlaceThumbnails),
        )}
        content={translate(
          translationKey('Label.ConfirmDeleteThumbnail', TranslationNamespace.PlaceThumbnails),
        )}
        cancelText={translate(translationKey('Label.Cancel', TranslationNamespace.PlaceThumbnails))}
        confirmText={translate(
          translationKey('Label.YesDelete', TranslationNamespace.PlaceThumbnails),
        )}
        onCancel={closeDialog}
        onConfirm={() => {
          disassociateAssetFromPlace(mediaItem.id);
        }}
      />
    );
  }, [closeDialog, disassociateAssetFromPlace, isUpdating, mediaItem.id, translate]);

  const onOptionSelect = useCallback(
    (e: React.MouseEvent<HTMLLIElement>) => {
      const value = e.currentTarget.getAttribute('value');
      if (value === 'delete') {
        configure(confirmDeleteDialog);
        openDialog();
      } else if (value === 'edit-alttext') {
        configure(
          <AltTextEditDialog mediaItem={mediaItem} onCancel={closeDialog} placeId={placeId} />,
        );
        openDialog();
      }
      closeMenu();
    },
    [closeDialog, closeMenu, configure, confirmDeleteDialog, mediaItem, openDialog, placeId],
  );

  const isRootPlace = gameDetails?.rootPlaceId === placeId;
  const disableEditAltText = !isRootPlace || mediaItem.type !== MediaType.Image;

  return (
    <>
      <Tooltip
        title={
          isAssetUploading
            ? translate(
                translationKey('Label.WaitTilUploadFinishes', TranslationNamespace.PlaceThumbnails),
              )
            : undefined
        }>
        <span>
          <IconButton
            aria-label='more-option'
            color='inherit'
            onClick={buttonClick}
            ref={buttonRef}
            disabled={isAssetUploading}>
            <MoreVertIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Menu
        open={open}
        anchorEl={buttonRef.current}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <MenuItem
          value='edit-alttext'
          onClick={onOptionSelect}
          disableRipple
          disabled={disableEditAltText}>
          <Tooltip
            title={
              disableEditAltText
                ? translate(
                    translationKey(
                      'Description.NoAltTextAllowed',
                      TranslationNamespace.PlaceThumbnails,
                    ),
                  )
                : undefined
            }>
            <Typography>
              {translate(
                translationKey('Action.EditAltText', TranslationNamespace.PlaceThumbnails),
              )}
            </Typography>
          </Tooltip>
        </MenuItem>
        <MenuItem value='delete' onClick={onOptionSelect} disableRipple>
          <Typography color='error'>
            {translate(translationKey('Action.Delete', TranslationNamespace.Controls))}
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default MediaListItemOptionMenuButton;
