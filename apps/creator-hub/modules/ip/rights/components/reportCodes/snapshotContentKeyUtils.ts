import type { SnapshotContent } from '@rbx/client-rights/v1';

function getSnapshotContentKey(item: SnapshotContent): string {
  return `${item.contentId ?? ''}-${item.contentType ?? ''}`;
}

export default getSnapshotContentKey;
