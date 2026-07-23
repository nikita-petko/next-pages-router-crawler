import { useRouter } from 'next/router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { studiosApi } from '../api/talentHubClient';
import { th2QueryKeys } from '../queryKeys';
import type { CreateStudioRequest, Studio } from '../types';
import { isMocksEnabled, isRuntimeMocksQueryEnabled } from '../utils';

export function useCreateStudio() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mocks = isMocksEnabled() || isRuntimeMocksQueryEnabled(router.query.mocks);

  return useMutation({
    mutationFn: async (createStudioRequest: CreateStudioRequest): Promise<Studio> => {
      if (mocks) {
        const { MOCK_CREATE_STUDIO_RESPONSE } = await import('../mocks/mockData');
        // Client `Studio` model is not structurally identical to the TH2 `Studio` alias (permissions/location).
        return {
          ...MOCK_CREATE_STUDIO_RESPONSE,
          name: createStudioRequest.name,
          email: createStudioRequest.email,
          description: createStudioRequest.description,
          teamSize: createStudioRequest.teamSize,
          groupId: createStudioRequest.groupId,
          website: createStudioRequest.website ?? null,
          topExperienceUniverseIds: createStudioRequest.topExperienceUniverseIds ?? null,
        } as Studio;
      }
      const created = await studiosApi.apiStudiosPost({ createStudioRequest });
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- generated client return narrowed to TH2 `Studio`
      return created as Studio;
    },
    onSuccess: () => {
      // After a successful create, the destination /hire/my-studio page reads
      // from `useMyStudios` (keyed as `[..., 'my-studios', ...]`), not the
      // public studio catalog. Invalidating only the catalog would leave the
      // cached empty list intact and the user would see the "Apply to post"
      // empty state alongside the "Studio created successfully" Snackbar.
      void queryClient.invalidateQueries({ queryKey: th2QueryKeys.myStudios.all });
      // Public catalog may also include this newly-created studio once it
      // surfaces server-side; refresh it so navigations elsewhere are fresh.
      void queryClient.invalidateQueries({ queryKey: th2QueryKeys.studios.all });
    },
  });
}
