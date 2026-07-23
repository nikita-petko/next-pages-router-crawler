import { useMutation } from '@tanstack/react-query';
import { captureException } from '@sentry/nextjs';
import { contentLicensingClient } from '@modules/clients';
import { ModerationResponse } from '@rbx/clients/contentLicensingApi/v1';

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
