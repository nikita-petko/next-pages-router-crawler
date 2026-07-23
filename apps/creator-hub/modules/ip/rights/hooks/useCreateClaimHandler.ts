import { useCallback } from 'react';
import { getResponseFromError } from '@modules/clients/utils';
import useCreateClaim from './useCreateClaim';
import useSubmitClaim from './useSubmitClaim';
import { TakedownRequest } from '../components/createRemovalRequest/CreateRemovalRequestContainer';

function isUUID(message: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(message);
}

type CreateClaimData = {
  accountId: string;
  userId: string;
  snapshotId?: string;
  description: string;
  takedownRequests: TakedownRequest[];
};

export default function useCreateClaimHandler() {
  const createClaim = useCreateClaim();
  const submitClaim = useSubmitClaim();

  const handlerIsSuccess = submitClaim.isSuccess;
  const handlerIsPending = createClaim.isPending || submitClaim.isPending;
  const handlerIsError = submitClaim.isError || (createClaim.isError && submitClaim.isIdle);

  const createClaimErrorStatus = getResponseFromError(createClaim.error)?.status;
  const submitClaimErrorStatus = getResponseFromError(submitClaim.error)?.status;

  const createClaimRetryLimited = createClaimErrorStatus === 409;
  const shouldToastRateLimit = createClaimErrorStatus === 429;
  const shouldToastConflict = createClaimRetryLimited && submitClaim.isSuccess;
  const shouldEditConflictClaim = createClaimRetryLimited && submitClaim.isIdle;

  const shouldEditBadRequestClaim =
    createClaimErrorStatus === 400 || submitClaimErrorStatus === 400;
  const shouldRetryCreateClaim =
    handlerIsError && !shouldEditBadRequestClaim && !shouldEditConflictClaim;

  const handler = async (data: CreateClaimData) => {
    let claim;
    try {
      claim = await createClaim.mutateAsync(data);
      await submitClaim.mutateAsync({ accountId: data.accountId, claimId: claim.id ?? '' });
    } catch (error) {
      const response = getResponseFromError(error);
      if (response?.status === 409) {
        const { message: errorMessage } = await response.json();
        if (isUUID(errorMessage)) {
          await submitClaim.mutateAsync({ accountId: data.accountId, claimId: errorMessage });
        }
      }
    }
  };

  const handlerReset = useCallback(() => {
    createClaim.reset();
    submitClaim.reset();
  }, [createClaim, submitClaim]);

  const handlerResult = {
    createClaim: createClaim?.data ?? null,
    submitClaim: submitClaim?.data ?? null,
  };

  return {
    handler,
    handlerResult,
    handlerReset,
    handlerIsSuccess,
    handlerIsPending,
    handlerIsError,
    shouldToastConflict,
    shouldEditConflictClaim,
    shouldEditBadRequestClaim,
    shouldRetryCreateClaim,
    shouldToastRateLimit,
  };
}
