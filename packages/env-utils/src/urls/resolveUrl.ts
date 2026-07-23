import type { TBuildTarget, TRobloxEnvironment } from '../types';
import type { TUrlMapKey } from './urlMap';
import URL_MAP from './urlMap';

const resolveUrl = (
  urlSemanticName: TUrlMapKey,
  envKey: TRobloxEnvironment,
  targetKey: TBuildTarget,
): string => {
  const resolvedUrl = URL_MAP[urlSemanticName]?.[targetKey]?.[envKey];
  if (!resolvedUrl) {
    console.warn(
      `No URL found for ${urlSemanticName} in environment ${envKey} and target ${targetKey}`,
    );

    return '';
  }

  return resolvedUrl;
};

export default resolveUrl;
