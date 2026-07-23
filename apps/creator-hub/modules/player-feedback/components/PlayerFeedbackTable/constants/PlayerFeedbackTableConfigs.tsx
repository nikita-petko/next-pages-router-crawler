import { ColumnType, TableColumnConfig, TableConfig } from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import PlayerFeedbackTableColumnKey from './PlayerFeedbackTableColumnKey';

export const PlayerFeedbackTableConfig: TableConfig<PlayerFeedbackTableColumnKey> = {
  stickyFirstColumn: false,
  stickyHeader: false,
  hover: true,
};

export enum CategoryType {
  All = 'All',
  Upvote = 'Upvote',
  Downvote = 'Downvote',
  InExperience = 'InExperience',
}

export const CategoryTypeFilterLabelKey: Record<CategoryType, string> = {
  [CategoryType.All]: 'Label.CategoryTypeFilter.All',
  [CategoryType.Upvote]: 'Label.CategoryTypeFilter.Upvote',
  [CategoryType.Downvote]: 'Label.CategoryTypeFilter.Downvote',
  // Align the third category label to "Unrated"
  [CategoryType.InExperience]: 'Label.CategoryTypeFilter.Unrated',
};

export const CategoryTypeLabelKey: Record<CategoryType, string> = {
  [CategoryType.All]: 'Label.CategoryTypeFilter.All',
  [CategoryType.Upvote]: 'Label.CategoryType.Upvote',
  [CategoryType.Downvote]: 'Label.CategoryType.Downvote',
  [CategoryType.InExperience]: 'Label.CategoryType.Unrated',
};

// Icons removed per Foundation guidance to prioritize text

export const CategoryTypeIconColorIndex: Record<CategoryType, number> = {
  [CategoryType.All]: -1,
  [CategoryType.Upvote]: 1, // second chart color - green
  [CategoryType.Downvote]: 0, // first chart color - blue
  // Color index used when rendering charts
  [CategoryType.InExperience]: 2,
};

export const PlayerFeebackTableColumnConfigs: Array<
  TableColumnConfig<PlayerFeedbackTableColumnKey>
> = [
  {
    columnKey: PlayerFeedbackTableColumnKey.Rating,
    columnType: ColumnType.Other,
    titleKey: translationKey('Title.Table.Rating', TranslationNamespace.PlayerFeedback),
  },
  {
    columnKey: PlayerFeedbackTableColumnKey.DeviceType,
    columnType: ColumnType.Text,
    titleKey: translationKey('Title.Table.DeviceType', TranslationNamespace.PlayerFeedback),
  },
  {
    columnKey: PlayerFeedbackTableColumnKey.Platform,
    columnType: ColumnType.Text,
    titleKey: translationKey('Title.Table.Platform', TranslationNamespace.PlayerFeedback),
  },
  {
    columnKey: PlayerFeedbackTableColumnKey.Timestamp,
    columnType: ColumnType.Timestamp,
    titleKey: translationKey('Title.Table.Timestamp', TranslationNamespace.PlayerFeedback),
  },
  {
    columnKey: PlayerFeedbackTableColumnKey.Comment,
    columnType: ColumnType.Other,
    titleKey: translationKey('Title.Table.Comment', TranslationNamespace.PlayerFeedback),
  },
];
