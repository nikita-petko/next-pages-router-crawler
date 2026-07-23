import { UploadedVideoType, VideoUploadState } from '@type/fileUpload';

/**
 * Simple video state helpers - replaces complex VideoStateMachine
 *
 * Basic flow: createVideo → startUpload → updateProgress → finishUpload/errorUpload
 */

export const CreateStagedVideo = (file: File, id: string): UploadedVideoType => ({
  file,
  id,
  progress: 0,
  state: VideoUploadState.STAGED,
});

export const CreateExistingAssetVideo = (assetId: string, videoId?: string): UploadedVideoType => ({
  assetId,
  file: new Blob([], { type: 'video/mp4' }), // Empty blob for existing assets - video components handle this gracefully
  id: videoId || `existing-asset-${assetId}`,
  progress: 100,
  state: VideoUploadState.FINISHED,
});

export const StartVideoUpload = (video: UploadedVideoType): UploadedVideoType => ({
  ...video,
  error: undefined,
  state: VideoUploadState.UPLOADING,
});

export const FinishVideoUpload = (
  video: UploadedVideoType,
  assetId: string,
): UploadedVideoType => ({
  ...video,
  assetId,
  cancelCb: undefined,
  error: undefined,
  progress: 100,
  state: VideoUploadState.FINISHED,
});

export const ErrorVideoUpload = (video: UploadedVideoType, error: string): UploadedVideoType => ({
  ...video,
  cancelCb: undefined,
  error,
  state: VideoUploadState.ERROR,
});

export const ResetVideo = (video: UploadedVideoType): UploadedVideoType => ({
  ...video,
  assetId: undefined,
  cancelCb: undefined,
  error: undefined,
  progress: 0,
  state: VideoUploadState.STAGED,
});

// Collection helpers
export const GetVideosByState = (
  videos: Map<string, UploadedVideoType>,
  state: VideoUploadState,
): UploadedVideoType[] => Array.from(videos.values()).filter((video) => video?.state === state);

export const UpdateVideoInMap = (
  videos: Map<string, UploadedVideoType>,
  videoId: string,
  updatedVideo: UploadedVideoType,
): Map<string, UploadedVideoType> => {
  const newVideos = new Map(videos);
  newVideos.set(videoId, updatedVideo);
  return newVideos;
};

export const RemoveVideoFromMap = (
  videos: Map<string, UploadedVideoType>,
  videoId: string,
): Map<string, UploadedVideoType> => {
  const newVideos = new Map(videos);
  newVideos.delete(videoId);
  return newVideos;
};
