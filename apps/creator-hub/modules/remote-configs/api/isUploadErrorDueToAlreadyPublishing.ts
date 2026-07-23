import { getResponseFromError } from '@modules/clients/utils';

const isUploadErrorDueToAlreadyPublishing = async (error: unknown): Promise<boolean> => {
  const response = getResponseFromError(error);
  if (!response || response.status !== 400) {
    return false;
  }
  const responseBody = await response.json();
  if (responseBody.message !== 'MultipleDraftNotSupported') {
    return false;
  }
  return true;
};
export default isUploadErrorDueToAlreadyPublishing;
