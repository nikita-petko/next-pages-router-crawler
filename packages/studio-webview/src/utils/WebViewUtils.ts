declare global {
  interface Navigator {
    deviceMemory?: number;
  }
}

export function isWebViewAvailable(): boolean {
  const userAgent = window?.navigator?.userAgent;
  return (
    window?.rbx?.studio.isPrewarm !== true &&
    window?.rbx?.postMessage !== undefined &&
    userAgent !== undefined &&
    userAgent.includes('RobloxStudio')
  );
}

/**
 * Determines if the device is above the recommended specifications using RAM as a proxy using navigator.deviceMemory.
 * If navigator.deviceMemory is not available, we assume the device is above recommended spec.
 * @returns If the device is above recommended spec
 */
export function isRecommendedSpecOrAbove(): boolean {
  // navigator.deviceMemory can only return values in buckets of: 0.25, 0.5, 1, 2, 4, 8
  const deviceMemory = window?.navigator?.deviceMemory;

  return deviceMemory === undefined || deviceMemory >= 8;
}

/**
 * Gets the studio version from the user agent.
 * @returns The studio version or empty string if not found
 */
export function getStudioVersion(): string {
  const userAgent = window?.navigator?.userAgent;
  if (!userAgent) {
    return '';
  }

  const studioVersionRegex = userAgent.match(/RobloxApp\/([\d.]+)/);
  if (studioVersionRegex && studioVersionRegex.length > 1) {
    return studioVersionRegex[1];
  }

  return '';
}

export function getOsVersion(): string {
  return window?.rbx?.studio?.osVersion ?? '';
}

export function getOsPlatform(): string {
  return window?.rbx?.studio?.osPlatform ?? '';
}
