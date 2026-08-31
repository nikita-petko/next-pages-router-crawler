import type { TVideoSource } from '@modules/landing/common/types';
import roadMapJson from '../../../public/metadata/en-US/CreatorDashboard.RoadMap.json';

export const ROAD_MAP_ASSET_BASE_PATH = `${process.env.assetPathPrefix}/roadmap`;
export const bannerLeftImg = `${ROAD_MAP_ASSET_BASE_PATH}/banner_left.webp`;
export const bannerRightImg = `${ROAD_MAP_ASSET_BASE_PATH}/banner_right.webp`;

export const heroBackgroundPoster = `${ROAD_MAP_ASSET_BASE_PATH}/creator_roadmap_sizzle_poster.webp`;
export const heroBackgroundVideoSources: Array<TVideoSource> = [
  {
    url: `${ROAD_MAP_ASSET_BASE_PATH}/creator_roadmap_sizzle.webm`,
    type: 'video/webm',
  },
  {
    url: `${ROAD_MAP_ASSET_BASE_PATH}/creator_roadmap_sizzle.mp4`,
    type: 'video/mp4',
  },
];

const roadMapOGImgPath = `${process.env.assetPathPrefix}/opengraph/road_map_og_image.jpg`;
export const roadMapOGImg = new URL(roadMapOGImgPath, process.env.hostDomain).href;
export const metadataTitle = roadMapJson['Heading.RobloxCreatorRoadmap'];
export const metadataDescription = roadMapJson['Description.MetadataDescription'];

export const creatorRoadmapDevForumPostUrl =
  'https://devforum.roblox.com/t/creator-roadmap-2026-spring-update/4625473';

export const releaseRoadmapDevForumPostUrl = true;
