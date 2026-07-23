import { Toggle } from '@rbx/foundation-ui';
import { RobuxIcon } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { TableColumnConfig } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { CellDataType } from '@modules/charts-generic/tables/types/GenericTableType';
import type { LookDetailV2 } from '@modules/clients/lookQueries';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  AvatarLookRowActionsPopover,
  type TAvatarLookRowActionsLabels,
} from './components/AvatarLookRowActionsPopover';
import {
  AvatarLookStatusBadge,
  getPlaceholderAvatarLookStatus,
  type TAvatarLookStatusLabels,
} from './components/AvatarLookStatusBadge';
import { AvatarLookThumbnailName } from './renderAvatarLookThumbnailName';
import { getLookIdString } from './utils/avatarLooksRowUtils';

export type LinkedAvatarsColumnKey =
  | 'avatarItems'
  | 'outfitId'
  | 'price'
  | 'freeAvatar'
  | 'status'
  | 'rowActions';

function PriceCell({ price }: { price: number | null | undefined }) {
  if (price == null) {
    return <span className='text-body-large content-muted text-truncate-end'>—</span>;
  }
  return (
    <div className='flex no-wrap items-center gap-xsmall'>
      <RobuxIcon fontSize='medium' className='shrink-0' />
      <span className='text-truncate-end'>{price}</span>
    </div>
  );
}

export type TLinkedAvatarsRowDataOpts = {
  onRemoveLook?: (lookId: string) => void;
  onCopyLookIdSuccess?: () => void;
  statusLabels: TAvatarLookStatusLabels;
  rowActionsLabels: TAvatarLookRowActionsLabels;
  freeAvatarLabel: string;
};

export const LINKED_AVATARS_COLUMN_CONFIGS: TableColumnConfig<LinkedAvatarsColumnKey>[] = [
  {
    columnKey: 'avatarItems',
    columnType: ColumnType.Other,
    titleKey: translationKey('Label.AvatarLook', TranslationNamespace.Creations),
  },
  {
    columnKey: 'outfitId',
    columnType: ColumnType.Text,
    titleKey: translationKey('Label.OutfitId', TranslationNamespace.Creations),
  },
  {
    columnKey: 'price',
    columnType: ColumnType.Other,
    titleKey: translationKey('Label.Price', TranslationNamespace.Creations),
  },
  {
    columnKey: 'freeAvatar',
    columnType: ColumnType.Other,
    titleKey: translationKey('Label.FreeAvatarToggle', TranslationNamespace.Creations),
  },
  {
    columnKey: 'status',
    columnType: ColumnType.Other,
    titleKey: translationKey('Label.Status', TranslationNamespace.Creations),
  },
  {
    columnKey: 'rowActions',
    columnType: ColumnType.Other,
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- no header for this column
    titleKey: '' as FormattedText,
    widthWeight: 5,
  },
];

export function buildLinkedAvatarsRowData(
  lookId: string,
  detail: LookDetailV2 | null | undefined,
  opts: TLinkedAvatarsRowDataOpts,
): Map<LinkedAvatarsColumnKey, CellDataType> {
  const row = detail ?? { lookId };
  return new Map([
    ['avatarItems', { type: ColumnType.Other, value: <AvatarLookThumbnailName row={row} /> }],
    ['outfitId', { type: ColumnType.Text, value: getLookIdString(row) }],
    ['price', { type: ColumnType.Other, value: <PriceCell price={detail?.totalValue} /> }],
    [
      'freeAvatar',
      {
        type: ColumnType.Other,
        value: (
          <Toggle
            label=''
            size='Small'
            placement='Start'
            isChecked={false}
            onCheckedChange={() => undefined}
            aria-label={opts.freeAvatarLabel}
          />
        ),
      },
    ],
    [
      'status',
      {
        type: ColumnType.Other,
        value: (
          <AvatarLookStatusBadge
            status={getPlaceholderAvatarLookStatus()}
            labels={opts.statusLabels}
          />
        ),
      },
    ],
    [
      'rowActions',
      {
        type: ColumnType.Other,
        value: (
          <AvatarLookRowActionsPopover
            row={row}
            labels={opts.rowActionsLabels}
            onRemove={opts.onRemoveLook}
            onCopySuccess={opts.onCopyLookIdSuccess}
          />
        ),
      },
    ],
  ]);
}
