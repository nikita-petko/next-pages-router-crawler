type VideoUploadEventParams = {
  fileSize: number;
  creatorId: number;
  duration?: number;
  error?: string;
};

const createVideoUploadStartEvent = (params: VideoUploadEventParams) => ({
  eventName: 'placeThumbnailsVideoUploadStart',
  parameters: {
    AssetType: 'GamePreviewVideo',
    FileSize: params.fileSize.toString(),
    CreatorId: params.creatorId.toString(),
  },
});

const createVideoUploadSuccessEvent = (params: VideoUploadEventParams) => ({
  eventName: 'placeThumbnailsVideoUploadSuccess',
  parameters: {
    AssetType: 'GamePreviewVideo',
    FileSize: params.fileSize.toString(),
    CreatorId: params.creatorId.toString(),
    Status: 'success',
    Duration: params.duration?.toString() || '0',
  },
});

const createVideoUploadFailureEvent = (params: VideoUploadEventParams) => ({
  eventName: 'placeThumbnailsVideoUploadFailure',
  parameters: {
    AssetType: 'GamePreviewVideo',
    CreatorId: params.creatorId.toString(),
    Error: params.error || 'Unknown error',
  },
});

export {
  createVideoUploadStartEvent,
  createVideoUploadSuccessEvent,
  createVideoUploadFailureEvent,
};
