import React, { ChangeEvent, FunctionComponent, useRef } from 'react';
import { Alert, IconButton, ImageIcon, useSnackbar } from '@rbx/ui';

import { useTranslation } from '@rbx/intl';

export interface ImageSearchProps {
  onImageSelect: (image: File) => void;
}

/**
 * ImageSearchButton is a button which allows uploading an image and takes in a handler as params.
 * original component "ImageSearch" from creator-marketplace-web repo
 */
const ImageSearchButton: FunctionComponent<React.PropsWithChildren<ImageSearchProps>> = ({
  onImageSelect,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const { translate } = useTranslation();
  const handleFileSelect = () => {
    if (fileInputRef?.current) {
      fileInputRef.current.click();
    }
  };

  // constants copied from creator-marketplace-web
  const bytesPerKB = 1024;
  const bytesPerMB = bytesPerKB * 1024;
  const maxFileSizeMB = 1;
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const image = event?.target?.files && event.target.files[0];
    // Reset the value of the file input field so onChange triggers even if the
    // same image is selected twice
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (image) {
      if (image.size > maxFileSizeMB * bytesPerMB) {
        enqueue(
          {
            message: (
              <Alert variant='filled' severity='error'>
                {translate('Message.ImageTooLarge')}
              </Alert>
            ),
            anchorOrigin: { vertical: 'top', horizontal: 'center' },
            autoHideDuration: 3000,
            autoHide: true,
            onClose: closeSnackbar,
          },
          (reason) => reason === 'timeout',
        );
      } else {
        onImageSelect(image);
      }
    }
  };

  return (
    <IconButton
      color='secondary'
      aria-label='image upload button'
      onClick={handleFileSelect}
      size='small'>
      <ImageIcon />
      <input
        type='file'
        accept='image/png, image/jpeg'
        hidden
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </IconButton>
  );
};

export default ImageSearchButton;
