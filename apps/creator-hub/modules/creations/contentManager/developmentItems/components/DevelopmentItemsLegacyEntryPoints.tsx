import type { FunctionComponent, ReactNode } from 'react';
import { CreatorInventoryAssetType } from '@modules/clients/creatorInventory';
import { Asset } from '@modules/miscellaneous/common';
import CreationsGridEmptyState from '../../../common/components/CreationsGridEmptyState/CreationsGridEmptyState';
import OpenStudioButton from '../../../developerItem/common/list/openStudioButton/OpenStudioButton';
import UploadAssetButton from '../../../developerItem/common/list/uploadAssetButton/UploadAssetButton';
import { getLegacyDevelopmentItemsAssetType } from '../developmentItemsInventoryUtils';
import DevelopmentItemsPrimitiveNavigation from './DevelopmentItemsPrimitiveNavigation';

export type DevelopmentItemsLegacyEntryPointsProps = {
  assetType: CreatorInventoryAssetType;
  hasItems: boolean;
};

const shouldPreserveUploadAssetCta = (assetType: CreatorInventoryAssetType): boolean =>
  assetType === CreatorInventoryAssetType.Audio ||
  assetType === CreatorInventoryAssetType.Decal ||
  assetType === CreatorInventoryAssetType.Video;

const getEmptyStateAction = (assetType: CreatorInventoryAssetType): ReactNode => {
  switch (assetType) {
    case CreatorInventoryAssetType.Animation:
    case CreatorInventoryAssetType.MeshPart:
    case CreatorInventoryAssetType.Model:
    case CreatorInventoryAssetType.Plugin:
    case CreatorInventoryAssetType.TextDocument:
      return <OpenStudioButton />;
    case CreatorInventoryAssetType.Image:
      return <DevelopmentItemsPrimitiveNavigation assetType={CreatorInventoryAssetType.Image} />;
    case CreatorInventoryAssetType.Mesh:
      return <DevelopmentItemsPrimitiveNavigation assetType={CreatorInventoryAssetType.Mesh} />;
    case CreatorInventoryAssetType.Audio:
    case CreatorInventoryAssetType.Decal:
    case CreatorInventoryAssetType.Video:
      return undefined;
  }

  return undefined;
};

const DevelopmentItemsLegacyEntryPoints: FunctionComponent<
  DevelopmentItemsLegacyEntryPointsProps
> = ({ assetType, hasItems }) => {
  if (!hasItems) {
    return (
      <CreationsGridEmptyState
        assetType={getLegacyDevelopmentItemsAssetType(assetType)}
        preserveUploadAssetCta={shouldPreserveUploadAssetCta(assetType)}>
        {getEmptyStateAction(assetType)}
      </CreationsGridEmptyState>
    );
  }

  switch (assetType) {
    case CreatorInventoryAssetType.Audio:
      return <UploadAssetButton assetType={Asset.Audio} preserveUploadAssetCta />;
    case CreatorInventoryAssetType.Decal:
      return <UploadAssetButton assetType={Asset.Decal} preserveUploadAssetCta />;
    case CreatorInventoryAssetType.Video:
      return <UploadAssetButton assetType={Asset.Video} preserveUploadAssetCta />;
    case CreatorInventoryAssetType.Image:
      return (
        <DevelopmentItemsPrimitiveNavigation
          assetType={CreatorInventoryAssetType.Image}
          showDescription
        />
      );
    case CreatorInventoryAssetType.Mesh:
      return (
        <DevelopmentItemsPrimitiveNavigation
          assetType={CreatorInventoryAssetType.Mesh}
          showDescription
        />
      );
    case CreatorInventoryAssetType.Animation:
    case CreatorInventoryAssetType.MeshPart:
    case CreatorInventoryAssetType.Model:
    case CreatorInventoryAssetType.Plugin:
    case CreatorInventoryAssetType.TextDocument:
      return null;
  }

  return null;
};

export default DevelopmentItemsLegacyEntryPoints;
