import React, { FC } from 'react';
import { makeStyles } from '@rbx/ui';
import { useQuery } from '@tanstack/react-query';
import { assetdeliveryClient } from '@modules/clients';
import { Media, MediaType } from '../../types/Media';

const thumbnailWidth = 768;
const thumbnailHeight = 432;
const aspectRatio = thumbnailWidth / thumbnailHeight;

const useStyles = makeStyles()((theme) => {
  return {
    thumbnailInDialog: {
      aspectRatio: `${aspectRatio}`,
      maxHeight: '100%',
      height: thumbnailHeight,
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundColor: theme.palette.surface[200],
    },
  };
});

type MediaPreviewInDialogProps = {
  item: Media & { type: MediaType.Image };
};

const ImagePreviewInDialog: FC<MediaPreviewInDialogProps> = ({ item }) => {
  const {
    classes: { thumbnailInDialog },
  } = useStyles();

  const { id } = item;

  const { data: imageSrc } = useQuery({
    queryKey: ['get-thumbnail-src-for-epd-page', id],
    queryFn: async () => {
      return assetdeliveryClient.getAssets([{ assetId: id, requestId: String(id) }]);
    },
    select: (response) => response[0].location,
    enabled: !!id,
  });

  return (
    <div
      className={thumbnailInDialog}
      style={{
        backgroundImage: `url(${imageSrc})`,
      }}
    />
  );
};

export default ImagePreviewInDialog;
