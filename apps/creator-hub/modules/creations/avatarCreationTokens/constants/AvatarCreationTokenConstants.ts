import type { Asset } from '@modules/miscellaneous/common';
import type { AvatarCreationTokenPricingPolicy } from '@modules/react-query/openCloudAvatarCreationTokens/openCloudAvatarCreationTokensRequests';
import type { BundleType } from '../../avatarItem/constants/avatarItemConstants';

export type TAvatarCreationToken = {
  displayInformation: TAvatarCreationTokenDisplayInformation;
  saleInformation: TAvatarCreationTokenSaleInformation;
};

export const DefaultAvatarCreationToken: TAvatarCreationToken = {
  displayInformation: {
    name: '',
    description: '',
    itemType: null,
  },
  saleInformation: {
    priceOffset: undefined,
    minimumPrice: undefined,
  },
};

export type TAvatarCreationTokenSaleInformation = {
  priceOffset: number | undefined;
  minimumPrice: number | undefined;
};

export type TAvatarCreationTokenDisplayInformation = {
  name: string;
  description: string;
  itemType: Asset | BundleType | null;
};

export type TItemTypeMetadata = {
  displayName: string;
};

export const defaultPricingPolicy: AvatarCreationTokenPricingPolicy = {};
