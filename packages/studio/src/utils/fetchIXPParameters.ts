import { getCurrentPlatform, Platform } from '@rbx/core';

export type IXPParameters = {
  enablePersonalizedInstaller: boolean;
  enableDummyCodeInInstaller: boolean;
  enablePersonalizedInstallerInMac: boolean;
};

// Reusable layer fetcher
const fetchIXPParamsForLayer = async (
  baseURL: string,
  layer: string,
  parameters: string
): Promise<Record<string, boolean>> => {
  const url = `${baseURL}/product-experimentation-platform/v1/projects/1/layers/${layer}/values?parameters=${parameters}`;

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  return response.json();
};

const fetchIXPParameters = async (baseURL: string): Promise<IXPParameters> => {
  const platform = getCurrentPlatform();

  if (platform === Platform.macOS) {
    const macParams = await fetchIXPParamsForLayer(
      baseURL,
      'CreatorHubStudioInMac',
      'enablePersonalizedInstallerInMac'
    );

    return {
      enablePersonalizedInstaller: false,
      enableDummyCodeInInstaller: false,
      enablePersonalizedInstallerInMac: macParams.enablePersonalizedInstallerInMac ?? false,
    };
  }
  if (platform === Platform.Windows) {
    const studioParams = await fetchIXPParamsForLayer(
      baseURL,
      'CreatorHubStudio',
      'enableDummyCodeInInstaller,enablePersonalizedInstaller'
    );

    return {
      enablePersonalizedInstaller: studioParams.enablePersonalizedInstaller ?? false,
      enableDummyCodeInInstaller: studioParams.enableDummyCodeInInstaller ?? false,
      enablePersonalizedInstallerInMac: false,
    };
  }
  // Fallback for unsupported platforms
  return {
    enablePersonalizedInstaller: false,
    enableDummyCodeInInstaller: false,
    enablePersonalizedInstallerInMac: false,
  };
};

const cachedFetchIXPParameters = (() => {
  let cachedRequest: Promise<IXPParameters>;
  return async (baseURL: string) => {
    if (!cachedRequest) {
      cachedRequest = fetchIXPParameters(baseURL);
    }
    return cachedRequest;
  };
})();

export default cachedFetchIXPParameters;
