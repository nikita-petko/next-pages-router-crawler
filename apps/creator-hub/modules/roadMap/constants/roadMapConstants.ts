import type { TVideoSource } from '@modules/landing/common/types';
import roadMapJson from '../../../public/metadata/en-US/CreatorDashboard.RoadMap.json';

export const ROAD_MAP_ASSET_BASE_PATH = `${process.env.assetPathPrefix}/roadmap`;
export const bannerLeftImg = `${ROAD_MAP_ASSET_BASE_PATH}/banner_left.webp`;
export const bannerRightImg = `${ROAD_MAP_ASSET_BASE_PATH}/banner_right.webp`;

// Hero video banner background. Reuses the production `creator_hero` asset from the landing module as
// a placeholder until a roadmap-specific video ships; swap these paths when design delivers one.
const LANDING_ASSET_BASE_PATH = `${process.env.assetPathPrefix}/landing`;
export const heroBackgroundPoster = `${LANDING_ASSET_BASE_PATH}/creator_hero_poster.webp`;
export const heroBackgroundVideoSources: Array<TVideoSource> = [
  { url: `${LANDING_ASSET_BASE_PATH}/creator_hero.webm`, type: 'video/webm' },
  { url: `${LANDING_ASSET_BASE_PATH}/creator_hero.mp4`, type: 'video/mp4' },
];

const roadMapOGImgPath = `${process.env.assetPathPrefix}/opengraph/road_map_og_image.jpg`;
export const roadMapOGImg = new URL(roadMapOGImgPath, process.env.hostDomain).href;
export const metadataTitle = roadMapJson['Heading.RobloxCreatorRoadmap'];
export const metadataDescription = roadMapJson['Description.MetadataDescription'];

export const creatorRoadmapDevForumPostUrl =
  'https://devforum.roblox.com/t/creator-roadmap-2026-spring-update/4625473';

export const releaseRoadmapDevForumPostUrl = true;
