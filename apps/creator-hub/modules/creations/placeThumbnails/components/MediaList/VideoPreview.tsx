import React, { FC, useCallback } from 'react';
import { Button, useDialog } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useMediaListStyles from './MediaList.styles';
import { Media, MediaType } from '../../types/Media';

const VideoPreview: FC<{ item: Media & { type: MediaType.Video } }> = ({ item }) => {
  const {
    classes: { preview, videoIFramePreview },
    cx,
  } = useMediaListStyles();
  const { translate } = useTranslation();
  const { videoHash, videoTitle } = item;
  const videoThumbnailUrl = `https://img.youtube.com/vi/${videoHash}/0.jpg`;

  const { configure, open } = useDialog();
  const onClick = useCallback(() => {
    configure(
      <iframe
        className={cx(videoIFramePreview, preview)}
        src={`https://www.youtube-nocookie.com/embed/${videoHash}`}
        frameBorder='0'
        allow='autoplay; encrypted-media'
        title={`${videoTitle} ${translate('Label.VideoPreview')}`}
      />,
    );
    open();
  }, [configure, cx, open, preview, translate, videoHash, videoIFramePreview, videoTitle]);

  return (
    <Button
      disableRipple
      onClick={onClick}
      role='img'
      style={{
        backgroundImage: `url(${videoThumbnailUrl})`,
        backgroundColor: 'transparent',
        padding: 0,
        borderRadius: 0,
      }}
      classes={{ root: preview }}
    />
  );
};

export default VideoPreview;
