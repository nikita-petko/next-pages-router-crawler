import ProductNames from '../enums/ProductNames';
import type ProductConfiguration from '../interfaces/ProductConfiguration';

const productConfiguration: { [key: string]: ProductConfiguration } = {
  [ProductNames.PlacePublish]: {
    firstLevelFormLabelKey: 'Description.UniverseTargetPart', // simple translation key label
  },
  [ProductNames.Datastores]: {
    firstLevelFormLabelKey: 'Message.SelectAllDatastores',
  },
  [ProductNames.AssetPublish]: {
    firstLevelFormLabelKey: 'Label.CreatorAssets',
  },
  [ProductNames.Assets]: {
    firstLevelFormLabelKey: 'Message.SelectAllAssets',
  },
};

export default productConfiguration;
