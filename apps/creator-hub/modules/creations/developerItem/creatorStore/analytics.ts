import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import type Asset from '@modules/miscellaneous/common/enums/Asset';

export function logCreatorStoreCustomThumbnailUpload(params: {
  parentAssetType: Asset;
  assetId: number;
}): void {
  unifiedLoggerClient.logClickEvent({
    eventName: CreatorDashboardEventType.CreatorStoreCustomThumbnailUpload,
    parameters: {
      parentAssetType: params.parentAssetType,
      assetId: params.assetId.toString(),
    },
  });
}
