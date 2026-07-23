import type { ScopeInfo } from '@modules/clients/cloudAuthentication';

/**
 * A node in the scope type state tree
 * The key in the children map is the next path segment in the tree (i.e. '123,datastore' '123', and 'datastore' would both become keys )
 * The scopeInfo object is the Scope Info with relevant information along that path in the tree
 * isValid is a boolean that determines whether this target part node has a valid scope info object
 */
export default class TargetPartNode {
  parentTargetPartNode: TargetPartNode | null;

  isValid: boolean;

  children: { [nextTargetPart: string]: TargetPartNode };

  scopeInfo: ScopeInfo;

  constructor(parent: TargetPartNode | null, scopeInfo: ScopeInfo, isValid: boolean) {
    this.parentTargetPartNode = parent;
    this.isValid = isValid;
    this.children = {};
    this.scopeInfo = scopeInfo;
  }

  createChild(targetPartValue: string, node: TargetPartNode) {
    this.children[targetPartValue] = node;
  }

  setIsValid(valid: boolean) {
    this.isValid = valid;
  }

  setParentNode(node: TargetPartNode) {
    this.parentTargetPartNode = node;
  }

  setOperations(operations: string[]) {
    this.scopeInfo.operations = operations;
  }
}
