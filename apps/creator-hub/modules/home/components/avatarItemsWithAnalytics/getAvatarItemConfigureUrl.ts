import { AvatarItemTargetType } from '@modules/clients/analytics';
import { Item } from '@modules/miscellaneous/common';
import { creatorHub } from '@modules/miscellaneous/urls';

const targetTypeToItem: Record<AvatarItemTargetType, creatorHub.TConfigurableItem> = {
  [AvatarItemTargetType.AssetItem]: Item.CatalogAsset,
  [AvatarItemTargetType.Bundle]: Item.Bundle,
};

const getAvatarItemConfigureUrl = (targetType: AvatarItemTargetType, id: number) => {
  return creatorHub.dashboard.getConfigureItemUrl(id, targetTypeToItem[targetType]);
};

export default getAvatarItemConfigureUrl;
