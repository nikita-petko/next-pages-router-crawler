import { useCallback, useState } from 'react';
import type { Locale } from '@rbx/intl';
import { useAuthentication } from '@modules/authentication/providers';
import type { TExperience } from '@modules/home/providers/ExperienceProvider';
import momentsCreationsClient from '../clients/momentsCreationsClient';
import { getMomentsLocalStorageKey } from '../constants/momentsLocalDraftConstants';
import {
  logMomentsCreationsError,
  MomentsCreationsErrorOperation,
} from '../logging/momentsCreationsErrorLogging';
import {
  logMomentsCreationsAttempt,
  logMomentsCreationsSuccess,
  MomentsCreationsOperation,
} from '../logging/momentsCreationsEventLogging';
import type { DraftMomentCreation } from '../types/MomentCreation';
import { parseMomentsLocalStorageRaw } from '../utils/momentsLocalDraftStorage';
import { saveMomentVideoMediaWithEviction } from '../utils/momentsVideoMediaStorage';

type UploadMomentsVideoParams = {
  experience: TExperience;
  locale?: Locale;
  file: File;
};

type UploadMomentsVideosParams = {
  experience: TExperience;
  locale?: Locale;
  files: File[];
};

export type UploadMomentsVideosResult = {
  moments: DraftMomentCreation[];
  storageEvictedMediaDraftIds: string[];
};

// `parseMomentsLocalStorageRaw` already yields drafts only, so no status filter is needed.
const getDraftMomentsForStorageEviction = (
  userId: number,
  batchDrafts: readonly DraftMomentCreation[],
): DraftMomentCreation[] => {
  const storedDrafts = parseMomentsLocalStorageRaw(
    window.localStorage.getItem(getMomentsLocalStorageKey(userId)),
  );
  const batchIds = new Set(batchDrafts.map((moment) => moment.draftId));

  return [...batchDrafts, ...storedDrafts.filter((moment) => !batchIds.has(moment.draftId))];
};

const persistUploadedVideo = async (
  userId: number,
  draftId: string,
  file: File,
  batchDrafts: readonly DraftMomentCreation[],
): Promise<{ hasLocalVideo: boolean; storageEvictedMediaDraftIds: string[] }> => {
  const persistContext = {
    draftId,
    fileSize: file.size,
    fileType: file.type,
  };

  logMomentsCreationsAttempt(MomentsCreationsOperation.PersistLocalVideo, persistContext);

  try {
    const { evictedMediaDraftIds } = await saveMomentVideoMediaWithEviction(
      userId,
      draftId,
      file,
      getDraftMomentsForStorageEviction(userId, batchDrafts),
    );

    logMomentsCreationsSuccess(MomentsCreationsOperation.PersistLocalVideo, persistContext);

    return {
      hasLocalVideo: true,
      storageEvictedMediaDraftIds: evictedMediaDraftIds,
    };
  } catch (storageError) {
    logMomentsCreationsError(MomentsCreationsErrorOperation.PersistLocalVideo, storageError, {
      draftId,
      fileSize: file.size,
      fileType: file.type,
    });
    return {
      hasLocalVideo: false,
      storageEvictedMediaDraftIds: [],
    };
  }
};

export const useMomentsVideoUpload = () => {
  const { user } = useAuthentication();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadVideo = useCallback(
    async ({
      experience,
      locale,
      file,
    }: UploadMomentsVideoParams): Promise<DraftMomentCreation> => {
      const userId = user?.id;
      if (userId == null) {
        throw new Error('Cannot upload Moments video without a signed-in user');
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const moment = await momentsCreationsClient.uploadMomentVideo({
          experienceId: experience.id,
          experienceName: experience.name ?? '',
          rootPlaceId: experience.rootPlaceId,
          ...(locale != null ? { locale } : {}),
          file,
          onProgress: setUploadProgress,
        });
        const { hasLocalVideo } = await persistUploadedVideo(userId, moment.draftId, file, []);

        return {
          ...moment,
          hasLocalVideo,
        };
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [user?.id],
  );

  const uploadVideos = useCallback(
    async ({
      experience,
      locale,
      files,
    }: UploadMomentsVideosParams): Promise<UploadMomentsVideosResult> => {
      const userId = user?.id;
      if (userId == null) {
        throw new Error('Cannot upload Moments video without a signed-in user');
      }

      if (files.length === 0) {
        return { moments: [], storageEvictedMediaDraftIds: [] };
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const uploadedMoments: DraftMomentCreation[] = [];
        const storageEvictedMediaDraftIds: string[] = [];

        for (const file of files) {
          const moment = await momentsCreationsClient.uploadMomentVideo({
            experienceId: experience.id,
            experienceName: experience.name ?? '',
            rootPlaceId: experience.rootPlaceId,
            ...(locale != null ? { locale } : {}),
            file,
            onProgress: setUploadProgress,
          });
          const { hasLocalVideo, storageEvictedMediaDraftIds: evictedForFile } =
            await persistUploadedVideo(userId, moment.draftId, file, uploadedMoments);

          storageEvictedMediaDraftIds.push(...evictedForFile);
          uploadedMoments.push({
            ...moment,
            hasLocalVideo,
          });
        }

        return {
          moments: uploadedMoments,
          storageEvictedMediaDraftIds: [...new Set(storageEvictedMediaDraftIds)],
        };
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [user?.id],
  );

  return { uploadVideo, uploadVideos, isUploading, uploadProgress };
};
