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

/**
 * Loads a local draft's video/thumbnail blob URLs from IndexedDB.
 *
 * `draftId` is nullable so callers holding a `MomentCreation` union can pass `null` for a
 * server-backed moment without inventing a placeholder id; the hook then skips the read entirely.
 */
export const useMomentVideoMedia = (
  draftId: string | null,
  options: UseMomentVideoMediaOptions,
) => {
  const { user } = useAuthentication();
  const { enabled, thumbnailUrl, videoUrl } = options;
  const userId = user?.id;

  const propMediaUrls = useMemo(
    () => toPropMediaUrls(thumbnailUrl, videoUrl),
    [thumbnailUrl, videoUrl],
  );

  const [fetchedMediaUrls, setFetchedMediaUrls] = useState<MomentVideoMediaUrls | null>(null);

  useEffect(() => {
    if (propMediaUrls || userId == null || !enabled || draftId == null || draftId === '') {
      return undefined;
    }

    let cancelled = false;

    const loadMediaUrls = async () => {
      const loadContext = { draftId, userId };
      logMomentsCreationsAttempt(MomentsCreationsOperation.LoadLocalVideoMedia, loadContext);

      try {
        const localMediaUrls = await getMomentVideoMediaUrls(userId, draftId);
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
            draftId,
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
  }, [draftId, enabled, propMediaUrls, userId]);

  if (propMediaUrls) {
    return propMediaUrls;
  }

  if (!enabled) {
    return null;
  }

  return fetchedMediaUrls;
};
