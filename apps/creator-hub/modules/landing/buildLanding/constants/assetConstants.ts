import { TVideoSource } from '../../common/types';

const ASSET_BASE_PATH = `${process.env.assetPathPrefix}/landing`;

export const heroBackgroundPoster = `${ASSET_BASE_PATH}/build_hero_poster.webp`;
export const heroBackgroundVideoSources: Array<TVideoSource> = [
  {
    url: `${ASSET_BASE_PATH}/build_hero.webm`,
    type: 'video/webm',
  },
  { url: `${ASSET_BASE_PATH}/build_hero.mp4`, type: 'video/mp4' },
];

export const discoveryImage = `${ASSET_BASE_PATH}/discovery.webp`;
export const coachingImage = `${ASSET_BASE_PATH}/coaching.webp`;
export const communityImage = `${ASSET_BASE_PATH}/community.webp`;

export const globalImage = `${ASSET_BASE_PATH}/global.webp`;
