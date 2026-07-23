import type { ReactElement } from 'react';

export enum TransactionTab {
  CreatorStore = 'store',
  PaidAccess = 'paidAccess',
  Virtual = 'virtual',
  Legacy = 'Redirect',
}

export type TransactionTabType = {
  key: TransactionTab;
  translationKey: string;
  icon?: ReactElement;
};
