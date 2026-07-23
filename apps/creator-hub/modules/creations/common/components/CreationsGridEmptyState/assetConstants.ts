import { TEmptyState } from '@modules/miscellaneous/common/components/EmptyState/EmptyState';
import { Asset, urls } from '@modules/miscellaneous/common';
import { avatarItemTypeConstants } from '@modules/creations/avatarItem';
import Look from '@modules/miscellaneous/common/enums/Look';

const {
  creatorHub: { docs },
} = urls;

const getEmptyStateProps = (
  asset: Asset,
  lookType?: Look,
): Omit<TEmptyState, 'size' | 'description'> & {
  description: string;
  linkHref?: string;
} => {
  if (lookType !== undefined) {
    switch (lookType) {
      case Look.Makeup:
        return {
          title: 'Label.EmptyStateMakeupLooks',
          description: 'Description.EmptyStateLooks',
          illustration: 'makeupLooks',
          linkHref: docs.getMakeupLooksUrl(),
        };
      default:
        return {
          title: 'Label.EmptyStateAvatarItem',
          description: 'Description.EmptyStateAvatarItem',
          illustration: 'avatarItem',
          linkHref: docs.getAvatarItemsUrl(),
        };
    }
  }
  if (avatarItemTypeConstants.avatar2DAssetTypes.includes(asset)) {
    return {
      title: 'Label.EmptyStateAvatarItem',
      description: 'Description.EmptyStateAvatarItem',
      illustration: 'avatarItem',
      linkHref: docs.getClassicAccessoriesUrl(),
    };
  }
  if (avatarItemTypeConstants.avatarAssetTypes.includes(asset)) {
    return {
      title: 'Label.EmptyStateAvatarItem',
      description: 'Description.EmptyStateAvatarItem',
      illustration: 'avatarItem',
      linkHref: docs.getAvatarItemsUrl(),
    };
  }

  switch (asset) {
    case Asset.MyExperiences:
    case Asset.SharedExperiences:
      return {
        title: 'Label.EmptyStateExperiences',
        description: 'Description.EmptyStateExperiences',
        illustration: 'experiences',
        linkHref: docs.getExperiencesPublishingUrl(),
      };
    case Asset.Event:
    case Asset.PastEvent:
    case Asset.DraftEvent:
    case Asset.UpcomingEvent:
      return {
        title: 'Label.EmptyStateEvents',
        description: 'Description.EmptyStateEvents',
        illustration: 'events',
        linkHref: docs.getEventsPlatformUrl(),
      };
    case Asset.Model:
      return {
        title: 'Label.EmptyStateModelsPackages',
        description: 'Description.EmptyStateModelsPackages',
        illustration: 'models',
        linkHref: docs.getModelsUrl(),
      };
    case Asset.Plugin:
      return {
        title: 'Label.EmptyStatePlugins',
        description: 'Description.EmptyStatePlugins',
        illustration: 'plugins',
        linkHref: docs.getPluginsReferenceUrl(),
      };
    case Asset.MeshPart:
      return {
        title: 'Label.EmptyStateMeshParts',
        description: 'Description.EmptyStateMeshParts',
        illustration: 'meshes',
        linkHref: docs.getMeshPartReferenceUrl(),
      };
    case Asset.Mesh:
      return {
        title: 'Label.EmptyStateMeshes',
        description: 'Description.EmptyStateMeshes',
        illustration: 'meshes',
      };
    case Asset.Animation:
      return {
        title: 'Label.EmptyStateAnimations',
        description: 'Description.EmptyStateAnimations',
        illustration: 'animations',
        linkHref: docs.getAnimationReferenceUrl(),
      };
    case Asset.Audio:
      return {
        title: 'Label.EmptyStateAudio',
        description: 'Description.EmptyStateAudio',
        illustration: 'audio',
      };
    case Asset.Decal:
      return {
        title: 'Label.EmptyStateDecals',
        description: 'Description.EmptyStateDecals',
        illustration: 'decals',
        linkHref: docs.getDecalReferenceUrl(),
      };
    case Asset.Image:
      return {
        title: 'Label.EmptyStateImages',
        description: 'Description.EmptyStateImages',
        illustration: 'images',
      };
    case Asset.Video:
      return {
        title: 'Label.EmptyStateVideos',
        description: 'Description.EmptyStateVideos',
        illustration: 'videos',
        linkHref: docs.getVideoFrameReferenceUrl(),
      };
    default:
      return {
        title: 'Label.EmptyStateAvatarItem',
        description: 'Description.EmptyStateAvatarItem',
        illustration: 'avatarItem',
        linkHref: docs.getAvatarItemsUrl(),
      };
  }
};

export default getEmptyStateProps;
