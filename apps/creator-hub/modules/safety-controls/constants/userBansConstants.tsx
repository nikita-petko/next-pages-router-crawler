import { getProductionCreatorHubUrl, resolveUrl } from '@rbx/env-utils';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { TableColumnConfig } from '@modules/charts-generic/tables/types/GenericColumnType';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { TableConfig } from '@modules/charts-generic/tables/types/GenericTableType';
import { TableSortOrder } from '@modules/charts-generic/tables/types/TableSort';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export const EM_DASH = '\u2014';

export const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
export const ONE_HOUR_IN_SECONDS = 60 * 60;

export const MAX_NUM_USERS_BULK_OPERATION = 50;

export const NOT_FOUND_ERROR_CODE = 5;

export const BAN_API_DEVFORUM_ANNOUNCEMENT =
  'https://devforum.roblox.com/t/introducing-the-ban-api-and-alt-account-detection/3039740';

export const ROBLOX_COMMUNITY_STANDARDS_URL = resolveUrl(
  'robloxCommunityStandardsUrl',
  process.env.targetEnvironment,
  process.env.buildTarget,
);

export const ROBLOX_USER_BANS_CREATOR_POLICIES = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/players#banning-users`;

export enum ModerationEvents {
  BAN_CLICK_EVENT = 'Moderation.Ban.Click',
  BAN_CLICK_EVENT_ERROR = 'Moderation.Ban.Click.Error',
  SEARCH_IMPRESSION_EVENT = 'Moderation.Search.Impression',
  SEE_BAN_HISTORY_CLICK_EVENT = 'Moderation.SeeBanHistory.Click',
  UNBAN_CLICK_EVENT = 'Moderation.Unban.Click',
  UNBAN_CLICK_EVENT_ERROR = 'Moderation.Unban.Click.Error',
}

export enum UserBansTableColumnKey {
  UserKey = 'UserKey',
  Select = 'Select',
  User = 'User',
  AltsBanned = 'AltsBanned',
  PublicReason = 'PublicReason',
  PrivateReason = 'PrivateReason',
  BannedDate = 'BannedDate',
  BannedStatus = 'BannedStatus',
  More = 'More',
}

export const UserBansTableColumnConfigs: TableColumnConfig<UserBansTableColumnKey>[] = [
  // Hidden column to use for the row key.
  {
    titleKey: translationKey('Title.Table.User', TranslationNamespace.SafetyControls),
    columnKey: UserBansTableColumnKey.UserKey,
    columnType: ColumnType.Number,
    hidden: true,
  },
  {
    titleKey: translationKey('Title.Table.Select', TranslationNamespace.SafetyControls),
    columnKey: UserBansTableColumnKey.Select,
    columnType: ColumnType.Selection,
    widthWeight: 10,
  },
  {
    titleKey: translationKey('Title.Table.User', TranslationNamespace.SafetyControls),
    columnKey: UserBansTableColumnKey.User,
    columnType: ColumnType.Other,
    widthWeight: 12,
  },
  {
    titleKey: translationKey('Title.Table.AltsBanned', TranslationNamespace.SafetyControls),
    columnKey: UserBansTableColumnKey.AltsBanned,
    columnType: ColumnType.Text,
    widthWeight: 10,
  },
  {
    titleKey: translationKey('Title.Table.PublicReason', TranslationNamespace.SafetyControls),
    columnKey: UserBansTableColumnKey.PublicReason,
    columnType: ColumnType.Text,
    widthWeight: 20,
  },
  {
    titleKey: translationKey('Title.Table.PrivateReason', TranslationNamespace.SafetyControls),
    columnKey: UserBansTableColumnKey.PrivateReason,
    columnType: ColumnType.Text,
    widthWeight: 20,
  },
  {
    titleKey: translationKey('Title.Table.BannedDate', TranslationNamespace.SafetyControls),
    columnKey: UserBansTableColumnKey.BannedDate,
    columnType: ColumnType.Timestamp,
    sort: {
      direction: TableSortOrder.desc,
    },
    widthWeight: 12,
  },
  {
    titleKey: translationKey('Title.Table.BannedStatus', TranslationNamespace.SafetyControls),
    columnKey: UserBansTableColumnKey.BannedStatus,
    columnType: ColumnType.Other,
    widthWeight: 12,
  },
  {
    titleKey: translationKey('Title.Table.More', TranslationNamespace.SafetyControls),
    columnKey: UserBansTableColumnKey.More,
    columnType: ColumnType.Other,
    widthWeight: 10,
  },
];

export const UserBansTableConfig: TableConfig<UserBansTableColumnKey> = {
  defaultActiveSort: UserBansTableColumnKey.BannedDate,
};

export enum DurationUnits {
  Minutes = 'Common.Minutes',
  Hours = 'Common.Hours',
  Days = 'Common.Days',
}
