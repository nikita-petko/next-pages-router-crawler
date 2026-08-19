import targetPartConfiguration from '../constants/targetPartConfigurationConstants';

/**
 * Get the list endpoint associated with the given target part
 * @param targetPartName the name of the target part
 * @returns the list API or null (if target name has not been registered on the FE)
 */
export const getTargetPartListApi = (targetPartName: string) => {
  return targetPartConfiguration[targetPartName]?.getTargets;
};

/**
 * Get the details endpoint per a specific target part by its id
 * @param targetPartName the name of the target part
 * @returns the details / getById API or null (if target name has not been registered on the FE)
 */
export const getTargetPartDetailsApi = (targetPartName: string) => {
  return targetPartConfiguration[targetPartName]?.getTargetById;
};

/**
 * Get the cutomizable translation keys that can be used for the specific target at different
 * levels / sections within the form
 * @param targetPartName the name of the target part
 * @returns
 */
export const getTargetPartTranslations = (targetPartName: string) => {
  return targetPartConfiguration[targetPartName]?.translationKeys;
};

/**
 * Get the load count for how many items to display in the form. Defaults
 * to 10 if a load count is not configured. Load counts are mainly used to restrict how
 * many options should initially be displayed automatically in the second level of the form,
 * from within select dropdowns, or fetched by search dropdowns.
 * @param targetPartName the name of the target part
 * @returns the load count
 */
export const getLoadCount = (targetPartName: string) => {
  return targetPartConfiguration[targetPartName]?.loadCount ?? 10;
};
