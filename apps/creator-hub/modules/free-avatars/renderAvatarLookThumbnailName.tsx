import ItemThumbnail from '@modules/creations/common/components/ItemThumbnail';
import {
  Item,
  itemTypeToReturnPolicyType,
  itemTypeToThumbnailType,
} from '@modules/miscellaneous/common';

const lookThumbnailType = itemTypeToThumbnailType[Item.Look];
const lookReturnPolicy = itemTypeToReturnPolicyType[Item.Look];

export function AvatarLookThumbnailName({
  row,
}: {
  row: { lookId?: string | null; name?: string | null };
}) {
  const name = row.name ?? '';
  const targetId = row.lookId ?? 0;
  return (
    <div className='flex min-width-0 items-center gap-small'>
      <div className='relative size-[48px] shrink-0 clip radius-small'>
        <ItemThumbnail
          containerClass='absolute inset-0 size-full radius-medium'
          moderatedContainerClass='absolute inset-0 size-full radius-medium'
          bundleModerationStatus={undefined}
          type={lookThumbnailType}
          // TODO @asaxena UCP-1303
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- IDs are int64 and cannot be safely converted to JS number
          targetId={targetId as number}
          returnPolicy={lookReturnPolicy}
          alt={name}
          isPendingNewTarget={false}
          itemType={Item.Look}
        />
      </div>
      <span className='text-truncate-end min-width-0'>{name}</span>
    </div>
  );
}
