import productConfiguration from '../constants/productConfigurationConstants';

/**
 *
 * @param productName the product name
 * @returns an object with the first and second level translation keys
 */
export default function getLabelTranslationKeys(productName: string) {
  return {
    firstLevelFormLabelKey: productConfiguration[productName]?.firstLevelFormLabelKey,
    secondLevelFormLabelKey: productConfiguration[productName]?.secondLevelFormLabelKey,
  };
}
