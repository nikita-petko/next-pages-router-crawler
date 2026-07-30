const INSPIRE_ASSET_BASE_PATH = `${process.env.assetPathPrefix}/landing/inspire`;

// Hero + section imagery, committed under public/assets/landing/inspire/.
export const heroBackgroundImage = `${INSPIRE_ASSET_BASE_PATH}/hero.webp`;

export const itineraryCafeImage = `${INSPIRE_ASSET_BASE_PATH}/itinerary-cafe.webp`;
export const itineraryWorkshopsImage = `${INSPIRE_ASSET_BASE_PATH}/itinerary-workshops.webp`;
export const itineraryChallengeImage = `${INSPIRE_ASSET_BASE_PATH}/itinerary-challenge.webp`;

export const exclusiveAwardImage = `${INSPIRE_ASSET_BASE_PATH}/award-texture.webp`;
export const exclusiveAwardArt = `${INSPIRE_ASSET_BASE_PATH}/award.webp`;
export const challengePrizesIllustration = `${INSPIRE_ASSET_BASE_PATH}/prizes-podium.webp`;

// Real Roblox avatars (speakers) and experience thumbnails (Hall of Fame games),
// fetched once from the Roblox APIs and committed under public/assets/landing/inspire/.
export const speakerAvatar = (slug: string) => `${INSPIRE_ASSET_BASE_PATH}/speakers/${slug}.webp`;
export const gameThumbnail = (key: string) => `${INSPIRE_ASSET_BASE_PATH}/games/${key}.webp`;
