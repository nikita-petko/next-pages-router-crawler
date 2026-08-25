import type { CloudAuthInfo } from '@modules/clients/cloudAuthentication';

/**
 * Parses a CloudAuthInfo response object and resolves all undefined types.
 * Will convert ISO time strings into Date objects.
 * @param cloudAuthInfo the cloudAuthInfo object to parse
 * @returns a cloudAuthInfo with any undefined keys resolved to valid defaults
 */
const parseCloudAuthInfo = (cloudAuthInfo?: CloudAuthInfo) => {
  return {
    id: cloudAuthInfo?.id ?? '',
    createdTime: cloudAuthInfo?.createdTime ? new Date(cloudAuthInfo?.createdTime) : null,
    updatedTime: cloudAuthInfo?.updatedTime ? new Date(cloudAuthInfo?.updatedTime) : null,
    lastGeneratedUserId: cloudAuthInfo?.lastGeneratedUserId ?? 0,
    lastGeneratedTime: cloudAuthInfo?.lastGeneratedTime
      ? new Date(cloudAuthInfo?.lastGeneratedTime)
      : null,
    apikeySecretPreview: cloudAuthInfo?.apikeySecretPreview ?? '',
    lastAccessedTime: cloudAuthInfo?.lastAccessedTime
      ? new Date(cloudAuthInfo?.lastAccessedTime)
      : null,
    cloudAuthBadStatus: cloudAuthInfo?.cloudAuthBadStatus ?? [],
    ownerId: cloudAuthInfo?.ownerId ?? 0,
    cloudAuthUserConfiguredProperties: {
      name: cloudAuthInfo?.cloudAuthUserConfiguredProperties?.name ?? '',
      description: cloudAuthInfo?.cloudAuthUserConfiguredProperties?.description ?? '',
      isEnabled: cloudAuthInfo?.cloudAuthUserConfiguredProperties?.isEnabled ?? false,
      expirationTime: cloudAuthInfo?.cloudAuthUserConfiguredProperties?.expirationTime
        ? new Date(cloudAuthInfo?.cloudAuthUserConfiguredProperties?.expirationTime)
        : null,
      allowedCidrs: cloudAuthInfo?.cloudAuthUserConfiguredProperties?.allowedCidrs ?? [],
      scopes: cloudAuthInfo?.cloudAuthUserConfiguredProperties?.scopes ?? [],
    },
  };
};

export default parseCloudAuthInfo;
