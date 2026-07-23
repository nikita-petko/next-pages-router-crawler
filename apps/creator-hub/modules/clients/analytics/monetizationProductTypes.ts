export enum MonetizationProductTypes {
  Total = 'Total',
  GamePass = 'GamePass',
  PrivateServer = 'PrivateServer',
  GameshopItem = 'GameshopItem', // NOTE(shumingxu, 11/14/2023): Legacy name for dev products
  PayToPlay = 'PayToPlay',
  AffiliateFeeGamePass = 'AffiliateFeeGamePass',
  AffiliateFeeAvatar = 'AffiliateFeeAvatar',
  // NOTE(shumingxu, 11/14/2023): AffiliateFee (total) will be removed so not included here
}

// Supported product types for item monetization
export type ItemMonetizationProductTypes =
  | MonetizationProductTypes.GameshopItem
  | MonetizationProductTypes.GamePass
  | MonetizationProductTypes.AffiliateFeeAvatar;
