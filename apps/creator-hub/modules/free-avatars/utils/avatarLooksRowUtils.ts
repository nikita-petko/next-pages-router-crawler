import type { PagedLook } from '@rbx/client-look-api/v1';
import { Item } from '@modules/miscellaneous/common';
import { getUrlForItemType } from '@modules/miscellaneous/urls';

export function getLookIdString(row: { lookId?: string | null }): string {
  return row.lookId ?? '';
}

function getLookThumbnailTargetId(row: { lookId?: string | null }): number {
  if (row.lookId == null || row.lookId === '') {
    return 0;
  }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- IDs are int64 and cannot be safely converted to JS number
  return row.lookId as unknown as number;
}

export function getLookItemCount(row: PagedLook): number {
  return (row.assets?.length ?? 0) + (row.bundles?.length ?? 0);
}

export function writeTextToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function getLookOpenInNewTabUrl(row: { lookId?: string | null }): string | null {
  const lookId = getLookThumbnailTargetId(row);
  if (lookId === 0) {
    return null;
  }
  return getUrlForItemType(Item.Look, lookId);
}
