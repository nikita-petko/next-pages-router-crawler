import { useCallback, useMemo, useState } from 'react';
import type { VideoUploadProgressCallbacks } from './useUploadPreviewVideoMutation';

const UPLOAD_PHASE_WEIGHT = 0.35;
const TRANSCODE_PHASE_START = 35;
const TRANSCODE_PHASE_WEIGHT = 0.55;
const ASSOCIATE_PHASE_START = 90;
const ASSOCIATE_PHASE_WEIGHT = 0.1;

/**
 * Manages video upload progress state and maps per-phase poll callbacks to a
 * unified 0–100 progress value.
 *
 * Phase boundaries (matching Game Preview / useUploadAssetForPlaceMutation):
 *   0–35%  : multipart file upload
 *   35–90% : create operation polling (transcoding)
 *   90–100%: association operation polling
 */
const useVideoUploadProgress = () => {
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  const progressCallbacks: VideoUploadProgressCallbacks = useMemo(
    () => ({
      onMultipartUploadProgress: (progress: number) =>
        setVideoUploadProgress(progress * UPLOAD_PHASE_WEIGHT),
      onUploadOperationPollProgress: (progress: number) =>
        setVideoUploadProgress(TRANSCODE_PHASE_START + progress * TRANSCODE_PHASE_WEIGHT),
      onAssociateOperationPollProgress: (progress: number) =>
        setVideoUploadProgress(ASSOCIATE_PHASE_START + progress * ASSOCIATE_PHASE_WEIGHT),
    }),
    [],
  );

  const resetProgress = useCallback(() => setVideoUploadProgress(0), []);

  return { videoUploadProgress, progressCallbacks, resetProgress };
};

export default useVideoUploadProgress;
