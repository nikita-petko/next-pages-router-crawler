enum UniverseAPIErrorCodes {
  UnknownError = 0, // Unknown Error.
  InvalidRequest = 1, // Request is null or has invalid parameters.
  Forbidden = 2, // Operation is forbidden for the requestor.
  NotFound = 3, // Operation or resource is not found.
  Unauthorized = 4, // Request is not authorized.
  Conflict = 5, // Current state does not allow requested operation.
  InternalError, // Some internal error occurred.
}

export default UniverseAPIErrorCodes;
