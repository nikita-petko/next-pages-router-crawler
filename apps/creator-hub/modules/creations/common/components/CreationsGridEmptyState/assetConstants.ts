import { Asset } from '@modules/miscellaneous/common';
import Look from '@modules/miscellaneous/common/enums/Look';
import type { TEmptyState } from '@modules/miscellaneous/components/EmptyState/EmptyState';
import { creatorHub } from '@modules/miscellaneous/urls';
import avatarItemTypeConstants from '../../../avatarItem/constants/avatarItemTypeConstants';

const { docs } = creatorHub;

export type CreationsGridEmptyStateAssetProps = Omit<TEmptyState, 'size' | 'description'> & {
  description: string;
  linkHref?: string;
};

const defaultAvatarItemEmptyState: CreationsGridEmptyStateAssetProps = {
  title: 'Label.EmptyStateAvatarItem',
  description: 'Description.EmptyStateAvatarItem',
  illustration: 'avatarItem',
  linkHref: docs.getAvatarItemsUrl(),
};

const experiencesEmptyState: CreationsGridEmptyStateAssetProps = {
  title: 'Label.EmptyStateExperiences',
  description: 'Description.EmptyStateExperiences',
  illustration: 'experiences',
  linkHref: docs.getExperiencesPublishingUrl(),
};

const eventsEmptyState: CreationsGridEmptyStateAssetProps = {
  title: 'Label.EmptyStateEvents',
  description: 'Description.EmptyStateEvents',
  illustration: 'events',
  linkHref: docs.getEventsPlatformUrl(),
};

const emptyStateByNonCatalogAsset: Partial<Record<Asset, CreationsGridEmptyStateAssetProps>> = {
  [Asset.MyExperiences]: experiencesEmptyState,
  [Asset.SharedExperiences]: experiencesEmptyState,
  [Asset.Event]: eventsEmptyState,
  [Asset.PastEvent]: eventsEmptyState,
  [Asset.DraftEvent]: eventsEmptyState,
  [Asset.UpcomingEvent]: eventsEmptyState,
  [Asset.Model]: {
    title: 'Label.EmptyStateModelsPackages',
    description: 'Description.EmptyStateModelsPackages',
    illustration: 'models',
    linkHref: docs.getModelsUrl(),
  },
  [Asset.Plugin]: {
    title: 'Label.EmptyStatePlugins',
    description: 'Description.EmptyStatePlugins',
    illustration: 'plugins',
    linkHref: docs.getPluginsReferenceUrl(),
  },
  [Asset.MeshPart]: {
    title: 'Label.EmptyStateMeshParts',
    description: 'Description.EmptyStateMeshParts',
    illustration: 'meshes',
    linkHref: docs.getMeshPartReferenceUrl(),
  },
  [Asset.Mesh]: {
    title: 'Label.EmptyStateMeshes',
    description: 'Description.EmptyStateMeshes',
    illustration: 'meshes',
  },
  [Asset.Animation]: {
    title: 'Label.EmptyStateAnimations',
    description: 'Description.EmptyStateAnimations',
    illustration: 'animations',
    linkHref: docs.getAnimationReferenceUrl(),
  },
  [Asset.Audio]: {
    title: 'Label.EmptyStateAudio',
    description: 'Description.EmptyStateAudio',
    illustration: 'audio',
  },
  [Asset.Decal]: {
    title: 'Label.EmptyStateDecals',
    description: 'Description.EmptyStateDecals',
    illustration: 'decals',
    linkHref: docs.getDecalReferenceUrl(),
  },
  [Asset.Image]: {
    title: 'Label.EmptyStateImages',
    description: 'Description.EmptyStateImages',
    illustration: 'images',
  },
  [Asset.Video]: {
    title: 'Label.EmptyStateVideos',
    description: 'Description.EmptyStateVideos',
    illustration: 'videos',
    linkHref: docs.getVideoFrameReferenceUrl(),
  },
};

const getEmptyStateProps = (asset: Asset, lookType?: Look): CreationsGridEmptyStateAssetProps => {
  if (lookType !== undefined) {
    switch (lookType) {
      case Look.Makeup:
        return {
          title: 'Label.EmptyStateMakeupLooks',
          description: 'Description.EmptyStateLooks',
          illustration: 'makeupLooks',
          linkHref: docs.getMakeupLooksUrl(),
        };
      case Look.Avatar:
        return {
          title: 'Label.EmptyStateAvatarLook',
          description: 'Description.EmptyStateLooks',
          illustration: 'avatarItem',
          linkHref: docs.getAvatarItemsUrl(),
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
  if (asset === Asset.AvatarBackground) {
    return {
      title: 'Label.EmptyStateAvatarBackground',
      description: 'Description.EmptyStateAvatarBackground',
      illustration: 'avatarItem',
      linkHref: docs.getAvatarItemsUrl(),
    };
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

  return emptyStateByNonCatalogAsset[asset] ?? defaultAvatarItemEmptyState;
};

export default getEmptyStateProps;
