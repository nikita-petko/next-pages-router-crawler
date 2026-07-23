import { BundleType } from '../../avatarItem/constants/avatarItemConstants';

const getBundleTypeToBundleTypeString = (bundleType: string): BundleType => {
  switch (bundleType) {
    case 'Body':
      return BundleType.Body;
    case 'DynamicHead':
      return BundleType.DynamicHead;
    case 'Shoes':
      return BundleType.Shoes;
    case 'AvatarAnimations':
      return BundleType.AvatarAnimations;
    default:
      return BundleType.Unknown;
  }
};

export default getBundleTypeToBundleTypeString;
