import { useExperienceAnalyticsGameDetails } from './ExperienceAnalyticsGameDetailsProvider';

/** @deprecated -- call useUniverseResource() instead */
const useUniverseID = () => {
  // TODO(gperkins@20240813): Call useUniverseResource() instead of game details
  //  (will also need to move UniverseResourceProvider into ExperienceAnalyticsPageContextProvider)
  const { universeId } = useExperienceAnalyticsGameDetails();
  return universeId;
};
// eslint-disable-next-line deprecation/deprecation -- gradual deprecation
export default useUniverseID;

// eslint-disable-next-line deprecation/deprecation -- gradual deprecation
export const useUniverseIdDeprecatedFromAnalytics = useUniverseID;
