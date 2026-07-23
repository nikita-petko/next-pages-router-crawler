import { MonetizationDetailType as MonetizationAPIDetailType } from '@rbx/clients/developerAnalyticsAggregations/v1';
import { ItemMonetizationProductTypes, MonetizationProductTypes } from './monetizationProductTypes';

// NOTE(shumingxu, 11/14/2023): Needed due to details request using a different set of limited enums.
// This allows FE components to use the same enum as the monetization metrics request
// and let the client convert it at request-time using this record.
const ItemMonetizationProductTypesToDetailType: Record<
  ItemMonetizationProductTypes,
  MonetizationAPIDetailType
> = {
  [MonetizationProductTypes.GameshopItem]: MonetizationAPIDetailType.DevProduct,
  [MonetizationProductTypes.GamePass]: MonetizationAPIDetailType.GamePass,
  [MonetizationProductTypes.AffiliateFeeAvatar]: MonetizationAPIDetailType.AvatarCommission,
};

export default ItemMonetizationProductTypesToDetailType;
