import { RobloxApiDevelopModelsUniverseSettingsResponsePlayableDevicesEnum } from '@rbx/clients/develop';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import {
  AccessType,
  GroupAccessType,
  AgeRestrictionType,
  PlaceJoinRestrictionType,
} from '../ExperienceAccessTypes';

export const MinimumRobuxPriceForPlaceSales = 25;
export const MaximumRobuxPriceForPlaceSales = 1000;
export const PrivateServerMinPrice = 10;
export const PrivateServerRegionalPricingMinPrice = 49;
export const PrivateServerMaxPrice = 500;

export const FIAT_PAID_ACCESS_LEARN_MORE_URL = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/monetization/paid-access-local-currency`;

export const TELEPORT_LEARN_MORE_URL = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/projects/teleport`;

export const accessTypeTranslationKeys: { [key in AccessType]: string } = {
  [AccessType.Friends]: 'Label.AccessType.Friends',
  [AccessType.Public]: 'Label.AccessType.Public',
};

export const groupAccessTypeTranslationKeys: { [key in GroupAccessType]: string } = {
  [GroupAccessType.GroupMembers]: 'Label.AccessType.GroupMembers',
};

export const devicesTypeTranslationKeys: {
  [key in RobloxApiDevelopModelsUniverseSettingsResponsePlayableDevicesEnum]: string;
} = {
  [RobloxApiDevelopModelsUniverseSettingsResponsePlayableDevicesEnum.Computer]:
    'Label.DeviceType.Desktop',
  [RobloxApiDevelopModelsUniverseSettingsResponsePlayableDevicesEnum.Phone]:
    'Label.DeviceType.Mobile',
  [RobloxApiDevelopModelsUniverseSettingsResponsePlayableDevicesEnum.Tablet]:
    'Label.DeviceType.Tablet',
  [RobloxApiDevelopModelsUniverseSettingsResponsePlayableDevicesEnum.Console]:
    'Label.DeviceType.Console',
  [RobloxApiDevelopModelsUniverseSettingsResponsePlayableDevicesEnum.Vr]: 'Label.DeviceType.VR',
};

export const ageRestrictionTypeTranslationKeys: { [key in AgeRestrictionType]: string } =
  Object.fromEntries(
    Object.values(AgeRestrictionType).map((ageType) => [
      ageType,
      ageType === AgeRestrictionType.AllAges ? 'Label.AllAges' : 'Label.AgePlus',
    ]),
  ) as { [key in AgeRestrictionType]: string };

export const placeJoinRestrictionTypeTranslationKeys: {
  [key in PlaceJoinRestrictionType]: string;
} = {
  [PlaceJoinRestrictionType.Default]: 'Label.PlaceJoinRestriction.Default',
  [PlaceJoinRestrictionType.Open]: 'Label.PlaceJoinRestriction.Open',
  [PlaceJoinRestrictionType.Legacy]: 'Label.PlaceJoinRestriction.Legacy',
  [PlaceJoinRestrictionType.Secure]: 'Label.PlaceJoinRestriction.Secure',
};
