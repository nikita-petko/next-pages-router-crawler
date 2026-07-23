import type { ErrorResponse } from '@rbx/client-webhook-configuration-gateway/v1';
import { getResponseFromError } from '@modules/clients/utils';

const extractWebhooksErrorCode = async (error: unknown) => {
  const responseError = getResponseFromError(error);
  if (responseError?.body && typeof responseError.json === 'function') {
    const errorResponse: ErrorResponse = await responseError.json();
    return errorResponse?.code?.toString();
  }

  return;
};

export default extractWebhooksErrorCode;
