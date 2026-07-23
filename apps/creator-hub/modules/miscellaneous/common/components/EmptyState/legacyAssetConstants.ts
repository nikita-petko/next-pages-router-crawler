const ASSET_BASE_PATH = `${process.env.assetPathPrefix}/spot_illustrations`;
const analytics = `${ASSET_BASE_PATH}/small/analytics.svg`;
const animations = `${ASSET_BASE_PATH}/small/animations.svg`;
const audio = `${ASSET_BASE_PATH}/small/audio.svg`;
const audioLight = `${ASSET_BASE_PATH}/small/audio_light.svg`;
const audioDark = `${ASSET_BASE_PATH}/small/audio_dark.svg`;
const avatarItem = `${ASSET_BASE_PATH}/small/avatar_item.svg`;
const beginSearch = `${ASSET_BASE_PATH}/small/beginSearch.svg`;
const creatorStore = `${ASSET_BASE_PATH}/small/creator_store.svg`;
const decals = `${ASSET_BASE_PATH}/small/decals.svg`;
const events = `${ASSET_BASE_PATH}/small/events.svg`;
const experiences = `${ASSET_BASE_PATH}/small/experiences.svg`;
const images = `${ASSET_BASE_PATH}/small/images.svg`;
const meshes = `${ASSET_BASE_PATH}/small/meshes.svg`;
const models = `${ASSET_BASE_PATH}/small/models.svg`;
const plugins = `${ASSET_BASE_PATH}/small/plugins.svg`;
const script = `${ASSET_BASE_PATH}/small/script.svg`;
const song = `${ASSET_BASE_PATH}/small/song.svg`;
const noUsers = `${ASSET_BASE_PATH}/small/no_users.svg`;
const user = `${ASSET_BASE_PATH}/small/user.svg`;
const users = `${ASSET_BASE_PATH}/small/users.svg`;
const videos = `${ASSET_BASE_PATH}/small/videos.svg`;
const search = `${ASSET_BASE_PATH}/small/search.svg`;
const apiKeys = `${ASSET_BASE_PATH}/large/api_keys.svg`;
const localization = `${ASSET_BASE_PATH}/large/localization.svg`;
const noPermissions = `${ASSET_BASE_PATH}/large/no_permissions.svg`;
const oAuthApps = `${ASSET_BASE_PATH}/large/oauth_apps.svg`;
const experienceConfigs = `${ASSET_BASE_PATH}/large/experience_configs.svg`;
const oof = `${ASSET_BASE_PATH}/small/oof.svg`;
const rights = `${ASSET_BASE_PATH}/large/rights.svg`;
const secrets = `${ASSET_BASE_PATH}/large/secrets.svg`;
const shareLinks = `${ASSET_BASE_PATH}/large/share_links.svg`;
const download = `${ASSET_BASE_PATH}/small/download.svg`;
const attributes = `${ASSET_BASE_PATH}/small/attributes.svg`;
const configurations = `${ASSET_BASE_PATH}/large/configurations.svg`;
const matchmakingSimulation = `${ASSET_BASE_PATH}/small/matchmaking_simulation.svg`;
const emptyExperiments = `${ASSET_BASE_PATH}/large/empty_experiments.svg`;

/**
 * This legacy illustrations with mixes ratios and is being phased out.
 * Use `emptyStateIllustrations` instead.
 */
export default {
  small: {
    analytics,
    animations,
    audio,
    audioLight,
    audioDark,
    avatarItem,
    beginSearch,
    creatorStore,
    decals,
    events,
    experiences,
    images,
    meshes,
    models,
    plugins,
    script,
    song,
    noUsers,
    user,
    users,
    videos,
    search,
    oof,
    download,
    attributes,
    matchmakingSimulation,
  },
  large: {
    apiKeys,
    localization,
    noPermissions,
    oAuthApps,
    rights,
    secrets,
    shareLinks,
    configurations,
    experienceConfigs,
    emptyExperiments,
  },
};
