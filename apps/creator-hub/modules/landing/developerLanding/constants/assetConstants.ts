import type { TVideoSource } from '../../common/types';

const ASSET_BASE_PATH = `${process.env.assetPathPrefix}/landing`;

export const heroBackgroundPoster = `${ASSET_BASE_PATH}/creator_hero_poster.webp`;
export const heroBackgroundImage = `${ASSET_BASE_PATH}/hero_background.webp`;
export const heroBackgroundVideoSources: Array<TVideoSource> = [
  {
    url: `${ASSET_BASE_PATH}/creator_hero.webm`,
    type: 'video/webm',
  },
  { url: `${ASSET_BASE_PATH}/creator_hero.mp4`, type: 'video/mp4' },
];
export const creatorProgramsImage = `${ASSET_BASE_PATH}/creatorPrograms.webp`;
export const metadataPath = `${ASSET_BASE_PATH}/metadata.jpg`;

// Create & Scale section
export const studioLogoImage = `${ASSET_BASE_PATH}/studio_logo.svg`;
export const globeImage = `${ASSET_BASE_PATH}/globe.webp`;
export const rocketLogoImage = `${ASSET_BASE_PATH}/rocket.webp`;
export const wingsImage = `${ASSET_BASE_PATH}/wings.webp`;

// Creator Hub section
export const forumImage = `${ASSET_BASE_PATH}/forum.webp`;
export const creatorRoadmapImage = `${ASSET_BASE_PATH}/creator_roadmap.webp`;
export const robloxBlogImage = `${ASSET_BASE_PATH}/roblox_blog.webp`;

// Monetize section
export const immersiveAdsImage = `${ASSET_BASE_PATH}/ads.webp`;
export const subsAndPassesImage = `${ASSET_BASE_PATH}/pass.webp`;
export const inExperiencePurchasesImage = `${ASSET_BASE_PATH}/chest.webp`;
export const avatarItemsImage = `${ASSET_BASE_PATH}/headphones.webp`;
export const pluginsImage = `${ASSET_BASE_PATH}/plugins.webp`;
export const robux3dImage = `${ASSET_BASE_PATH}/robux.webp`;

// Studio section
export const studioPosterImage = `${ASSET_BASE_PATH}/studio_poster.webp`;
export const studioSquarePosterImage = `${ASSET_BASE_PATH}/studio_square_poster.webp`;
export const studioVideoThumbnailImage = `${ASSET_BASE_PATH}/studio_video_thumbnail.webp`;

export const studioVideoSources: Array<TVideoSource> = [
  {
    url: `${ASSET_BASE_PATH}/studio_video.webm`,
    type: 'video/webm',
  },
  {
    url: `${ASSET_BASE_PATH}/studio_video.mp4`,
    type: 'video/mp4',
  },
];

export const studioVideoSquareSources: Array<TVideoSource> = [
  {
    url: `${ASSET_BASE_PATH}/studio_video_square.webm`,
    type: 'video/webm',
  },
  {
    url: `${ASSET_BASE_PATH}/studio_video_square.mp4`,
    type: 'video/mp4',
  },
];

export const waveBackgroundShortImage = `${ASSET_BASE_PATH}/wave_background_short.webp`;
export const waveBackgroundShortVideoSources: Array<TVideoSource> = [
  { url: `${ASSET_BASE_PATH}/wave_background_short.webm`, type: 'video/webm' },
  { url: `${ASSET_BASE_PATH}/wave_background_short.mp4`, type: 'video/mp4' },
];

export const waveBackgroundTallImage = `${ASSET_BASE_PATH}/wave_background_tall.webp`;
export const waveBackgroundTallVideoSources: Array<TVideoSource> = [
  { url: `${ASSET_BASE_PATH}/wave_background_tall.webm`, type: 'video/webm' },
  { url: `${ASSET_BASE_PATH}/wave_background_tall.mp4`, type: 'video/mp4' },
];

export const robloxBackgroundImage = `${ASSET_BASE_PATH}/roblox_background.webp`;
export const robloxBackgroundVideoSources: Array<TVideoSource> = [
  { url: `${ASSET_BASE_PATH}/roblox_background.webm`, type: 'video/webm' },
  { url: `${ASSET_BASE_PATH}/roblox_background.mp4`, type: 'video/mp4' },
];
