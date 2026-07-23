import { getResponseFromError } from '@modules/clients/utils';

const isExperimentCreationErrorDueToDuplicatedName = async (error: unknown) => {
  const response = getResponseFromError(error);
  if (!response || response.status !== 400) {
    return false;
  }

  const responseBody = await response.json();
  if (responseBody.message !== 'ExperimentWithSameNameAlreadyExist') {
    return false;
  }
  return true;
};

export default isExperimentCreationErrorDueToDuplicatedName;
