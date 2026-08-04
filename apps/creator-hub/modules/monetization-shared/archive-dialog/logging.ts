import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';

/** Single event for every archive/unarchive entry point so it rolls up into one dashboard. */
export const PRODUCT_ARCHIVE_EVENT_NAME = 'monetization/productArchive';

export type ArchivableProductType = 'developerProduct' | 'gamePass';

type LogProductArchiveClickParams = {
  productType: ArchivableProductType;
  /** Ids collide across product types, so always group by `productType` alongside this. */
  itemId: number;
  universeId: number;
  /** Current state of the product; the logged `action` is the transition it triggers. */
  isArchived: boolean;
};

export function logProductArchiveClick({
  productType,
  itemId,
  universeId,
  isArchived,
}: LogProductArchiveClickParams) {
  unifiedLoggerClient.logClickEvent({
    eventName: PRODUCT_ARCHIVE_EVENT_NAME,
    parameters: {
      productType,
      action: isArchived ? 'unarchive' : 'archive',
      universeId: universeId.toString(),
      itemId: itemId.toString(),
    },
  });
}
