import type { CreatorConfigsPublicApiRepository } from '@modules/clients/creatorConfigsPublicApi';

export const LEADERBOARD_REPOSITORY: CreatorConfigsPublicApiRepository = 'LeaderboardsConfig';

export const LEADERBOARD_CONFIG_KEY_PREFIX = 'leaderboard_config_';

export const ACTIVE_LEADERBOARDS_KEY = 'meta::active_leaderboards';

export const LEADERBOARD_LEARN_MORE_URL =
  'https://create.roblox.com/docs/tutorials/use-case-tutorials/data-storage/create-leaderboard';

export type LeaderboardOrderedDataStore = {
  name: string;
  key_mapping_template?: string;
};

export type LeaderboardConfigEntry = {
  leaderboard_name: string;
  unit: string;
  ordered_data_store: LeaderboardOrderedDataStore;
  scope?: string;
};

export type LeaderboardConfigItem = {
  key: string;
  config: LeaderboardConfigEntry;
};

export type LeaderboardConfig = {
  configVersion: number;
  leaderboards: LeaderboardConfigItem[];
  activeLeaderboardKeys: string[];
};
