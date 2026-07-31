import {
  CreatorInventoryApi,
  SourceType as CreatorInventorySourceType,
} from '@rbx/client-creator-inventory-api/v1';
import type {
  CreatorInventoryItem,
  SearchCreatorInventoryItemsFilter,
  Source as CreatorInventorySource,
} from '@rbx/client-creator-inventory-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export enum CreatorInventoryAssetType {
  Animation = 'Animation',
  Audio = 'Audio',
  Decal = 'Decal',
  Image = 'Image',
  Mesh = 'Mesh',
  MeshPart = 'MeshPart',
  Model = 'Model',
  Plugin = 'Plugin',
  Video = 'Video',
}

export { CreatorInventorySourceType };
export type { CreatorInventoryItem, CreatorInventorySource, SearchCreatorInventoryItemsFilter };

export enum CreatorInventoryScopeType {
  Group = 'groups',
  User = 'users',
}

export type CreatorInventoryScope = {
  type: CreatorInventoryScopeType;
  id: number;
};

const creatorInventoryClient = new CreatorInventoryApi(
  createClientConfiguration('creator-inventory-api', 'bedev2'),
);

export default creatorInventoryClient;
