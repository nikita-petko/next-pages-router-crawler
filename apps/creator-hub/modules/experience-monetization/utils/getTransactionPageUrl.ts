import { OwnerType } from '@modules/clients/analytics';
import { urls } from '@modules/miscellaneous/common';

type PartialOwner = { isFetched: boolean } & Partial<{ ownerType: OwnerType; ownerId: number }>;

export default function getTransactionPageUrl(owner: PartialOwner): string {
  if (!owner.isFetched || owner.ownerType === undefined) {
    return urls.www.getTransactionsUrl();
  }
  if (owner.ownerType === OwnerType.Group) {
    return urls.www.getConfigureGroupRevenueSalesUrl(owner?.ownerId ?? 0);
  }
  return urls.www.getTransactionsUrl();
}
