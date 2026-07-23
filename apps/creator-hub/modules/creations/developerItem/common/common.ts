import {
  assetPermissionsApiClient,
  developClient,
  publishClient,
  DeveloperItemDistributionQuota,
  QuotaDuration,
  gamesClient,
} from '@modules/clients';
import {
  ApiPermissionStatus,
  AssetConsumerAction,
  SubjectType,
} from '@rbx/clients/assetPermissionsApi';
import Creator from '@modules/miscellaneous/common/enums/Creator';
import { Restriction } from '@rbx/clients/marketplacePublishingRequirementsApi';
import { ToolboxVisibilityStatus } from '@rbx/clients/toolboxService';
import {
  AssetPermissionResponseModel,
  DefaultDeveloperItemRequest,
  PermissionAllowedUniverseDetailsType,
} from './types';
import { DeveloperItemDetails } from './DeveloperItemProvider';

export const postDeveloperItemDetails = (
  id: string,
  data: DefaultDeveloperItemRequest,
): Promise<void> => {
  return developClient.updateAsset(parseInt(id, 10), {
    ...data,
  });
};

export const getDeveloperItemDistributionQuota = async (assetType: string) => {
  const response = await publishClient.getAssetQuotas(
    'RateLimitCreatorMarketplaceDistribute',
    assetType,
  );
  const quota = response.quotas?.[0];
  if (
    quota &&
    typeof quota.usage !== 'undefined' &&
    typeof quota.capacity !== 'undefined' &&
    typeof quota.duration !== 'undefined' &&
    quota.duration in QuotaDuration
  ) {
    return {
      capacity: quota.capacity,
      duration: quota.duration as QuotaDuration,
      expirationTime: quota.expirationTime ? new Date(quota.expirationTime) : undefined,
      usage: quota.usage,
    } as DeveloperItemDistributionQuota;
  }
  throw new Error('empty quota');
};

export const getAssetPermissionIds = async (assetId: number) => {
  const response = await assetPermissionsApiClient.getAssetPermissions(assetId);
  const subjectIds = response.map((permission: AssetPermissionResponseModel) =>
    Number(permission.subjectId),
  );
  return subjectIds;
};

export const getAssetPermissions = async (assetId: number) => {
  const response = await assetPermissionsApiClient.getAssetPermissions(assetId);
  return response;
};

export const canAssetBePublic = async (
  assetId: number,
  assetPermissions?: AssetPermissionResponseModel[],
) => {
  let permissions = assetPermissions;
  if (permissions === undefined) {
    permissions = await getAssetPermissions(assetId);
  }
  return permissions?.some((permission) => permission.subjectType === SubjectType.All);
};

export const getAssetPermissionIdsForUniverse = async (
  assetId: number,
  assetPermissions?: AssetPermissionResponseModel[],
) => {
  let permissions = assetPermissions;
  if (permissions === undefined) {
    permissions = await getAssetPermissions(assetId);
  }
  const subjectIds = permissions
    ?.filter((permission) => permission.subjectType === SubjectType.Universe)
    .map((permission) => Number(permission.subjectId));
  return subjectIds;
};

export const getUniverseHasPermission = async (assetId: number, universeIds: number[]) => {
  const response = await assetPermissionsApiClient.batchCheckAssetPermissions(
    universeIds.map((value) => {
      return {
        assetId,
        subject: SubjectType.Universe,
        subjectId: value.toString(),
        permissionType: AssetConsumerAction.Use,
      };
    }),
  );

  return response;
};

export const getUserHasEditPermissionForAsset = async (
  userId: number,
  assetId: number,
): Promise<boolean> => {
  const response = await assetPermissionsApiClient.batchCheckAssetPermissions([
    {
      assetId,
      subject: SubjectType.User,
      subjectId: userId.toString(),
      permissionType: AssetConsumerAction.Edit,
    },
  ]);
  if (!response || response.length < 1 || response[0].error) {
    const errorMessage =
      response?.[0]?.error?.message ?? 'Something went wrong fetching asset edit permissions';
    throw new Error(errorMessage);
  }
  return response[0].value?.status === ApiPermissionStatus.HasPermission;
};

export const getExperienceDetails = async (universeIds: number[]) => {
  if (universeIds.length === 0) {
    return null;
  }
  const universeDetails = await gamesClient.getDetails(universeIds);
  if (universeDetails.data && universeDetails.data.length > 0) {
    return universeDetails.data
      .filter((item) => item && item.id && item.name && item.creator && item.creator.name)
      .map((universe) => {
        return {
          universeId: universe.id,
          experienceName: universe.name,
          creatorName: universe.creator?.name,
        } as PermissionAllowedUniverseDetailsType;
      });
  }
  return null;
};

export const getBackToCreationsPageLink = (developerItemDetails: DeveloperItemDetails) => {
  let url = '/dashboard/creations';
  if (developerItemDetails?.type) {
    if (developerItemDetails?.creator.type === Creator.Group) {
      url += `?activeTab=${developerItemDetails.type}&groupId=${developerItemDetails.creator.id}`;
    } else {
      url += `?activeTab=${developerItemDetails.type}`;
    }
  }
  return url;
};

export enum DistributionErrorState {
  AssetNotPublic = 'AssetNotPublic',
  UserNotVerified = 'UserNotVerified',
  InvalidAssetType = 'InvalidAssetType',
  PotentialPolicyViolation = 'PotentialPolicyViolation',
  IneligibleFiatSeller = 'IneligibleFiatSeller',
  Other = 'Other',
  Unauthorized = 'Unauthorized',
  NotStarted = 'NotStarted',
  NotStartedAudioDistribution = 'NotStartedAudioDistribution',
  Approved = 'Approved',
  PackageIneligible = 'PackageIneligible',
  RightsClaim = 'RightsClaim',
  CompositeAssetBrokenDependencies = 'CompositeAssetBrokenDependencies',
  CompositeAssetIneligibleDependencies = 'CompositeAssetIneligibleDependencies',
  CompositeAssetDependenciesLimit = 'CompositeAssetDependenciesLimit',
  HiddenFromSearch = 'HiddenFromSearch',
}

export const getDistributionErrorStateForRestrictions = (
  publishingRestrictions: Restriction[],
  userCanPublish: boolean,
  pricingRestrictions: Restriction[],
  userCanPrice: boolean,
  assetTypeIsMonetizable: boolean,
  isBackendFiatProductPriced: boolean,
  visibilityStatus: ToolboxVisibilityStatus | undefined,
): DistributionErrorState | undefined => {
  // This needs to before the check for broken composite assets, as if this Restriction is present,
  // The asset can NEVER be fixed, and an entirely new one must be uploaded.
  if (publishingRestrictions.includes(Restriction.CompositeAssetSubcomponentsRestricted)) {
    return DistributionErrorState.CompositeAssetIneligibleDependencies;
  }
  if (
    publishingRestrictions.includes(Restriction.CompositeAssetBrokenUnknownPermissions) ||
    publishingRestrictions.includes(Restriction.CompositeAssetBrokenReferencedAssetNotFound)
  ) {
    return DistributionErrorState.CompositeAssetBrokenDependencies;
  }
  if (publishingRestrictions.includes(Restriction.CompositeAssetBrokenDependenciesLimit)) {
    return DistributionErrorState.CompositeAssetDependenciesLimit;
  }
  if (publishingRestrictions.includes(Restriction.SafetyStatus)) {
    return DistributionErrorState.PotentialPolicyViolation;
  }
  if (publishingRestrictions.includes(Restriction.AssetType)) {
    return DistributionErrorState.InvalidAssetType;
  }
  if (publishingRestrictions.includes(Restriction.Authorization)) {
    return DistributionErrorState.Unauthorized;
  }
  if (publishingRestrictions.includes(Restriction.Packages)) {
    return DistributionErrorState.PackageIneligible;
  }
  // If the user can't publish but it's not for a restriction we have a custom error message for, use the generic one
  if (!userCanPublish) {
    return DistributionErrorState.Other;
  }
  // All cases below are for onboarded users.

  // If the user is onboarded and is configuring a paid asset, we specifically check for the following pricing restrictions and redirect them to the onboarding page.
  if (
    isBackendFiatProductPriced &&
    (pricingRestrictions.includes(Restriction.Moderation) ||
      pricingRestrictions.includes(Restriction.ModerationHistory) ||
      pricingRestrictions.includes(Restriction.Verification))
  ) {
    return DistributionErrorState.IneligibleFiatSeller;
  }
  // If the asset has received a Rights Claim, we show a specific error message
  if (
    publishingRestrictions.includes(Restriction.RightsClaim) ||
    pricingRestrictions.includes(Restriction.RightsClaim)
  ) {
    return DistributionErrorState.RightsClaim;
  }
  // If the user can't price a fiat product, but it's not for a restriction we have a custom error message for, use the generic one
  if (!userCanPrice && isBackendFiatProductPriced) {
    return DistributionErrorState.Other;
  }
  // Hidden means asset is not visible in Creator Store Search but is distributable
  if (visibilityStatus === ToolboxVisibilityStatus.Hidden) {
    return DistributionErrorState.HiddenFromSearch;
  }
  return undefined;
};
