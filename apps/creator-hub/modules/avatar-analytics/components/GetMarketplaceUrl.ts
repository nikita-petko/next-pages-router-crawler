import type { AvatarItemTargetType } from '@modules/clients/analytics';
import { getUrlForItemType } from '@modules/miscellaneous/urls';
import AvatarItemTargetTypeToUrlItemType from '../utils/AvatarItemTargetTypeToItemType';

// NOTE(shumingxu, 11/14/2023): Deprecated, should just use urls.getUrlForItemType instead
const GetMarketplaceUrl = (
  targetType: AvatarItemTargetType,
  targetId: number,
): string | undefined => {
  return getUrlForItemType(AvatarItemTargetTypeToUrlItemType[targetType], targetId) ?? undefined;
};

export default GetMarketplaceUrl;
