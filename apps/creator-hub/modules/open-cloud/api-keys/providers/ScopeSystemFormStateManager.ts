import type { ScopeInfo } from '@modules/clients/cloudAuthentication';
import type { getScopeTypeProductNameFunc, isScopeInfoValidFunc } from '../hooks/useScopeSystem';
import ScopeTypeFormStateManager from './ScopeTypeFormStateManager';

export default class ScopeSystemFormStateManager {
  private scopeSystemStateManager: {
    [scopeTypeName: string]: ScopeTypeFormStateManager;
  };

  private productNames: Set<string>;

  /**
   * Constructs a ScopeSystemFormStateManager
   * @param isScopeInfoValid the validator method the ScopeTypeFormStateManager objects will use to validate their scope infos
   */
  constructor() {
    this.scopeSystemStateManager = {};
    this.productNames = new Set<string>();
  }

  /**
   * Try to add a product to the products set from the associated scope type
   * @param productName the scope type name
   */
  addProduct(productName: string) {
    this.productNames.add(productName);
  }

  /**
   * Removes a selected product from the product set. This will also remove all scope types associated with the product.
   * @param scopeTypeName the scope type name
   */
  removeProduct(productName: string, getScopeTypeProductName: getScopeTypeProductNameFunc) {
    this.productNames.delete(productName);

    // remove all scope types under that product from the scopeSystemStateManager
    this.getScopeManagersByProduct(productName, getScopeTypeProductName).forEach(
      ({ scopeTypeName }) => {
        delete this.scopeSystemStateManager[scopeTypeName];
      },
    );
  }

  /**
   * Get a list of the products a user selected
   * @returns a list of selected products
   */
  getSelectedProducts(): string[] {
    return Array.from(this.productNames);
  }

  /**
   * Get all target parts values stored at the specified target path string (used for edit)
   * @param productName
   * @param targetPartValuePathString the target part path string to return targets for
   * @returns a deduplicated array of the target part values at the specified path
   */
  getAllTargetValuesAtPath(
    productName: string,
    getScopeTypeProductName: getScopeTypeProductNameFunc,
    targetPartValue?: string,
  ): string[] {
    const deduplicatedTargets = this.getScopeManagersByProduct(
      productName,
      getScopeTypeProductName,
    ).reduce<Set<string>>((accumulator, { scopeManager }) => {
      scopeManager
        .getTargetPartChildrenAtPath(targetPartValue)
        .forEach((targetValue) => accumulator.add(targetValue));

      return accumulator;
    }, new Set<string>());

    this.getScopeManagersByProduct(productName, getScopeTypeProductName).forEach(
      ({ scopeManager }) => {
        scopeManager
          .getTargetPartChildrenAtPath(targetPartValue)
          .forEach((targetValue) => deduplicatedTargets.add(targetValue));
      },
    );

    return Array.from(deduplicatedTargets);
  }

  /**
   * Adds the passed in scopeInfo object to the correct ScopeTypeFormStateManager. This method is used for the edit flow, where the scope
   * state tree needs to be built from the list of ScopeInfos passed in from the backend.
   * @param scopeInfo the scope info object
   * @param isScopeInfoValid util method to check if a scopeinfo is valid for the BE
   * @param getScopeTypeProductName util method to get the product name a scope is associated with
   */
  addScopeInfoToScopeType(
    scopeInfo: ScopeInfo,
    isScopeInfoValid: isScopeInfoValidFunc,
    getScopeTypeProductName: getScopeTypeProductNameFunc,
  ): void {
    const scopeTypeName = scopeInfo.scopeType;

    if (typeof scopeTypeName !== 'undefined') {
      // if the scopeTypeName was not added yet, add it
      if (!(scopeTypeName in this.scopeSystemStateManager)) {
        this.scopeSystemStateManager[scopeTypeName] = new ScopeTypeFormStateManager(scopeTypeName);
      }

      this.scopeSystemStateManager[scopeTypeName].addTargetPartNodeFromScopeInfo(
        scopeInfo,
        isScopeInfoValid,
      );
      this.productNames.add(getScopeTypeProductName(scopeTypeName));
    }
  }

  /**
   * Adds multiple scope types at a time to the scope state manager. This will mainly be used by the autocomplete selectors
   * that will manage the selection / de-selection of operations across multiple scope types within a given product.
   * @param targetPartPathString the comma separated target part value path, which identifies a scope type node's position in its tree
   * @param scopeTypeOperationPairs list of objects that include the operations selected, and what scope type they were selected for
   * @param isScopeInfoValid util method to check if a scopeinfo is valid for the BE
   */
  batchAddOrUpdateTargetPartNodes(
    targetPartPathString: string,
    scopeTypeOperationPairs: Array<{ scopeTypeName: string; operations: string[] }>,
    isScopeInfoValid: isScopeInfoValidFunc,
  ) {
    scopeTypeOperationPairs.forEach(({ scopeTypeName, operations }) => {
      this.addOrUpdateTargetPartNode(
        scopeTypeName,
        targetPartPathString,
        operations,
        isScopeInfoValid,
      );
    });
  }

  /**
   * Adds multiple scope types at a time to the scope state manager. This will mainly be used by the autocomplete selectors
   * that will manage the selection / de-selection of operations across multiple scope types within a given product.
   * @param targetPartPaths the list of comma separated target part value paths, which identifies a scope type node's position in its tree
   * @param scopeTypeOperationPairs list of objects that include the operations selected, and what scope type they were selected for
   * @param isScopeInfoValid util method to check if a scopeinfo is valid for the BE
   */
  batchAddOrUpdateTargetPartNodesForTargetPartPaths(
    targetPartPaths: string[],
    scopeTypeOperationPairs: Array<{ scopeTypeName: string; operations: string[] }>,
    isScopeInfoValid: isScopeInfoValidFunc,
  ) {
    targetPartPaths.forEach((targetPartPathString) => {
      this.batchAddOrUpdateTargetPartNodes(
        targetPartPathString,
        scopeTypeOperationPairs,
        isScopeInfoValid,
      );
    });
  }

  /**
   * Removes the target part branch from all scope types under the given product. Used when someone deletes an API system
   * @param productName product name
   * @param targetPartPathString the comma separated target part value path, which identifies a scope type node's position in its tree
   * @param getScopeTypeProductName util method to get the product name a scope is associated with
   */
  removeTargetFromProduct(
    productName: string,
    targetPartPathString: string,
    getScopeTypeProductName: getScopeTypeProductNameFunc,
  ) {
    this.getScopeManagersByProduct(productName, getScopeTypeProductName).forEach(
      ({ scopeManager }) => {
        // for each scope state manager under the given product, delete the target node branches part of the form state
        scopeManager.removeTargetPartNode(targetPartPathString);
      },
    );
  }

  /**
   * Method used to fetch all valid scope infos across all scope types stored in the form
   * @returns list of merged scope info objects for every selected scope type
   */
  getAllValidScopeTypeScopeInfos() {
    const allValidScopeInfos: ScopeInfo[] = [];

    Object.values(this.scopeSystemStateManager).forEach((scopeTypeFormStateManager) => {
      const validScopeInfos = scopeTypeFormStateManager.getAllValidScopeInfos();
      allValidScopeInfos.push(...validScopeInfos);
    });

    return allValidScopeInfos;
  }

  /**
   * Get all flattened operations at a specific target part path across all scope types in a product.
   * The returned format is stuctured to work with autocomplete or select components by flattening the
   * operations across multiple scope types into a single values array
   * @param productName the product name
   * @param targetPartPathString the comma separated target part value path, which identifies a scope type node's position in its tree
   * @param getScopeTypeProductName util method to get the product name a scope is associated with
   * @returns an array of operation select options for the multi select autocomplete
   */
  getAllSelectedOperationsAtPath(
    productName: string,
    targetPartPathString: string,
    getScopeTypeProductName: getScopeTypeProductNameFunc,
  ): Array<{ scopeTypeName: string; operation: string }> {
    return this.getScopeManagersByProduct(productName, getScopeTypeProductName)
      .map(({ scopeTypeName }) => {
        return {
          scopeTypeName,
          operations: this.getOperationsAtPath(scopeTypeName, targetPartPathString),
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
  }

  /**
   * Get all flattened operations across all target part paths across all scope types in a product.
   * The returned format is stuctured to work with autocomplete or select components by flattening the
   * operations across multiple scope types into a single values array
   * @param productName the product name
   * @param targetPartPaths the list of comma separated target part value path, which identifies a scope type node's position in its tree
   * @param getScopeTypeProductName util method to get the product name a scope is associated with
   * @returns an array of operation select options for the multi select autocomplete
   */
  getAllSelectedOperationsAtPaths(
    productName: string,
    targetPartPaths: string[],
    getScopeTypeProductName: getScopeTypeProductNameFunc,
  ): Array<{ scopeTypeName: string; operation: string }> {
    const allOperations = targetPartPaths.flatMap((targetPartPath) =>
      this.getAllSelectedOperationsAtPath(productName, targetPartPath, getScopeTypeProductName),
    );

    const seen = new Set();
    const dedupedOperations = allOperations.filter(({ scopeTypeName, operation }) => {
      const key = `${scopeTypeName}:${operation}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    return dedupedOperations;
  }

  /**
   * @param scopeTypeName the scope type name
   * @param targetPartPathString the comma separated target part value path, which identifies a scope type node's position in its tree
   * @returns all selected operations at the given path for a specific scope type
   */
  private getOperationsAtPath(scopeTypeName: string, targetPartPathString: string) {
    if (scopeTypeName in this.scopeSystemStateManager) {
      return this.scopeSystemStateManager[scopeTypeName].getOperationsAtPath(targetPartPathString);
    }
    return [];
  }

  /**
   * Adds or updates a target part node to the correct scopeSystemStateManager.
   * @param scopeTypeName the scope type name (i.e. 'universe-places')
   * @param targetPartValuePathString the comma separated target part value path, which identifies a scope type node's position in its tree
   * @param operations the list of operations currently selected by a user.
   * @param isScopeInfoValid util method to check if a scopeinfo is valid for the BE
   */
  private addOrUpdateTargetPartNode(
    scopeTypeName: string,
    targetPartValuePathString: string,
    operations: string[],
    isScopeInfoValid: isScopeInfoValidFunc,
  ): void {
    if (!(scopeTypeName in this.scopeSystemStateManager)) {
      this.scopeSystemStateManager[scopeTypeName] = new ScopeTypeFormStateManager(scopeTypeName);
    }
    this.scopeSystemStateManager[scopeTypeName].addOrUpdateTargetPartNode(
      targetPartValuePathString,
      operations,
      isScopeInfoValid,
    );
  }

  /**
   * Return a list of scope type managers associated with a specific product, along with that their scope type is
   * @param productName the product name
   * @param getScopeTypeProductName util method to get the product name a scope is associated with
   * @returns an array of the scope type managers and their associated scope type
   */
  private getScopeManagersByProduct(
    productName: string,
    getScopeTypeProductName: getScopeTypeProductNameFunc,
  ): Array<{ scopeManager: ScopeTypeFormStateManager; scopeTypeName: string }> {
    return Object.entries(this.scopeSystemStateManager)
      .filter(([scopeTypeName]) => {
        return getScopeTypeProductName(scopeTypeName) === productName;
      })
      .map(([scopeTypeName, scopeManager]) => {
        return {
          scopeManager,
          scopeTypeName,
        };
      });
  }
}
