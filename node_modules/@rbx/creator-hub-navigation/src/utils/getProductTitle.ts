import { creatorHubTab, productTitleMapping } from '../topNavigation/constants/navigationConstants';
import type { TProductKey } from '../types';

function getProductTitle(productKey?: TProductKey): string {
  if (!productKey) {
    return creatorHubTab.title;
  }
  if (productKey === 'Forum') {
    return 'Heading.DeveloperForum';
  }
  return productTitleMapping.get(productKey) ?? creatorHubTab.title;
}

export default getProductTitle;
