import type {
  StudioFetchers,
  StudioDialogErrorHandler,
  StudioDialogParams,
  TRobloxEnvironment,
  TRobloxTarget,
} from '../types';
import getBedev2Path from './getBedev2Path';
import { getClientId } from './getClientIds';
import getDownloadUrl from './getDownloadUrl';

type TCreateStudioResourcesArguments = {
  logoSrc: string;
  environment: TRobloxEnvironment;
  target: TRobloxTarget;
  fetchers: StudioFetchers;
  errorHandler?: StudioDialogErrorHandler;
};

export function createStudioResources({
  logoSrc,
  environment,
  target,
  fetchers,
  errorHandler,
}: TCreateStudioResourcesArguments) {
  const clientId = getClientId(environment, target);
  const bedev2BasePath = getBedev2Path(environment);
  const downloadURL = getDownloadUrl(environment, target);

  return {
    logoSrc,
    downloadURL,
    bedev2BasePath,
    clientId,
    async fetchUserChannel(): Promise<string> {
      const channelName = await fetchers.userChannel();

      if (typeof channelName === 'undefined' || channelName.toUpperCase() === 'LIVE') {
        return '';
      }

      return channelName;
    },
    onError(error: Error, params: StudioDialogParams): void {
      errorHandler?.(error, params);
    },
  };
}

export type TStudioResources = ReturnType<typeof createStudioResources>;
