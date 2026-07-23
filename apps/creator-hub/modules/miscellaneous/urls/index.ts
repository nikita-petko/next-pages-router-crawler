import Item from '../common/enums/Item';
import * as app from './app';
import * as creatorHub from './creatorHub';
import * as www from './www';

export * as blog from './blog';
export * as events from './events';
export * as www from './www';
export * as creatorHub from './creatorHub';
export * as studio from './studio';
export * as app from './app';
export * as terms from './terms';

export const getUrlForItemType = (itemType: Item, assetId: number) => {
  switch (itemType) {
    case Item.Game:
      return www.getGameDetailsUrl(assetId);
    case Item.LibraryAsset:
      return creatorHub.creatorStore.getAssetUrl(assetId);
    case Item.CatalogAsset:
      return www.getCatalogUrl(assetId);
    case Item.Badge:
      return www.getBadgeUrl(assetId);
    case Item.GamePass:
      return www.getGamePassUrl(assetId);
    case Item.Event:
      return app.getEventUrl(assetId);
    case Item.Bundle:
      return www.getBundleUrl(assetId);
    case Item.Look:
      return www.getLookUrl(assetId);
    default:
      return null;
  }
};
