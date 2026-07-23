import { AvatarItemTargetType } from '@modules/clients/analytics';
import { Item, urls } from '@modules/miscellaneous/common';

const targetTypeToItem: Record<AvatarItemTargetType, urls.creatorHub.TConfigurableItem> = {
  [AvatarItemTargetType.AssetItem]: Item.CatalogAsset,
  [AvatarItemTargetType.Bundle]: Item.Bundle,
};

const getAvatarItemConfigureUrl = (targetType: AvatarItemTargetType, id: number) => {
  return urls.creatorHub.dashboard.getConfigureItemUrl(id, targetTypeToItem[targetType]);
};

export default getAvatarItemConfigureUrl;
