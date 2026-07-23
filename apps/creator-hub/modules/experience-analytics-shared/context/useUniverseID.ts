import { useExperienceAnalyticsGameDetails } from './ExperienceAnalyticsGameDetailsProvider';

/** @deprecated -- call useUniverseResource() instead */
const useUniverseID = () => {
  // TODO(gperkins@20240813): Call useUniverseResource() instead of game details
  //  (will also need to move UniverseResourceProvider into ExperienceAnalyticsPageContextProvider)
  const { universeId } = useExperienceAnalyticsGameDetails();
  return universeId;
};
export default useUniverseID;

export const useUniverseIdDeprecatedFromAnalytics = useUniverseID;
