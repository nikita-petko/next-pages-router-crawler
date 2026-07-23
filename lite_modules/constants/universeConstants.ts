import { AdvertisedUniverse } from '@type/universe';

export const PUBLIC_UNIVERSE_PRIVACY_TYPE = 'Public' as const;

export const defaultAdvertisedUniverse: AdvertisedUniverse = {
  universe_id: 0,
  universe_name: 'All',
};
