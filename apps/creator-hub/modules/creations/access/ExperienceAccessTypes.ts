import { DevicesType, FiatProductModerationStatus } from '@modules/clients/develop';

export enum AccessType {
  Friends = 'Friends',
  Public = 'Public',
}

export enum GroupAccessType {
  GroupMembers = 'Group Members',
}

export enum Privacy {
  Private = 'Private',
  Public = 'Public',
}

export enum AgeRestrictionType {
  AllAges = '0',
  NinePlus = '9',
  ThirteenPlus = '13',
  EighteenPlus = '18',
}

export type DevicesTypeForm = {
  [DevicesType.Computer]: boolean;
  [DevicesType.Console]: boolean;
  [DevicesType.Phone]: boolean;
  [DevicesType.Tablet]: boolean;
  [DevicesType.Vr]: boolean;
};

export type ExperienceAccessFormType = {
  accessType: AccessType;
  isForSale: boolean;
  paymentType: PaymentType;
  price?: number;
  fiatBasePriceId?: string;
  devices: DevicesTypeForm;
  isPrivateServersAllowed: boolean;
  isPrivateServerForSale?: boolean;
  privateServerPrice?: number;
  isSpecificJoinToNonRootPlacesAllowed: boolean;
  hasPlaceOverrides: boolean;
  placeJoinRestrictionType: PlaceJoinRestrictionType;
  privacy?: Privacy;
  minimumAge?: string;
  restrictedCountries?: string[];
};

export type UniverseAccessConfiguration = Omit<
  ExperienceAccessFormType,
  'devices' | 'paymentType'
> & {
  id: number;
  isForSaleInFiat?: boolean;
  fiatProductModerationStatus?: FiatProductModerationStatus;
  minimumAge?: string;
  restrictedCountries?: string[];
} & { devices: Array<DevicesType> };

export enum PaymentType {
  Free = 'free',
  Robux = 'robux',
  Fiat = 'fiat',
}

export enum PlaceJoinRestrictionType {
  Default = 0,
  Open = 1,
  Legacy = 2,
  Secure = 3,
}

export type CountryInfo = {
  countryCode: string;
  countryName: string;
};

export type ExperienceAccessMetaData = {
  experienceMarketPlaceCommissionRate: number;
  privateServerMarketPlaceCommissionRate: number;
  activeServersCount: number | null;
  activeSubscriptionsCount: number | null;
};
