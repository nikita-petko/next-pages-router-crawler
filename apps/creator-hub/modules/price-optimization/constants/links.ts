import { dashboard, docs } from '@modules/miscellaneous/common/urls/creatorHub';
import { getSupportFormUrl } from '@modules/miscellaneous/common/urls/www';

export const supportLink = getSupportFormUrl();

export const rootDocumentationLink = docs.getPriceOptimizationMonetizationUrl();
export const usePriceOptimizationDocLink = `${rootDocumentationLink}#using-price-optimization`;
export const priceReviewDocLink = `${rootDocumentationLink}#running-a-price-review-period`;

export const introductionVideoId = 'ULr3CZ8egP8';

export const getPriceCheckLinkFromPriceOptimization = (universeId: string | number) =>
  dashboard.getMonetizationDynamicPriceCheckUrl(universeId, { from: 'price-optimization' });
