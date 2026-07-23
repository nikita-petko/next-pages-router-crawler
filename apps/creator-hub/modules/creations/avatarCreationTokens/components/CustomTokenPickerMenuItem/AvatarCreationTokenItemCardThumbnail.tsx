import type { FC } from 'react';
import React, { useMemo } from 'react';
import type { Thumbnail2d } from '@rbx/thumbnails';
import { Grid } from '@rbx/ui';
import { Asset } from '@modules/miscellaneous/common';
import { BundleType } from '../../../avatarItem/constants/avatarItemConstants';
import type CreationData from '../../../common/interfaces/CreationData';
import { translateBundleInfoTypeToBundleType } from '../../../unifiedFeeSystem/helper/UnifiedFeeSystemHelper';
import useAvatarCreationTokenItemCardThumbnailStyles from '../Styles/AvatarCreationTokenItemCardThumbnail.styles';

type AvatarCreationTokenItemCardThumbnailProps = {
  avatarCreationTokenItem: CreationData;
} & React.ComponentProps<typeof Thumbnail2d>;

const TOKEN_TYPE_TO_SVG_MAP: Partial<Record<Asset | BundleType, string>> = {
  [Asset.Hat]: 'hatTokenIcon.svg',
  [Asset.HairAccessory]: 'hairAccessoryTokenIcon.svg',
  [Asset.FaceAccessory]: 'faceAccessoryTokenIcon.svg',
  [Asset.NeckAccessory]: 'neckAccessoryTokenIcon.svg',
  [Asset.ShoulderAccessory]: 'shoulderAccessoryTokenIcon.svg',
  [Asset.FrontAccessory]: 'frontAccessoryTokenIcon.svg',
  [Asset.BackAccessory]: 'backAccessoryTokenIcon.svg',
  [Asset.WaistAccessory]: 'waistAccessoryTokenIcon.svg',
  [Asset.TShirtAccessory]: 'tshirtAccessoryTokenIcon.svg',
  [Asset.ShirtAccessory]: 'shirtAccessoryTokenIcon.svg',
  [Asset.PantsAccessory]: 'pantsAccessoryTokenIcon.svg',
  [Asset.JacketAccessory]: 'jacketAccessoryTokenIcon.svg',
  [Asset.SweaterAccessory]: 'sweaterAccessoryTokenIcon.svg',
  [Asset.ShortsAccessory]: 'shortsAccessoryTokenIcon.svg',
  [Asset.DressSkirtAccessory]: 'pantsAccessoryTokenIcon.svg', // No unique dress skirt accessory, so using pants icon
  [Asset.EyebrowAccessory]: 'eyebrowAccessoryTokenIcon.svg',
  [Asset.EyelashAccessory]: 'eyelashAccessoryTokenIcon.svg',
  [Asset.FaceMakeup]: 'faceMakeupTokenIcon.svg',
  [Asset.LipMakeup]: 'lipMakeupTokenIcon.svg',
  [Asset.EyeMakeup]: 'eyeMakeupTokenIcon.svg',

  [BundleType.Body]: 'bodyTokenIcon.svg',
};

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

    const svgFile = tokenType
      ? (TOKEN_TYPE_TO_SVG_MAP[tokenType] ?? 'tokenicon.svg')
      : 'tokenicon.svg';

    return `${process.env.assetPathPrefix}/avatarCreationTokens/${svgFile}`;
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
