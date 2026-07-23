import { useCallback, useState } from 'react';
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
import { MomentCreationStatus } from '../types/MomentCreation';
import type { StoredMomentCreation } from '../types/StoredMomentCreation';
import { parseMomentsLocalStorageRaw } from '../utils/momentsLocalDraftStorage';
import { saveMomentVideoMediaWithEviction } from '../utils/momentsVideoMediaStorage';

type UploadMomentsVideoParams = {
  experience: TExperience;
  file: File;
};

type UploadMomentsVideosParams = {
  experience: TExperience;
  files: File[];
};

export type UploadMomentsVideosResult = {
  moments: StoredMomentCreation[];
  storageEvictedMediaMomentIds: string[];
};

const getDraftMomentsForStorageEviction = (
  userId: number,
  batchDrafts: readonly StoredMomentCreation[],
): StoredMomentCreation[] => {
  const storedDrafts = parseMomentsLocalStorageRaw(
    window.localStorage.getItem(getMomentsLocalStorageKey(userId)),
  ).filter((moment) => moment.status === MomentCreationStatus.DRAFT);
  const batchIds = new Set(batchDrafts.map((moment) => moment.id));

  return [...batchDrafts, ...storedDrafts.filter((moment) => !batchIds.has(moment.id))];
};

const persistUploadedVideo = async (
  userId: number,
  momentId: string,
  file: File,
  batchDrafts: readonly StoredMomentCreation[],
): Promise<{ hasLocalVideo: boolean; storageEvictedMediaMomentIds: string[] }> => {
  const persistContext = {
    momentId,
    fileSize: file.size,
    fileType: file.type,
  };

  logMomentsCreationsAttempt(MomentsCreationsOperation.PersistLocalVideo, persistContext);

  try {
    const { evictedMediaMomentIds } = await saveMomentVideoMediaWithEviction(
      userId,
      momentId,
      file,
      getDraftMomentsForStorageEviction(userId, batchDrafts),
    );

    logMomentsCreationsSuccess(MomentsCreationsOperation.PersistLocalVideo, persistContext);

    return {
      hasLocalVideo: true,
      storageEvictedMediaMomentIds: evictedMediaMomentIds,
    };
  } catch (storageError) {
    logMomentsCreationsError(MomentsCreationsErrorOperation.PersistLocalVideo, storageError, {
      momentId,
      fileSize: file.size,
      fileType: file.type,
    });
    return {
      hasLocalVideo: false,
      storageEvictedMediaMomentIds: [],
    };
  }
};

export const useMomentsVideoUpload = () => {
  const { user } = useAuthentication();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadVideo = useCallback(
    async ({ experience, file }: UploadMomentsVideoParams): Promise<StoredMomentCreation> => {
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
          file,
          onProgress: setUploadProgress,
        });
        const { hasLocalVideo } = await persistUploadedVideo(userId, moment.id, file, []);

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
      files,
    }: UploadMomentsVideosParams): Promise<UploadMomentsVideosResult> => {
      const userId = user?.id;
      if (userId == null) {
        throw new Error('Cannot upload Moments video without a signed-in user');
      }

      if (files.length === 0) {
        return { moments: [], storageEvictedMediaMomentIds: [] };
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const uploadedMoments: StoredMomentCreation[] = [];
        const storageEvictedMediaMomentIds: string[] = [];

        for (const file of files) {
          const moment = await momentsCreationsClient.uploadMomentVideo({
            experienceId: experience.id,
            experienceName: experience.name ?? '',
            rootPlaceId: experience.rootPlaceId,
            file,
            onProgress: setUploadProgress,
          });
          const { hasLocalVideo, storageEvictedMediaMomentIds: evictedForFile } =
            await persistUploadedVideo(userId, moment.id, file, uploadedMoments);

          storageEvictedMediaMomentIds.push(...evictedForFile);
          uploadedMoments.push({
            ...moment,
            hasLocalVideo,
          });
        }

        return {
          moments: uploadedMoments,
          storageEvictedMediaMomentIds: [...new Set(storageEvictedMediaMomentIds)],
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
