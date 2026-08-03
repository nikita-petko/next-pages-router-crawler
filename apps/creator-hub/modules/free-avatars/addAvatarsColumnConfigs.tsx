import type { PagedLook } from '@rbx/client-look-api/v1';
import type { FormattedText } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { TableColumnConfig } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { CellDataType } from '@modules/charts-generic/tables/types/GenericTableType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { AvatarLookThumbnailName } from './renderAvatarLookThumbnailName';
import { getLookIdString, getLookItemCount } from './utils/avatarLooksRowUtils';

export type AddAvatarsColumnKey = 'select' | 'avatarLook' | 'outfitId' | 'itemCount';

export const ADD_AVATARS_COLUMN_CONFIGS: TableColumnConfig<AddAvatarsColumnKey>[] = [
  {
    columnKey: 'select',
    columnType: ColumnType.Selection,
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- no header for this column
    titleKey: '' as FormattedText,
    widthWeight: 5,
  },
  {
    columnKey: 'avatarLook',
    columnType: ColumnType.Other,
    titleKey: translationKey('Label.AvatarLook', TranslationNamespace.Creations),
  },
  {
    columnKey: 'outfitId',
    columnType: ColumnType.Text,
    titleKey: translationKey('Label.OutfitId', TranslationNamespace.Creations),
  },
  {
    columnKey: 'itemCount',
    columnType: ColumnType.Text,
    titleKey: translationKey('Label.ItemsIncluded', TranslationNamespace.Creations),
  },
];

export function buildAddAvatarsRowData(
  look: PagedLook,
  opts: {
    selectedLookIds: ReadonlySet<string>;
    linkedLookIds: ReadonlySet<string>;
    toggleLookSelected: (lookId: string) => void;
    formatItemCount: (n: number) => string;
  },
): Map<AddAvatarsColumnKey, CellDataType> {
  const lookIdStr = getLookIdString(look);
  const isAlreadyLinked = lookIdStr !== '' && opts.linkedLookIds.has(lookIdStr);
  return new Map([
    [
      'select',
      {
        type: ColumnType.Selection,
        rowKey: lookIdStr,
        checked: lookIdStr !== '' && opts.selectedLookIds.has(lookIdStr),
        disabled: lookIdStr === '' || isAlreadyLinked,
        onChange: (rowKey: string) => opts.toggleLookSelected(rowKey),
      },
    ],
    ['avatarLook', { type: ColumnType.Other, value: <AvatarLookThumbnailName row={look} /> }],
    ['outfitId', { type: ColumnType.Text, value: lookIdStr }],
    ['itemCount', { type: ColumnType.Text, value: opts.formatItemCount(getLookItemCount(look)) }],
  ]);
}
