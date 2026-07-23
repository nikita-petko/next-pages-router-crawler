import { AvatarItemTargetType } from '@modules/clients/analytics';
import { urls } from '@modules/miscellaneous/common';
import AvatarItemTargetTypeToUrlItemType from '../utils/AvatarItemTargetTypeToItemType';

// NOTE(shumingxu, 11/14/2023): Deprecated, should just use urls.getUrlForItemType instead
const GetMarketplaceUrl = (
  targetType: AvatarItemTargetType,
  targetId: number,
): string | undefined => {
  return (
    urls.getUrlForItemType(AvatarItemTargetTypeToUrlItemType[targetType], targetId) ?? undefined
  );
};

export default GetMarketplaceUrl;
