import React, { FunctionComponent } from 'react';
import { Grid, Link, Typography } from '@rbx/ui';
import { ReturnPolicy, ThumbnailTypes } from '@rbx/thumbnails';
import useThumbnailImage from '@modules/miscellaneous/common/components/ThumbnailImage/useThumbnailImage';
import { urls } from '@modules/miscellaneous/common';

import useIconItemStyles from './IconItem.styles';

export enum IconItemType {
  Asset,
  Group,
  Creator,
}

export type IconItemProps = {
  subText?: string;
  targetId: number;
  text: string;
  type: IconItemType;
};

const {
  creatorHub: { creatorStore },
  www,
} = urls;

const IconItem: FunctionComponent<React.PropsWithChildren<IconItemProps>> = ({
  subText,
  targetId,
  text,
  type,
}) => {
  const { classes: styles } = useIconItemStyles();

  let url = '';
  let thumbnailImageType;
  if (type === IconItemType.Asset) {
    url = creatorStore.getAssetUrl(targetId);
    thumbnailImageType = ThumbnailTypes.assetThumbnail;
  } else if (type === IconItemType.Creator) {
    url = www.getUserUrl(targetId);
    thumbnailImageType = ThumbnailTypes.avatarHeadshot;
  } else if (type === IconItemType.Group) {
    url = www.getGroupUrl(targetId);
    thumbnailImageType = ThumbnailTypes.groupIcon;
  }

  const { thumbnailImage } = useThumbnailImage({
    alt: text,
    returnPolicy: ReturnPolicy.PlaceHolder,
    targetId,
    targetType: thumbnailImageType ?? ThumbnailTypes.assetThumbnail,
  });

  const shouldShowSubText = type === IconItemType.Asset && subText;

  return (
    <Grid container alignItems='center' columnGap={2}>
      <Grid item className={type === IconItemType.Creator ? styles.creatorIcon : styles.assetIcon}>
        {thumbnailImage}
      </Grid>
      <Grid item>
        <Grid container direction='column' justifyContent='space-between'>
          <Grid item>
            <Link color='inherit' href={url} underline='none'>
              <Typography variant='body2'>{text}</Typography>
            </Link>
          </Grid>
          {shouldShowSubText && (
            <Grid item>
              <Typography variant='body2'>{subText}</Typography>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default IconItem;
