import type { FC } from 'react';
import React, { useState, useCallback } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useUpdateAltTextForPlaceMutation from '../../hooks/useUpdateThumbnalsAltTextForPlaceMutation';
import type { Media } from '../../types/Media';

type AltTextEditDialogProps = {
  placeId: number;
  mediaItem: Media;
  onCancel: () => void;
};

const AltTextEditDialog: FC<AltTextEditDialogProps> = ({ placeId, mediaItem, onCancel }) => {
  const { translate } = useTranslationWrapper(useTranslation());

  const [altText, setAltText] = useState<string | undefined>(mediaItem.altText);
  const onTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAltText(e.target.value);
  }, []);

  const onUpdateSuccess = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const { updateThumbnailAltTextForPlace, isUpdating } =
    useUpdateAltTextForPlaceMutation(onUpdateSuccess);
  const onUpdate = useCallback(() => {
    updateThumbnailAltTextForPlace({
      placeId,
      assetId: mediaItem.id.toString(),
      altText: altText ?? '',
    });
  }, [altText, mediaItem.id, placeId, updateThumbnailAltTextForPlace]);

  return (
    <div>
      <DialogTitle>
        {translate(translationKey('Label.AltText', TranslationNamespace.PlaceThumbnails))}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id='dialog-content-text-describe-id' marginBottom='20px'>
          {translate(translationKey('Description.AltText', TranslationNamespace.PlaceThumbnails))}
        </DialogContentText>
        <TextField
          label={translate(translationKey('Label.AltText', TranslationNamespace.PlaceThumbnails))}
          id='altTextField'
          onChange={onTextChange}
          disabled={isUpdating}
          value={altText}
          fullWidth
          multiline
          minRows={4}
          maxRows={10}
        />
      </DialogContent>
      <DialogActions>
        <Button
          size='large'
          variant='outlined'
          aria-label='cancel'
          color='secondary'
          onClick={onCancel}
          disabled={isUpdating}>
          {translate(translationKey('Action.Cancel', TranslationNamespace.Controls))}
        </Button>
        <Button
          size='large'
          variant='contained'
          aria-label='save'
          color='primaryBrand'
          loading={isUpdating}
          onClick={onUpdate}>
          {translate(translationKey('Action.Save', TranslationNamespace.Controls))}
        </Button>
      </DialogActions>
    </div>
  );
};

export default withTranslation(AltTextEditDialog, [
  TranslationNamespace.Controls,
  TranslationNamespace.PlaceThumbnails,
  TranslationNamespace.Analytics,
  TranslationNamespace.Error,
]);
