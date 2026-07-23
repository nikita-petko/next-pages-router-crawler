import type OperationSelectOption from '../interfaces/OperationSelectOption';

/**
 * Serialize the options object (the scope type + the operation) for React.key and isInherited set logic in the Multiselect component
 * @param option the select option
 * @returns a serialized string of the select option (needed since the option is an object so it can't easily be used for equality checks)
 */
const serializeOption = (option: OperationSelectOption) => {
  return `${option.scopeTypeName}:${option.operation}`;
};

export default serializeOption;
