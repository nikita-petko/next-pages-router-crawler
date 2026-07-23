import { useEffect, useRef } from 'react';

import { UploadedVideoType } from '@type/fileUpload';
import { VideoURLManager } from '@utils/fileUpload';

interface VideoResourceManagerOptions {
  autoCleanupOnUnmount?: boolean;
}

interface VideoResourceManagerReturn {
  cleanup: () => void;
  trackVideo: (videoId: string) => void;
  untrackVideo: (videoId: string) => void;
}

export const useVideoResourceManager = (
  videos: UploadedVideoType[] = [],
  options: VideoResourceManagerOptions = {},
): VideoResourceManagerReturn => {
  const { autoCleanupOnUnmount = true } = options;
  const prevVideoIdsRef = useRef<string[]>([]);
  const trackedVideosRef = useRef<Set<string>>(new Set());

  const trackVideo = (videoId: string) => {
    trackedVideosRef.current.add(videoId);
  };

  const untrackVideo = (videoId: string) => {
    trackedVideosRef.current.delete(videoId);
    VideoURLManager.revokeVideoURL(videoId);
  };

  const cleanup = () => {
    trackedVideosRef.current.forEach((videoId) => {
      VideoURLManager.revokeVideoURL(videoId);
    });
    trackedVideosRef.current.clear();
  };

  useEffect(() => {
    const currentVideoIds = videos?.map((v) => v.id).filter(Boolean) || [];
    const prevVideoIds = prevVideoIdsRef.current;
    const removedVideoIds = prevVideoIds.filter((id) => !currentVideoIds.includes(id));

    removedVideoIds.forEach((id: string) => {
      if (trackedVideosRef.current.has(id)) {
        untrackVideo(id);
      }
    });

    prevVideoIdsRef.current = currentVideoIds;
  }, [videos]);

  useEffect(() => {
    if (autoCleanupOnUnmount) {
      return () => {
        VideoURLManager.cleanup();
      };
    }
    return undefined;
  }, [autoCleanupOnUnmount]);

  return {
    cleanup,
    trackVideo,
    untrackVideo,
  };
};
