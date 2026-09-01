import { getCurrentPlatform, Platform } from '@rbx/core';

export type IXPParameters = {
  enablePersonalizedInstaller: boolean;
  enableDummyCodeInInstaller: boolean;
  enablePersonalizedInstallerInMac: boolean;
  enablePersonalizedStudioLaunch: boolean;
  enablePersonalizedStudioLaunchInMac: boolean;
};

// Reusable layer fetcher
const fetchIXPParamsForLayer = async (
  baseURL: string,
  layer: string,
  parameters: string,
): Promise<Record<string, boolean>> => {
  const url = `${baseURL}/product-experimentation-platform/v1/projects/1/layers/${layer}/values?parameters=${parameters}`;

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- IXP layer endpoint returns Record<string, boolean>; response.json() is untyped
  return response.json() as Promise<Record<string, boolean>>;
};

const fetchIXPParameters = async (baseURL: string): Promise<IXPParameters> => {
  const platform = getCurrentPlatform();

  if (platform === Platform.macOS) {
    const macParams = await fetchIXPParamsForLayer(
      baseURL,
      'CreatorHubStudioInMac',
      'enablePersonalizedInstallerInMac,enablePersonalizedStudioLaunchInMac',
    );

    return {
      enablePersonalizedInstaller: false,
      enableDummyCodeInInstaller: false,
      enablePersonalizedInstallerInMac: macParams.enablePersonalizedInstallerInMac ?? false,
      enablePersonalizedStudioLaunch: false,
      enablePersonalizedStudioLaunchInMac: macParams.enablePersonalizedStudioLaunchInMac ?? false,
    };
  }
  if (platform === Platform.Windows) {
    const studioParams = await fetchIXPParamsForLayer(
      baseURL,
      'CreatorHubStudio',
      'enableDummyCodeInInstaller,enablePersonalizedInstaller,enablePersonalizedStudioLaunch',
    );

    return {
      enablePersonalizedInstaller: studioParams.enablePersonalizedInstaller ?? false,
      enableDummyCodeInInstaller: studioParams.enableDummyCodeInInstaller ?? false,
      enablePersonalizedInstallerInMac: false,
      enablePersonalizedStudioLaunch: studioParams.enablePersonalizedStudioLaunch ?? false,
      enablePersonalizedStudioLaunchInMac: false,
    };
  }
  // Fallback for unsupported platforms
  return {
    enablePersonalizedInstaller: false,
    enableDummyCodeInInstaller: false,
    enablePersonalizedInstallerInMac: false,
    enablePersonalizedStudioLaunch: false,
    enablePersonalizedStudioLaunchInMac: false,
  };
};

const cachedFetchIXPParameters = (() => {
  let cachedRequest: Promise<IXPParameters> | undefined;
  return async (baseURL: string) => {
    cachedRequest ??= fetchIXPParameters(baseURL);
    return cachedRequest;
  };
})();

export default cachedFetchIXPParameters;
