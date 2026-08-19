import type { ScopeInfo } from '@modules/clients/cloudAuthentication';
import type { isScopeInfoValidFunc } from '../hooks/useScopeSystem';
import TargetPartNode from './TargetPartNode';

export default class ScopeTypeFormStateManager {
  private scopeTypeName: string;

  private root: TargetPartNode;

  /**
   * Construct the ScopeTypeFormStateManager.
   * @param scopeTypeInitName This is the scope type this manager will be storing ScopeInfo objects for
   * @param isScopeInfoValidHelper This is the validation helper for checking if scopeInfo objects are valid (passed in from scopeSystemUtils hook)
   */
  constructor(scopeTypeInitName: string) {
    this.scopeTypeName = scopeTypeInitName;
    this.root = new TargetPartNode(null, { scopeType: scopeTypeInitName }, false);
  }

  /**
   * Add or update a target part node based on its path in the root tree.
   * @param targetPartValuePathString the comma separated target part value path, which identifies the node's position in the tree
   * @param operations
   */
  addOrUpdateTargetPartNode(
    targetPartValuePathString: string,
    operations: string[],
    isScopeInfoValid: isScopeInfoValidFunc,
  ): void {
    const onInsertCallback = (
      parentNode: TargetPartNode,
      targetPartValue: string,
      isFinalTargetPart: boolean,
    ) => {
      const parentTargetParts = parentNode.scopeInfo.targetParts ?? [];

      const newScopeInfo = this.buildScopeInfo(
        [...parentTargetParts, targetPartValue],
        isFinalTargetPart ? operations : [], // in the case of building the tree up from its leaf nodes, do not add operations along the target part path
      );

      // make a new node in the tree from the parent, and return it in the callback to continue the traversal
      const newNode = new TargetPartNode(
        parentNode,
        newScopeInfo,
        isScopeInfoValid(this.scopeTypeName, newScopeInfo),
      );
      parentNode.createChild(targetPartValue, newNode);
      return newNode;
    };

    const onUpdateCallback = (node: TargetPartNode) => {
      node.setOperations(operations);
      node.setIsValid(isScopeInfoValid(this.scopeTypeName, node.scopeInfo));
    };
    this.traversePath(targetPartValuePathString, onUpdateCallback, onInsertCallback);
  }

  /**
   * Adds a target part node for the passed in scopeInfo object
   * @param scopeInfo the scopeInfo object to add to the tree
   */
  addTargetPartNodeFromScopeInfo(
    scopeInfo: ScopeInfo,
    isScopeInfoValid: isScopeInfoValidFunc,
  ): void {
    if (scopeInfo && scopeInfo.targetParts && scopeInfo.targetParts.length > 0) {
      const targetPartPathString = scopeInfo.targetParts.join();
      const operations = scopeInfo.operations ?? [];
      this.addOrUpdateTargetPartNode(targetPartPathString, operations, isScopeInfoValid);
    }
  }

  /**
   * Remove the target part node at the specified path in the tree
   * @param targetPartValuePathString the comma separated target part value path, which identifies the node's position in the tree
   */
  removeTargetPartNode(targetPartValuePathString: string): void {
    const successCallback = (node: TargetPartNode, targetPartValue: string) => {
      // delete this node from the parent
      const parent = node.parentTargetPartNode;
      delete parent?.children[targetPartValue];
    };
    this.traversePath(targetPartValuePathString, successCallback);
  }

  /**
   * Get ScopeInfo at specific target part path in the tree
   * @param targetPartPathString the comma separated target part value path, which identifies the node's position in the tree
   * @returns scopeInfo of the node at the end of the target path, null if the path does not exist
   */
  getOperationsAtPath(targetPartPathString: string): string[] {
    let operations: string[] = [];

    const successCallback = (node: TargetPartNode) => {
      operations = node.scopeInfo.operations ?? [];
    };

    this.traversePath(targetPartPathString, successCallback);

    return operations;
  }

  /**
   * This method allows a node to fetch all it's immediate children (i.e. the next level of target part values). This
   * will be used during additions or deletions when a parent needs to reload the new childrens list from the central
   * form state context.
   * @param targetPartValuePathString the comma separated target part value path, which identifies the node's position in the tree
   * @param isRoot this is a shortcut if you simply want to return the first level of target parts for the scope type manager.
   * @returns list of target part values that are "children" of the current node
   */
  getTargetPartChildrenAtPath(targetPartValuePathString?: string): string[] {
    if (targetPartValuePathString === undefined || targetPartValuePathString === '') {
      // return list of first selected target parts
      return Object.keys(this.root.children);
    }
    if (targetPartValuePathString !== undefined) {
      let targetPartsAtPath: string[] = [];

      const successCallback = (node: TargetPartNode) => {
        targetPartsAtPath = Object.keys(node.children);
      };

      this.traversePath(targetPartValuePathString, successCallback);
      return targetPartsAtPath;
    }
    return [];
  }

  /**
   * This method will traverse the root hash map of all target parts and return a list of each scope info that is valid
   * Recursively traverse the tree for valid scope info objects and return them all in a merged list
   *
   * @returns list of scope info objects
   */
  getAllValidScopeInfos(): ScopeInfo[] {
    const validScopeInfos: ScopeInfo[] = [];

    const getAllValidScopeInfoTraverser = (node: TargetPartNode) => {
      if (node.isValid) {
        validScopeInfos.push(node.scopeInfo);
      }

      Object.values(node.children).forEach((grandChild) => {
        getAllValidScopeInfoTraverser(grandChild);
      });
    };

    Object.values(this.root.children).forEach((child) => {
      getAllValidScopeInfoTraverser(child);
    });

    return validScopeInfos;
  }

  /**
   * Private helper method to traverse the root TargetPartNode tree
   * @param path the target part path string (each node is delimited by commas)
   * @param successCallback called when the traverser has found the last node specified by the path string
   * @param errorCallback called if the traverser is unable to find a node specified by the path string (is called for each node)
   */
  private traversePath(
    path: string,
    successCallback: (node: TargetPartNode, targetPartValue: string) => void,
    errorCallback?: (
      parentNode: TargetPartNode,
      targetPartValue: string,
      isFinalTargetPart: boolean,
    ) => TargetPartNode | null,
  ) {
    if (!path) {
      return;
    }
    const targetParts = path.split(',');
    let currentNode: TargetPartNode = this.root; // root has an empty scopeinfo
    let nextNode: TargetPartNode = currentNode;
    const lastTargetPart = targetParts[targetParts.length - 1];

    for (let i = 0; i < targetParts.length; i += 1) {
      const targetPart = targetParts[i];
      nextNode = currentNode.children[targetPart];
      if (!nextNode) {
        // errorCallback can optionally return the next node to continue the traversal
        const newNextNode = errorCallback?.(currentNode, targetPart, targetPart === lastTargetPart);
        if (!newNextNode) {
          // error callback does not want to continue the traversal
          break;
        }

        // continue the traversal with the new node
        currentNode = newNextNode;
      } else {
        if (targetPart === lastTargetPart) {
          // only invoke success callback on the final node in the target path string
          successCallback(nextNode, targetPart);
        }
        currentNode = nextNode;
      }
    }
  }

  /**
   * Private helper to construct a new scopeInfo object
   * @param targetParts scope info's target parts
   * @param operations  scope info's operations
   * @returns a new ScopeInfo object
   */
  private buildScopeInfo(targetParts: string[], operations: string[]): ScopeInfo {
    return {
      scopeType: this.scopeTypeName,
      operations,
      targetParts,
    };
  }
}
