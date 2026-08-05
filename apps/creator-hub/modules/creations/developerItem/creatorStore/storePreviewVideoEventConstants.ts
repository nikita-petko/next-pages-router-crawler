type StorePreviewVideoUploadEventParams = {
  assetId: number;
  fileSize: number;
  creatorId: number;
  duration?: number;
  error?: string;
};

const createStorePreviewVideoUploadStartEvent = (params: StorePreviewVideoUploadEventParams) => ({
  eventName: 'storePreviewVideoUploadStart',
  parameters: {
    AssetType: 'StorePreviewVideo',
    AssetId: params.assetId.toString(),
    FileSize: params.fileSize.toString(),
    CreatorId: params.creatorId.toString(),
  },
});

const createStorePreviewVideoUploadSuccessEvent = (params: StorePreviewVideoUploadEventParams) => ({
  eventName: 'storePreviewVideoUploadSuccess',
  parameters: {
    AssetType: 'StorePreviewVideo',
    AssetId: params.assetId.toString(),
    FileSize: params.fileSize.toString(),
    CreatorId: params.creatorId.toString(),
    Status: 'success',
    Duration: params.duration?.toString() ?? '0',
  },
});

const createStorePreviewVideoUploadFailureEvent = (params: StorePreviewVideoUploadEventParams) => ({
  eventName: 'storePreviewVideoUploadFailure',
  parameters: {
    AssetType: 'StorePreviewVideo',
    AssetId: params.assetId.toString(),
    FileSize: params.fileSize.toString(),
    CreatorId: params.creatorId.toString(),
    Duration: params.duration?.toString() ?? '0',
    Error: params.error ?? 'Unknown error',
  },
});

export {
  createStorePreviewVideoUploadStartEvent,
  createStorePreviewVideoUploadSuccessEvent,
  createStorePreviewVideoUploadFailureEvent,
};
