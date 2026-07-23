import type { CommerceProductModel } from '@modules/clients/commerce';
import { ProductStatusType } from '@rbx/clients/commerceApi/v1';
import { CommerceProductBundlingFeeStatus, ProductReviewType } from '@rbx/clients/commerceApi';

export const isProductApproved = (product: CommerceProductModel) => {
  // If there's a moderation review task, the product is pending moderation
  const hasModerationTask = product.reviewTasks?.some(
    (task) => task.reviewType === ProductReviewType.NUMBER_2,
  );
  if (hasModerationTask) {
    return false;
  }

  // If there's a bundling fee review task, check bundling fee status
  const hasBundlingFeeTask = product.reviewTasks?.some(
    (task) => task.reviewType === ProductReviewType.NUMBER_1,
  );
  if (hasBundlingFeeTask) {
    return product.bundlingFee?.status === CommerceProductBundlingFeeStatus.NUMBER_1;
  }

  // If no review tasks, check product status
  if (product.status === ProductStatusType.NUMBER_2) {
    return true;
  }

  return false;
};

export const anySelectedProductsNeedBundlingFeeApproval = (products: CommerceProductModel[]) => {
  return products.some((product) => {
    const hasBundlingFeeTask = product.reviewTasks?.some(
      (task) => task.reviewType === ProductReviewType.NUMBER_1,
    );
    return (
      hasBundlingFeeTask &&
      product.bundlingFee?.status === CommerceProductBundlingFeeStatus.NUMBER_1
    );
  });
};

export default {
  isProductApproved,
};
