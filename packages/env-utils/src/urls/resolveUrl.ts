import { TBuildTarget, TRobloxEnvironment } from "../types";
import URL_MAP, { TUrlMapKey } from "./urlMap";

const resolveUrl = (
  urlSemanticName: TUrlMapKey,
  envKey: TRobloxEnvironment,
  targetKey: TBuildTarget
): string => {
  const resolvedUrl = URL_MAP[urlSemanticName]?.[targetKey]?.[envKey];
  if (!resolvedUrl) {
    // eslint-disable-next-line no-console
    console.warn(
      `No URL found for ${urlSemanticName} in environment ${envKey} and target ${targetKey}`
    );

    return "";
  }

  return resolvedUrl;
};

export default resolveUrl;
