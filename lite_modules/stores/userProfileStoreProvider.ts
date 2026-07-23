import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { getUserAvatarHeadshots } from '@services/thumbnails/getThumbnailService';
import { getUsersByIds } from '@services/users/getUsersService';
import { ThumbnailType } from '@type/thumbnail';
import { CaptureException } from '@utils/error';
import { RequestStateType } from '@utils/zustandUtils';

interface UserProfile {
  avatarUrl?: string;
  username: string;
}

interface UserProfileStoreStateType {
  userProfilesByUserId: Record<number, RequestStateType<UserProfile | undefined>>;
}

interface UserProfileStoreActionType {
  getUserProfilesBatch: (userIds: number[]) => Promise<void>;
}

export interface UserProfileStoreType
  extends UserProfileStoreStateType, UserProfileStoreActionType {}

const BATCH_SIZE = 100;

const getUniqueUserIdsToFetch = (
  userIds: number[],
  userProfilesByUserId: UserProfileStoreStateType['userProfilesByUserId'],
): number[] =>
  Array.from(new Set(userIds)).filter((userId) => {
    const existing = userProfilesByUserId[userId];
    return existing === undefined || existing.isError;
  });

const chunkUserIds = (userIds: number[]): number[][] => {
  const batches: number[][] = [];
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    batches.push(userIds.slice(i, i + BATCH_SIZE));
  }
  return batches;
};

export const useUserProfileStore = create<UserProfileStoreType>()(
  immer((set, get) => ({
    getUserProfilesBatch: async (userIds: number[]) => {
      const idsToFetch = getUniqueUserIdsToFetch(userIds, get().userProfilesByUserId);
      if (idsToFetch.length === 0) {
        return;
      }

      set((draft) => {
        idsToFetch.forEach((userId) => {
          draft.userProfilesByUserId[userId] = {
            data: undefined,
            isError: false,
            isLoading: true,
          };
        });
      });

      await Promise.all(
        chunkUserIds(idsToFetch).map(async (batch) => {
          const [usersResult, avatarsResult] = await Promise.allSettled([
            getUsersByIds(batch),
            getUserAvatarHeadshots(batch),
          ]);

          if (usersResult.status === 'rejected') {
            CaptureException(usersResult.reason, {
              context: 'userProfileStore.getUsersByIds',
            });
          }

          if (avatarsResult.status === 'rejected') {
            CaptureException(avatarsResult.reason, {
              context: 'userProfileStore.getUserAvatarHeadshots',
            });
          }

          const usersById =
            usersResult.status === 'fulfilled'
              ? new Map(usersResult.value.map((user) => [user.id, user.name]))
              : new Map<number, string>();
          const avatarsById =
            avatarsResult.status === 'fulfilled'
              ? new Map(
                  (avatarsResult.value.data as ThumbnailType[]).map((thumbnail) => [
                    thumbnail.targetId,
                    thumbnail.imageUrl,
                  ]),
                )
              : new Map<number, string>();

          set((draft) => {
            batch.forEach((userId) => {
              const username = usersById.get(userId);
              draft.userProfilesByUserId[userId] = {
                data: username
                  ? {
                      avatarUrl: avatarsById.get(userId),
                      username,
                    }
                  : undefined,
                isError: usersResult.status === 'rejected',
                isLoading: false,
              };
            });
          });
        }),
      );
    },
    userProfilesByUserId: {},
  })),
);
