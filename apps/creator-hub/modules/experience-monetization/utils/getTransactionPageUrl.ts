import { OwnerType } from '@modules/clients/analytics';
import { www } from '@modules/miscellaneous/urls';

type PartialOwner = { isFetched: boolean } & Partial<{ ownerType: OwnerType; ownerId: number }>;

export default function getTransactionPageUrl(owner: PartialOwner): string {
  if (!owner.isFetched || owner.ownerType === undefined) {
    return www.getTransactionsUrl();
  }
  if (owner.ownerType === OwnerType.Group) {
    return www.getConfigureGroupRevenueSalesUrl(owner?.ownerId ?? 0);
  }
  return www.getTransactionsUrl();
}
