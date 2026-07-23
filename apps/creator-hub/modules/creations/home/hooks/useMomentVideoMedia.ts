import { useEffect, useMemo, useState } from 'react';
import { useAuthentication } from '@modules/authentication/providers';
import {
  logMomentsCreationsError,
  MomentsCreationsErrorOperation,
} from '../logging/momentsCreationsErrorLogging';
import {
  logMomentsCreationsAttempt,
  logMomentsCreationsSuccess,
  MomentsCreationsOperation,
} from '../logging/momentsCreationsEventLogging';
import type { MomentVideoMediaUrls } from '../utils/momentsVideoMediaStorage';
import { getMomentVideoMediaUrls } from '../utils/momentsVideoMediaStorage';

type UseMomentVideoMediaOptions = {
  enabled: boolean;
  thumbnailUrl?: string;
  videoUrl?: string;
};

const toPropMediaUrls = (thumbnailUrl?: string, videoUrl?: string): MomentVideoMediaUrls | null => {
  if (!thumbnailUrl && !videoUrl) {
    return null;
  }

  return {
    thumbnailUrl: thumbnailUrl ?? '',
    videoUrl: videoUrl ?? '',
  };
};

export const useMomentVideoMedia = (momentId: string, options: UseMomentVideoMediaOptions) => {
  const { user } = useAuthentication();
  const { enabled, thumbnailUrl, videoUrl } = options;
  const userId = user?.id;

  const propMediaUrls = useMemo(
    () => toPropMediaUrls(thumbnailUrl, videoUrl),
    [thumbnailUrl, videoUrl],
  );

  const [fetchedMediaUrls, setFetchedMediaUrls] = useState<MomentVideoMediaUrls | null>(null);

  useEffect(() => {
    if (propMediaUrls || userId == null || !enabled) {
      return undefined;
    }

    let cancelled = false;

    const loadMediaUrls = async () => {
      const loadContext = { momentId, userId };
      logMomentsCreationsAttempt(MomentsCreationsOperation.LoadLocalVideoMedia, loadContext);

      try {
        const localMediaUrls = await getMomentVideoMediaUrls(userId, momentId);
        if (!cancelled) {
          setFetchedMediaUrls(localMediaUrls);
          if (localMediaUrls != null) {
            logMomentsCreationsSuccess(MomentsCreationsOperation.LoadLocalVideoMedia, loadContext);
          }
        }
      } catch (mediaLoadError) {
        logMomentsCreationsError(
          MomentsCreationsErrorOperation.LoadLocalVideoMedia,
          mediaLoadError,
          {
            momentId,
          },
        );
        if (!cancelled) {
          setFetchedMediaUrls(null);
        }
      }
    };

    void loadMediaUrls();

    return () => {
      cancelled = true;
    };
  }, [enabled, momentId, propMediaUrls, userId]);

  if (propMediaUrls) {
    return propMediaUrls;
  }

  if (!enabled) {
    return null;
  }

  return fetchedMediaUrls;
};
