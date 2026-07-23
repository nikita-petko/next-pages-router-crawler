import roadMapJson from '../../../public/locales/en-US/CreatorDashboard.RoadMap.json';

export const ROAD_MAP_ASSET_BASE_PATH = `${process.env.assetPathPrefix}/roadmap`;
export const bannerLeftImg = `${ROAD_MAP_ASSET_BASE_PATH}/banner_left.webp`;
export const bannerRightImg = `${ROAD_MAP_ASSET_BASE_PATH}/banner_right.webp`;

const roadMapOGImgPath = `${process.env.assetPathPrefix}/opengraph/road_map_og_image.jpg`;
export const roadMapOGImg = new URL(roadMapOGImgPath, process.env.hostDomain).href;
export const metadataTitle = roadMapJson['Heading.RobloxCreatorRoadmap'];
export const metadataDescription = roadMapJson['Description.MetadataDescription'];

export const creatorRoadmapDevForumPostUrl =
  'https://devforum.roblox.com/t/creator-roadmap-2025-end-of-year-recap/4156739';

export const releaseRoadmapDevForumPostUrl = true;
