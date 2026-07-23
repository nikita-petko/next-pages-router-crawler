import { FC, useCallback, useMemo } from 'react';
import { Button, Tooltip, useDialog, VideoLibraryIcon } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import {
  FormattedText,
  translationKey,
  useTranslationWrapper,
} from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import YoutubeVideoThumbnailUploadDialog from './YoutubeVideoThumbnailUploadDialog';

type UploadVideoButtonProps = {
  userBalance: number;
  videoThumbnailPrice: number;
  placeId: number;
  userId: number;
  disabled?: boolean;
  tooltip?: FormattedText;
};

const UploadVideoButton: FC<UploadVideoButtonProps> = ({
  userBalance,
  videoThumbnailPrice,
  placeId,
  userId,
  disabled,
  tooltip,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { open, close, configure } = useDialog();
  const { gameDetails } = useCurrentGame();

  const creatorType = gameDetails?.creator?.type;
  const isGroupUpload = creatorType === 'Group';
  const groupId = gameDetails?.creator?.id;

  const uploadDialog = useMemo(
    () => (
      <YoutubeVideoThumbnailUploadDialog
        onClose={close}
        videoThumbnailPrice={videoThumbnailPrice}
        userBalance={userBalance}
        placeId={placeId}
        userId={userId}
        groupId={groupId}
        isGroupUpload={isGroupUpload}
      />
    ),
    [close, placeId, userBalance, userId, videoThumbnailPrice, groupId, isGroupUpload],
  );
  const onClick = useCallback(() => {
    configure(uploadDialog, {
      maxWidth: 'Medium',
    });
    open();
  }, [configure, open, uploadDialog]);

  return (
    <Tooltip title={tooltip} arrow placement='top'>
      {/** Need to wrap Button with a <span> element because
       * Tooltip component does not work on a disabled button with pointer-event: none
       */}
      <span style={{ display: 'inline-block' }}>
        <Button
          onClick={onClick}
          startIcon={<VideoLibraryIcon />}
          color='secondary'
          variant='contained'
          disableRipple
          disabled={videoThumbnailPrice > userBalance || disabled}>
          {translate(translationKey('Label.UploadVideo', TranslationNamespace.PlaceThumbnails))}
        </Button>
      </span>
    </Tooltip>
  );
};

export default UploadVideoButton;
