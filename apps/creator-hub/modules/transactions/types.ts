import { ReactElement } from 'react';

export enum TransactionTab {
  CreatorStore = 'store',
  PaidAccess = 'paidAccess',
  Legacy = 'Redirect',
}

export type TransactionTabType = {
  key: TransactionTab;
  translationKey: string;
  icon?: ReactElement;
};
