import { useContext, useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import type { ScopeInfo } from '@modules/clients/cloudAuthentication';
import TargetPartConstraints from '../enums/TargetPartConstraints';
import { ScopesContext } from '../providers/ScopesProvider';

export type isScopeInfoValidFunc = (scopeTypeName: string, scopeInfo: ScopeInfo) => boolean;
export type getScopeTypeProductNameFunc = (scopeTypeName: string) => string;

function useScopeSystem() {
  const { translate } = useTranslation();
  const { scopes, scopeTypesMap, targetTypesMap, targetPartsMap, productsMap } =
    useContext(ScopesContext);

  const areScopesLoaded = !!(
    scopes &&
    scopeTypesMap &&
    targetTypesMap &&
    targetPartsMap &&
    productsMap
  );

  /**
   * Derive the per-(scope type) data the api-keys UI needs directly from the scope-centric `scopes` list: the distinct
   * operations available for each scope type and the target type they share (all scopes of a scope type agree on the
   * target type, enforced by the config validator).
   */
  const { operationsByScopeType, targetTypeByScopeType } = useMemo(() => {
    const operations: { [scopeType: string]: string[] } = {};
    const targetTypes: { [scopeType: string]: string } = {};

    (scopes ?? []).forEach((scope) => {
      if (!scope.scopeType) {
        return;
      }

      if (scope.operation) {
        const operationList = operations[scope.scopeType] ?? [];
        if (!operationList.includes(scope.operation)) {
          operationList.push(scope.operation);
        }
        operations[scope.scopeType] = operationList;
      }

      if (scope.targetType && targetTypes[scope.scopeType] == null) {
        targetTypes[scope.scopeType] = scope.targetType;
      }
    });

    return {
      operationsByScopeType: operations,
      targetTypeByScopeType: targetTypes,
    };
  }, [scopes]);

  /**
   * Returns the list of product names
   * @returns list of product names existing in the scope system
   */
  const getProductNames = useCallback((): string[] => {
    if (typeof productsMap !== 'undefined') {
      return Object.values(productsMap).map((product) => {
        return product.name ?? '';
      });
    }

    return [];
  }, [productsMap]);

  /**
   * Returns the product name of the given scope type
   * @param scopeTypeName the scope type name
   * @returns the product name
   */
  const getScopeTypeProductName = useCallback(
    (scopeTypeName: string): string => {
      if (typeof scopeTypesMap !== 'undefined') {
        const scopeType = scopeTypesMap[scopeTypeName];
        return scopeType?.product ?? '';
      }
      return '';
    },
    [scopeTypesMap],
  );

  /**
   * Takes the given target part name and translates it into its localized equivalent
   * @param targetPartName the target part name (i.e. 'universe')
   * @returns the translated string for the target part name
   */
  const translateTargetPartName = useCallback(
    (targetPartName: string): string => {
      const targetPartTranslationKey = targetPartsMap?.[targetPartName]?.translationKey ?? '';
      if (targetPartTranslationKey !== '') {
        return translate(targetPartTranslationKey);
      }
      return '';
    },
    [translate, targetPartsMap],
  );

  /**
   * Returns a list of scopeTypeNames based on the product
   * @param productName the name of the product
   * @returns a list of scopeType names belonging to the product
   */
  const getScopeTypesByProduct = useCallback(
    (productName: string): string[] => {
      if (scopeTypesMap !== undefined) {
        return Object.values(scopeTypesMap)
          .filter((scopeType) => scopeType.product === productName)
          .map((scopeType) => scopeType.name ?? '');
      }
      return [];
    },
    [scopeTypesMap],
  );

  /**
   * Get the operations associated with a specific scope type
   * @param scopeTypeName the scope type name (i.e. universe-places)
   * @returns list of operations (strings)
   */
  const getScopeTypeOperations = useCallback(
    (scopeTypeName: string): string[] => {
      return operationsByScopeType[scopeTypeName] ?? [];
    },
    [operationsByScopeType],
  );

  /**
   * Get the operations available at the specified target part name. Assumes the scope type is configured in a way where
   * all scopes under a product are prefixed by the same target part names / the targets must match at every index of the
   * target type's merged required and optional parts list.
   * @param productName the product name
   * @param targetPartName the target part name
   * @returns A merged array of all operations in a product, each w/ their associated scope type
   */
  const getStaticOperationOptionsByTarget = useCallback(
    (productName: string, targetPartName: string) => {
      const allOperations = getScopeTypesByProduct(productName)
        .map((scopeTypeName) => {
          return {
            scopeTypeName,
            operations: getScopeTypeOperations(scopeTypeName),
          };
        })
        .reduce<Array<{ scopeTypeName: string; operation: string }>>((accumulator, next) => {
          const flattenedOperations = next.operations.map((operation) => {
            return {
              scopeTypeName: next.scopeTypeName,
              operation,
            };
          });

          return accumulator.concat(flattenedOperations);
        }, []);

      const doesTargetTypeIncludeTarget = (scopeTypeName: string) => {
        if (typeof targetTypesMap !== 'undefined') {
          const targetType = targetTypesMap[targetTypeByScopeType[scopeTypeName] ?? ''];
          if (typeof targetType !== 'undefined') {
            return (
              (targetType.requiredParts?.includes(targetPartName) ?? false) ||
              (targetType.optionalParts?.includes(targetPartName) ?? false)
            );
          }
        }
        return true; // defaults to true now(?) because this is implicitly a true now with the scope changes
      };
      return allOperations.filter((operation) => {
        return doesTargetTypeIncludeTarget(operation.scopeTypeName);
      });
    },
    [getScopeTypeOperations, getScopeTypesByProduct, targetTypeByScopeType, targetTypesMap],
  );

  /**
   * Gets the nth (potentially) shared target part across all scope types in a product. For example, all datastore
   * scope types start w/ a universe at depth 0, and some go further to have a datastore at depth 1. This function
   * is written with the assumption that all scope types under a product are prefixed with the same target parts, and may
   * only differ in the depth of how many target parts are used.
   * @param productName
   * @param depth the "depth" of the shared target part, starting at index 0 (i.e. the first target is 0, second is 1, etc.)
   * @returns the first required part name shared across all scope types in a product
   */
  const getNthSharedTargetPart = useCallback(
    (productName: string, depth: number) => {
      let targetPart = '';

      const getMergedTargetParts = (scopeTypeName: string) => {
        if (typeof targetTypesMap !== 'undefined') {
          const targetType = targetTypesMap[targetTypeByScopeType[scopeTypeName] ?? ''];
          if (typeof targetType !== 'undefined') {
            const requiredParts = targetType.requiredParts ?? [];
            const optionalParts = targetType.optionalParts ?? [];
            return [...requiredParts, ...optionalParts];
          }
        }
        return [];
      };

      getScopeTypesByProduct(productName).some((scopeTypeName) => {
        // basically iterate the scope types until we find a target type that can match the requested shared depth
        const mergedTargetParts = getMergedTargetParts(scopeTypeName);
        if (mergedTargetParts.length > depth) {
          targetPart = mergedTargetParts[depth];
          return true;
        }
        return false;
      });

      return targetPart;
    },
    [targetTypeByScopeType, targetTypesMap, getScopeTypesByProduct],
  );

  /**
   * This method reformats a rawTargetPartValue into a 'valid' format for the cloud auth backend (i.e.
   * it will url-encode target values like the datastore name)
   * @param rawTargetPartValue the raw value from the target API (i.e. the datastore name)
   * @param targetPartName the target part name of the raw value
   * @returns the formatted target part value accepted by the cloud auth backend
   */
  const formatTargetValue = useCallback(
    (rawTargetPartValue: string, targetPartName: string): string => {
      if (typeof targetPartsMap !== 'undefined') {
        const targetPart = targetPartsMap[targetPartName];
        if (targetPart) {
          if (targetPart.constraints?.includes(TargetPartConstraints.UrlEncoded)) {
            return encodeURIComponent(rawTargetPartValue);
          }
          return rawTargetPartValue;
        }
      }
      return rawTargetPartValue;
    },
    [targetPartsMap],
  );

  /**
   * This method reformats a formattedTargetValue into a 'friendly' format for the user (i.e.
   * it will decode target values like the datastore name)
   * @param formattedTargetValue The formatted target value (i.e. the url-encoded datastore name)
   * @param targetPartName the target part name of the formatted value
   * @returns the "friendly" target part value reformatted from the value returned by the cloud auth backend
   */
  const friendlyFormatTargetValue = useCallback(
    (formattedTargetValue: string, targetPartName: string): string => {
      if (typeof targetPartsMap !== 'undefined') {
        const targetPart = targetPartsMap[targetPartName];
        if (targetPart) {
          if (targetPart.constraints?.includes(TargetPartConstraints.UrlEncoded)) {
            return decodeURIComponent(formattedTargetValue);
          }
          return formattedTargetValue;
        }
      }
      return formattedTargetValue;
    },
    [targetPartsMap],
  );

  /**
   * This method returns the target type length for a specific scope under a product
   * @param scopeTypeName  the scope type name
   * @returns  the target type length (required + optional parts)
   */
  const getTargetTypeLength = useCallback(
    (scopeTypeName: string) => {
      if (typeof targetTypesMap !== 'undefined') {
        const targetType = targetTypesMap[targetTypeByScopeType[scopeTypeName] ?? ''];
        if (typeof targetType !== 'undefined') {
          return (targetType.requiredParts ?? []).length + (targetType.optionalParts ?? []).length;
        }
      }
      return 0;
    },
    [targetTypeByScopeType, targetTypesMap],
  );

  /**
   * This method validates the incoming scopeInfo object against the scope type it should be checked against
   * @param scopeTypeName the scope type to validate the scope info object against
   * @param scopeInfo the scopeInfo object we wish to validate
   * @returns boolean- true if valid, false otherwise.
   */
  const isScopeInfoValid = useCallback(
    (scopeTypeName: string, scopeInfo: ScopeInfo): boolean => {
      if (typeof scopeTypesMap === 'undefined' || typeof targetTypesMap === 'undefined') {
        return false;
      }

      if (!Object.keys(scopeTypesMap).includes(scopeTypeName)) {
        return false;
      }

      /**
       * A scope info object is valid iff
       * 1. We at least have all the required parts (I am assuming a scope type itself must have at least 1 required target part)
       * 2. We have at least one operation
       */

      // helper function that returns all the required targets for the scope
      const getScopeTypeRequiredParts = (scopeName: string): string[] => {
        // get target type from the scope type's scopes
        const targetType = targetTypeByScopeType[scopeName];

        if (targetType) {
          const { requiredParts } = targetTypesMap[targetType];

          if (requiredParts) {
            return requiredParts;
          }
        }

        return [];
      };

      // make sure the target parts list is at least as long as the required parts list
      // making the assumption that since all these came from a target part selector the data itself is valid
      const requiredParts = getScopeTypeRequiredParts(scopeTypeName);
      const scopeInfoTargetPartsLength = scopeInfo.targetParts?.length ?? 0;
      const hasAllRequiredParts = scopeInfoTargetPartsLength >= requiredParts.length;

      // make sure we have at least one operation, and that the operation is from the operations list
      const operations = getScopeTypeOperations(scopeTypeName);
      let hasValidOperations = false;

      if (scopeInfo.operations) {
        if (scopeInfo.operations.length === 0) {
          // no operations is invalid
          hasValidOperations = false;
        } else {
          // if we have operations, they must be from the operations list
          hasValidOperations = scopeInfo.operations.every((currentOperation) =>
            operations.includes(currentOperation),
          );
        }
      }
      // if both are true, scopeInfo is valid
      return hasAllRequiredParts && hasValidOperations;
    },
    [getScopeTypeOperations, scopeTypesMap, targetTypesMap, targetTypeByScopeType],
  );

  return {
    areScopesLoaded,
    getProductNames,
    getScopeTypeProductName,
    translateTargetPartName,
    getScopeTypeOperations,
    getStaticOperationOptionsByTarget,
    getScopeTypesByProduct,
    isScopeInfoValid,
    getNthSharedTargetPart,
    friendlyFormatTargetValue,
    getTargetTypeLength,
    formatTargetValue,
  };
}

export default useScopeSystem;
