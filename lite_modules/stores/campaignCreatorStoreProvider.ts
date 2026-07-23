import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { getUserAvatarHeadshots } from '@services/thumbnails/getThumbnailService';
import { getUsersByIds } from '@services/users/getUsersService';
import { ThumbnailType } from '@type/thumbnail';
import { CaptureException } from '@utils/error';
import { RequestStateType } from '@utils/zustandUtils';

interface CampaignCreatorProfile {
  avatarUrl?: string;
  username: string;
}

interface CampaignCreatorStoreStateType {
  creatorProfilesByUserId: Record<number, RequestStateType<CampaignCreatorProfile | undefined>>;
}

interface CampaignCreatorStoreActionType {
  getCampaignCreatorsBatch: (userIds: number[]) => Promise<void>;
}

export interface CampaignCreatorStoreType
  extends CampaignCreatorStoreStateType, CampaignCreatorStoreActionType {}

const BATCH_SIZE = 100;

const getUniqueUserIdsToFetch = (
  userIds: number[],
  creatorProfilesByUserId: CampaignCreatorStoreStateType['creatorProfilesByUserId'],
): number[] =>
  Array.from(new Set(userIds)).filter((userId) => {
    const existing = creatorProfilesByUserId[userId];
    return existing === undefined || existing.isError;
  });

const chunkUserIds = (userIds: number[]): number[][] => {
  const batches: number[][] = [];
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    batches.push(userIds.slice(i, i + BATCH_SIZE));
  }
  return batches;
};

export const useCampaignCreatorStore = create<CampaignCreatorStoreType>()(
  immer((set, get) => ({
    creatorProfilesByUserId: {},
    getCampaignCreatorsBatch: async (userIds: number[]) => {
      const idsToFetch = getUniqueUserIdsToFetch(userIds, get().creatorProfilesByUserId);
      if (idsToFetch.length === 0) {
        return;
      }

      set((draft) => {
        idsToFetch.forEach((userId) => {
          draft.creatorProfilesByUserId[userId] = {
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
              context: 'campaignCreatorStore.getUsersByIds',
            });
          }

          if (avatarsResult.status === 'rejected') {
            CaptureException(avatarsResult.reason, {
              context: 'campaignCreatorStore.getUserAvatarHeadshots',
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
              draft.creatorProfilesByUserId[userId] = {
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
  })),
);
