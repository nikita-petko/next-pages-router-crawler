import { Asset } from '@modules/miscellaneous/common';
import { BundleType } from '../../avatarItem/constants/avatarItemConstants';

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

export const getAvatarCreationTokenIconPath = (tokenType?: Asset | BundleType): string => {
  const svgFile = tokenType
    ? (TOKEN_TYPE_TO_SVG_MAP[tokenType] ?? 'tokenicon.svg')
    : 'tokenicon.svg';

  return `${process.env.assetPathPrefix}/avatarCreationTokens/${svgFile}`;
};
