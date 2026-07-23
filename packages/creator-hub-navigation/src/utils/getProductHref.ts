import { creatorHubTab, productHrefMapping } from '../topNavigation/constants/navigationConstants';
import type { TProductKey } from '../types';
import { getTabWithComputedHref } from './useTabsWithComputedHref';

function getProductHref(productKey?: TProductKey, originUrl?: string): string {
  let tab = creatorHubTab;
  if (productKey) {
    tab = productHrefMapping.get(productKey) ?? creatorHubTab;
  }

  const tabWithComputedHref = getTabWithComputedHref(tab, originUrl);
  return tabWithComputedHref.href;
}

export default getProductHref;
