import { getResponseFromError } from '@modules/clients/utils';
import { ErrorResponse } from '@rbx/clients/webhookConfigurationGateway/v1';

const extractWebhooksErrorCode = async (error: unknown) => {
  const responseError = getResponseFromError(error);
  if (responseError?.body && typeof responseError.json === 'function') {
    const errorResponse: ErrorResponse = await responseError.json();
    return errorResponse?.code?.toString();
  }

  return undefined;
};

export default extractWebhooksErrorCode;
