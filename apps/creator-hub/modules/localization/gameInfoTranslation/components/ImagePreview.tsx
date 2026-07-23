import React, { ChangeEvent } from 'react';
import { Grid, Typography, Tooltip, Input, InfoOutlinedIcon } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { maxAltTextLength, characterNumberThreshold } from '../constants';

import useThumbnailImageUploaderStyles from './SaveGameInfoThumbnails.styles';
import useTranslationDetailsStyles from '../../translation/components/TranslationDetails.styles';

export interface ImagePreviewProps {
  src: string | null;
  altText?: string;
  updateAltText: (altText: string) => void;
}

function ImagePreview({ src, altText = '', updateAltText }: ImagePreviewProps) {
  const { translate } = useTranslation();
  const {
    classes: { imagePreviewStyle, imagePreviewContainer },
  } = useThumbnailImageUploaderStyles();

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    const trimmedInput = inputValue.trim();
    let text;
    if (maxAltTextLength - trimmedInput.length >= 0) {
      text = inputValue;
    } else {
      text = trimmedInput.substring(0, maxAltTextLength);
    }
    updateAltText(text);
  };

  const {
    classes: { input, titleWithTooltip },
  } = useTranslationDetailsStyles();

  const selectedImageAltTextLength = altText.length || 0;

  return (
    <Grid container className={imagePreviewContainer}>
      <Grid item justifyContent='center'>
        <img className={imagePreviewStyle} src={src ?? ''} alt={altText} />
      </Grid>
      <Grid container direction='column' item Large={12} XLarge>
        <Grid container direction='row'>
          <Typography className={titleWithTooltip} variant='subtitle2'>
            {translate('Label.AltText')}
          </Typography>
          <Tooltip title={translate('Description.AltText')} placement='top' enterDelay={0}>
            <InfoOutlinedIcon fontSize='small' />
          </Tooltip>
        </Grid>
        <Input
          className={input}
          placeholder={translate('Message.TranslationPlaceholder')}
          value={altText}
          multiline
          fullWidth
          rows={3}
          onChange={handleInputChange}
        />
        <Grid container>
          <Grid item XSmall={12}>
            <Typography
              color={
                selectedImageAltTextLength > maxAltTextLength - characterNumberThreshold
                  ? 'error'
                  : 'secondary'
              }
              variant='captionBody'>
              {maxAltTextLength - selectedImageAltTextLength}{' '}
              {translate('Label.CharactersRemaining')}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default ImagePreview;
