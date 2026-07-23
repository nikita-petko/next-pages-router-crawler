import { captureException } from '@sentry/nextjs';
import { useMutation } from '@tanstack/react-query';
import type { ModerationResponse } from '@rbx/client-content-licensing-api/v1';
import contentLicensingClient from '@modules/clients/contentLicensing';

interface ModerationMutationResult {
  response: ModerationResponse;
}

const useContentModerationMutation = () => {
  return useMutation({
    mutationFn: async (message: string): Promise<ModerationMutationResult> => {
      const response = await contentLicensingClient.moderateMessage(message);
      return {
        response,
      };
    },
    onError: (error, message) => {
      captureException(error, {
        tags: { module: 'licenses', operation: 'moderateMessage' },
        extra: { messageLength: message.length },
      });
    },
  });
};

export default useContentModerationMutation;
