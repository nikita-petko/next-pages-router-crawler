import type { CreatorType, GetAssetDependenciesResult } from '@rbx/client-asset-permissions-api/v1';
import { AccessStatus, AssetType } from '@rbx/client-asset-permissions-api/v1';

export enum AssetDependencyFilter {
  All,
  CannotBeDistributedViaComposite,
  CannotBeSharedViaComposite,
  CreatedByParentCreator,
  ShouldBeMadeRestrictedBeforeIncludingInPaidComposite,
}

const dependencyCreatedByParentCreator = (
  dependency: GetAssetDependenciesResult,
  parentCreator: { id: number; type: CreatorType },
) => dependency.creator?.id === parentCreator.id && dependency.creator?.type === parentCreator.type;

// Unlike for distribution, Restricted Audio/Video can be shared via a composite
// However, like the other asset types, they must still be created by the parent creator
const dependencyCannotBeSharedViaComposite = (
  dependency: GetAssetDependenciesResult,
  parentCreator: { id: number; type: CreatorType },
) =>
  dependency.accessStatus === AccessStatus.Restricted &&
  !dependencyCreatedByParentCreator(dependency, parentCreator);

// Only Open Use Audio/Video can be included in a distributed composite
// For other asset types, Restricted dependencies can be included if they were created by the parent creator
const dependencyCannotBeDistributedViaComposite = (
  dependency: GetAssetDependenciesResult,
  parentCreator: { id: number; type: CreatorType },
) =>
  dependency.accessStatus === AccessStatus.Restricted &&
  (dependency.assetType === AssetType.Audio ||
    dependency.assetType === AssetType.Video ||
    !dependencyCreatedByParentCreator(dependency, parentCreator));

/*
 * For any non-Audio/Video dependency that can be Restricted and part of a paid
 * composite, we encourage the creator to create the dependency as Restricted.
 *
 * We also explicitly exclude TexturePacks from this check.
 * This is because a TexturePack owned by a creator can reference
 * OpenUse Images owned by another creator. For TexturePacks specifically,
 * we are only concerned if the underlying Images owned by the creator are
 * Open Use. And our existing validation check, which excludes TexturePacks,
 * will catch this.
 */
const dependencyShouldBeMadeRestrictedBeforeIncludingInPaidComposite = (
  dependency: GetAssetDependenciesResult,
  parentCreator: { id: number; type: CreatorType },
) =>
  dependency.accessStatus === AccessStatus.OpenUse &&
  dependency.assetType !== AssetType.Audio &&
  dependency.assetType !== AssetType.Video &&
  dependency.assetType !== AssetType.TexturePack &&
  dependencyCreatedByParentCreator(dependency, parentCreator);

export const getFilteredDependencies = (
  dependencies: GetAssetDependenciesResult[] | null | undefined,
  filter: AssetDependencyFilter,
  includeAccessStatus: boolean,
  parentCreator: { id: number; type: CreatorType } | null,
) => {
  if (
    !dependencies ||
    filter === AssetDependencyFilter.All ||
    !includeAccessStatus ||
    !parentCreator
  ) {
    return dependencies ?? [];
  }

  let dependencyFilter;
  switch (filter) {
    case AssetDependencyFilter.CannotBeDistributedViaComposite:
      dependencyFilter = dependencyCannotBeDistributedViaComposite;
      break;
    case AssetDependencyFilter.CannotBeSharedViaComposite:
      dependencyFilter = dependencyCannotBeSharedViaComposite;
      break;
    case AssetDependencyFilter.CreatedByParentCreator:
      dependencyFilter = dependencyCreatedByParentCreator;
      break;
    case AssetDependencyFilter.ShouldBeMadeRestrictedBeforeIncludingInPaidComposite:
      dependencyFilter = dependencyShouldBeMadeRestrictedBeforeIncludingInPaidComposite;
      break;
    default:
      throw new Error(`Invalid filter: ${filter}`);
  }

  return dependencies.filter((dependency) => dependencyFilter(dependency, parentCreator));
};
