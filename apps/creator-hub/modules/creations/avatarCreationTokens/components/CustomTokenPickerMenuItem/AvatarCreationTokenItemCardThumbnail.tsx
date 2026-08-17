import type { FC } from 'react';
import React, { useMemo } from 'react';
import type { Thumbnail2d } from '@rbx/thumbnails';
import { Grid } from '@rbx/ui';
import type { Asset } from '@modules/miscellaneous/common';
import type { BundleType } from '../../../avatarItem/constants/avatarItemConstants';
import type CreationData from '../../../common/interfaces/CreationData';
import { translateBundleInfoTypeToBundleType } from '../../../unifiedFeeSystem/helper/UnifiedFeeSystemHelper';
import { getAvatarCreationTokenIconPath } from '../../utils/getAvatarCreationTokenIconPath';
import useAvatarCreationTokenItemCardThumbnailStyles from '../Styles/AvatarCreationTokenItemCardThumbnail.styles';

type AvatarCreationTokenItemCardThumbnailProps = {
  avatarCreationTokenItem: CreationData;
} & React.ComponentProps<typeof Thumbnail2d>;

const AvatarCreationTokenItemCardThumbnail: FC<
  React.PropsWithChildren<AvatarCreationTokenItemCardThumbnailProps>
> = ({ avatarCreationTokenItem }) => {
  const {
    classes: { thumbnailContainer, imgWrapper, img },
  } = useAvatarCreationTokenItemCardThumbnailStyles();

  const tokenIcon = useMemo(() => {
    // Determine the token type from the item data
    let tokenType: Asset | BundleType | undefined;

    if (avatarCreationTokenItem.assetType) {
      tokenType = avatarCreationTokenItem.assetType;
    } else if (avatarCreationTokenItem.bundleType !== undefined) {
      // Convert the API bundle type to our local BundleType enum
      tokenType = translateBundleInfoTypeToBundleType(avatarCreationTokenItem.bundleType);
    }

    return getAvatarCreationTokenIconPath(tokenType);
  }, [avatarCreationTokenItem.assetType, avatarCreationTokenItem.bundleType]);

  const thumbnailImageComponent = useMemo(() => {
    return (
      <div className={imgWrapper}>
        <img
          src={tokenIcon}
          alt='Avatar Creation Token Thumbnail'
          className={img}
          style={{ height: '50%' }}
        />
      </div>
    );
  }, [imgWrapper, img, tokenIcon]);

  return (
    <Grid item className={thumbnailContainer}>
      {thumbnailImageComponent}
    </Grid>
  );
};

export default AvatarCreationTokenItemCardThumbnail;
