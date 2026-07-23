import { Asset } from '@modules/miscellaneous/common';
import { V2CloudProtos } from '@rbx/open-cloud';
import { BundleType } from '../../avatarItem/constants/avatarItemConstants';

export type TAvatarCreationToken = {
  displayInformation: TAvatarCreationTokenDispayInformation;
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

export type TAvatarCreationTokenDispayInformation = {
  name: string;
  description: string;
  itemType: Asset | BundleType | null;
};

export type TItemTypeMetadata = {
  displayName: string;
};

export const defaultPricingPolicy: V2CloudProtos.AvatarCreationToken.IPricingPolicy = {};
