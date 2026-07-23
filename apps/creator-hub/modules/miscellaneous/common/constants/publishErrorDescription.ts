import PublishError from '../enums/PublishError';

// Error message mapping for Roblox.Publish.Api.PublishError enum when calling this api.
const publishErrorDescription: { [key in PublishError]: string } = {
  [PublishError.UnknownError]: 'Response.UnknownError',
  [PublishError.InvalidFile]: 'Error.Publish.InvalidFile',
  [PublishError.MissingFile]: 'Error.Publish.MissingFile',
  [PublishError.TooManyAttempts]: 'Error.Publish.TooManyAttempts',
  [PublishError.InvalidItem]: 'Error.Publish.InvalidItem',
  [PublishError.InvalidPermissions]: 'Error.Publish.InvalidPermissions',
  [PublishError.NoRootPlace]: 'Error.Publish.NoRootPlace',
  [PublishError.InvalidAssetType]: 'Error.Publish.InvalidAssetType',
  [PublishError.InvalidQuotaResourceType]: 'Error.Publish.InvalidQuotaResourceType',
};

export default publishErrorDescription;
