import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { FileCopyOutlinedIcon, IconButton, Tooltip, Typography } from '@rbx/ui';
import useUploadVideoPreviewsFormStyles from './UploadVideoPreviewsForm.styles';

export type VideoDetailsFooterProps = {
  assetId: number;
};

const VideoDetailsFooter = ({ assetId }: VideoDetailsFooterProps) => {
  const {
    classes: { videoDetailsFooter, videoDetailsFooterRow },
  } = useUploadVideoPreviewsFormStyles();

  const { translate } = useTranslation();

  const [isAssetIdCopied, setIsAssetIdCopied] = useState(false);
  const copiedResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const assetIdString = assetId.toString();

  useEffect(() => {
    return () => {
      if (copiedResetTimeout.current) {
        clearTimeout(copiedResetTimeout.current);
      }
    };
  }, []);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(assetIdString).then(() => {
      setIsAssetIdCopied(true);

      // Show tooltip saying "Copied!" above the button for 2 seconds
      if (copiedResetTimeout.current) {
        clearTimeout(copiedResetTimeout.current);
      }
      copiedResetTimeout.current = setTimeout(() => {
        setIsAssetIdCopied(false);
      }, 2000);
    });
  }, [assetIdString]);

  return (
    <div className={videoDetailsFooter} data-testid='video-details-footer'>
      <div className={videoDetailsFooterRow}>
        <Typography variant='body2' color='secondary'>
          {translate('Label.AssetIDWithValue', { assetId: assetIdString })}
        </Typography>

        <Tooltip open={isAssetIdCopied} title={translate('Message.Copied')} arrow placement='top'>
          <IconButton
            aria-label={translate('Action.CopyAssetID')}
            onClick={handleCopy}
            size='small'
            data-testid='asset-id-copy-button'>
            <FileCopyOutlinedIcon color='secondary' fontSize='small' />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
};

export default VideoDetailsFooter;
