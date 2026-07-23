import { useContext, useCallback } from 'react';
import { useAuthentication } from '@modules/authentication/providers';
import type { ScopeInfo } from '@modules/clients/cloudAuthentication';
import { useCurrentGroup, useGroups } from '@modules/providers/groups/GroupsProvider';
import TargetPartNames from '../enums/TargetPartNames';
import type TargetPartApiData from '../interfaces/TargetPartApiData';
import { ScopesFormContext } from '../providers/ScopesFormProvider';
import { getTargetPartDetailsApi } from '../utils/targetPartConfigurationUtils';
import useScopeSystem from './useScopeSystem';

/**
 * Hook serves mainly as a wrapper for all public methods to the ScopeSystemFormStateManager and Target Part Cache
 * @returns list of methods to access the scope state manager
 */
export default function useScopeFormState() {
  const { getScopeFormState, targetCache } = useContext(ScopesFormContext);
  const { isScopeInfoValid, getScopeTypeProductName } = useScopeSystem();
  const { user } = useAuthentication();
  const currentGroup = useCurrentGroup();
  const { groups } = useGroups();

  /**
   * Add a product to the products set from the associated scope type
   */
  const addProduct = useCallback(
    (productName: string) => {
      getScopeFormState?.().addProduct(productName);
    },
    [getScopeFormState],
  );

  /**
   * Removes a product from the product set. This will also remove all scope types associated with the product.
   */
  const removeProduct = useCallback(
    (productName: string) => {
      getScopeFormState?.().removeProduct(productName, getScopeTypeProductName);
    },
    [getScopeFormState, getScopeTypeProductName],
  );

  /**
   * Get a list of the products a user selected
   */
  const getSelectedProducts = useCallback((): string[] => {
    return getScopeFormState?.().getSelectedProducts() ?? [];
  }, [getScopeFormState]);

  /**
   * Get all target parts at the specified path string within a product (values are deduplicated)
   */
  const getAllTargetValuesAtPath = useCallback(
    (productName: string, targetPartValuePathString?: string) => {
      return (
        getScopeFormState?.().getAllTargetValuesAtPath(
          productName,
          getScopeTypeProductName,
          targetPartValuePathString,
        ) ?? []
      );
    },
    [getScopeFormState, getScopeTypeProductName],
  );

  /**
   * Adds multiple scope types at a time to the scope state manager.
   */
  const batchAddOrUpdateTargetPartNodes = useCallback(
    (
      targetPartPathString: string,
      scopeTypeOperationPairs: Array<{ scopeTypeName: string; operations: string[] }>,
    ) => {
      getScopeFormState?.().batchAddOrUpdateTargetPartNodes(
        targetPartPathString,
        scopeTypeOperationPairs,
        isScopeInfoValid,
      );
    },
    [getScopeFormState, isScopeInfoValid],
  );

  /**
   * Adds multiple scope types at a time to the scope state manager.
   */
  const batchAddOrUpdateTargetPartNodesForTargetPartPaths = useCallback(
    (
      targetPartPaths: string[],
      scopeTypeOperationPairs: Array<{ scopeTypeName: string; operations: string[] }>,
    ) => {
      getScopeFormState?.().batchAddOrUpdateTargetPartNodesForTargetPartPaths(
        targetPartPaths,
        scopeTypeOperationPairs,
        isScopeInfoValid,
      );
    },
    [getScopeFormState, isScopeInfoValid],
  );

  /**
   * Removes the target part branch from all scope types under the given product
   */
  const removeTargetFromProduct = useCallback(
    (productName: string, targetPartPathString: string) => {
      getScopeFormState?.().removeTargetFromProduct(
        productName,
        targetPartPathString,
        getScopeTypeProductName,
      );
    },
    [getScopeFormState, getScopeTypeProductName],
  );

  /**
   * Get all operations at a specific target part path across all scope types in a product
   */
  const getAllSelectedOperationsAtPath = useCallback(
    (productName: string, targetPartPathString: string) => {
      return (
        getScopeFormState?.().getAllSelectedOperationsAtPath(
          productName,
          targetPartPathString,
          getScopeTypeProductName,
        ) ?? []
      );
    },
    [getScopeFormState, getScopeTypeProductName],
  );

  /**
   * Get all operations at a specific target part path across all scope types in a product
   */
  const getAllSelectedOperationsAtPaths = useCallback(
    (productName: string, targetPartPaths: string[]) => {
      return (
        getScopeFormState?.().getAllSelectedOperationsAtPaths(
          productName,
          targetPartPaths,
          getScopeTypeProductName,
        ) ?? []
      );
    },
    [getScopeFormState, getScopeTypeProductName],
  );

  /**
   * Adds the passed in scopeInfo object to the scope form state manager
   */
  const addScopeInfoToScopeType = useCallback(
    (scopeInfo: ScopeInfo) => {
      getScopeFormState?.().addScopeInfoToScopeType(
        scopeInfo,
        isScopeInfoValid,
        getScopeTypeProductName,
      );
    },
    [getScopeFormState, getScopeTypeProductName, isScopeInfoValid],
  );

  /**
   * Method used to fetch all valid scope infos across all scope types stored in the form
   */
  const getValidScopeInfos = useCallback((): ScopeInfo[] => {
    return getScopeFormState?.().getAllValidScopeTypeScopeInfos() ?? [];
  }, [getScopeFormState]);

  /**
   * Built the target cache key
   */
  const buildCacheKey = useCallback((targetPartName: string, identifier: string) => {
    return `${targetPartName}-${identifier}`;
  }, []);

  /**
   * Exchange target part name and it's specific id with the name of the backend resource. For creators, Exchange
   * the target part name for the active creator name and the special target value (user id 'U' or group 'G:123')
   */
  const getResource = useCallback(
    async (
      targetPartName: string,
      targetPartValue?: string,
    ): Promise<TargetPartApiData | undefined> => {
      // special check for the creator target name and value
      if (targetPartName === TargetPartNames.Creator) {
        // If a specific creator value is provided, try to resolve it
        if (targetPartValue !== undefined) {
          // Check cache first
          const key = buildCacheKey(targetPartName, targetPartValue);
          if (key in targetCache) {
            return targetCache[key];
          }

          // Resolve specific creator value
          if (targetPartValue === 'U') {
            // User
            const userData = {
              name: user?.name,
              value: 'U',
            };
            targetCache[key] = userData;
            return userData;
          }
          if (targetPartValue.startsWith('G')) {
            // Group - extract group ID (parse everything after 'G')
            const groupId = parseInt(targetPartValue.slice(1), 10);
            if (!Number.isNaN(groupId)) {
              // Try to find the group in the groups list
              const group = groups?.find((g) => g.id === groupId);
              if (group) {
                const groupData = {
                  name: group.name,
                  value: `G${groupId}`,
                };
                targetCache[key] = groupData;
                return groupData;
              }
            }
          }
          // If not found, return undefined (cache should have been set by TargetPartSearch)
          return undefined;
        }

        // No specific value - return current creator
        if (currentGroup !== null && currentGroup !== undefined) {
          return {
            name: currentGroup.name,
            value: `G${String(currentGroup.id ?? 0).toString()}`,
          };
        }
        return {
          name: user?.name,
          value: 'U',
        };
      }

      // else resolve the target part name through an API call based on the identifier (targetPartValue)
      if (targetPartValue !== undefined) {
        const key = buildCacheKey(targetPartName, targetPartValue);
        if (key in targetCache) {
          return targetCache[key];
        }
        const getDetailsApi = getTargetPartDetailsApi(targetPartName);
        if (getDetailsApi) {
          const targetPartDetails = await getDetailsApi(parseInt(targetPartValue, 10));
          if (targetPartDetails !== null) {
            // set the cache
            targetCache[key] = {
              name: targetPartDetails.name,
            };
            // return the set cache value
            return targetCache[key];
          }
        }
      }

      // fallback behavior if a unique identifier was not provided and the target was not a creator
      return undefined;
    },
    [user, currentGroup, groups, targetCache, buildCacheKey],
  );

  /**
   * Set the friendly name equivalent of a targert part value from the cloud auth backend
   */
  const setResourceCache = useCallback(
    (targetPartName: string, targetPartValue: string, targetPartMetadata: TargetPartApiData) => {
      const key = buildCacheKey(targetPartName, targetPartValue);
      targetCache[key] = targetPartMetadata;
    },
    [buildCacheKey, targetCache],
  );

  return {
    addProduct,
    removeProduct,
    getSelectedProducts,
    getAllTargetValuesAtPath,
    batchAddOrUpdateTargetPartNodes,
    batchAddOrUpdateTargetPartNodesForTargetPartPaths,
    getAllSelectedOperationsAtPath,
    getAllSelectedOperationsAtPaths,
    removeTargetFromProduct,
    addScopeInfoToScopeType,
    getValidScopeInfos,
    getResource,
    setResourceCache,
  };
}
