import { AvatarItemTargetType } from '@modules/clients/analytics';
import { Item } from '@modules/miscellaneous/common';

const AvatarItemTargetTypeToUrlItemType: Record<AvatarItemTargetType, Item> = {
  [AvatarItemTargetType.AssetItem]: Item.CatalogAsset,
  [AvatarItemTargetType.Bundle]: Item.Bundle,
};

export default AvatarItemTargetTypeToUrlItemType;
