import { TaxIdType } from '@modules/clients/brandPlatform';

// Enum to represent different tax ID validation states
export enum TaxIdValidationState {
  Empty = 'Empty', // Both type and ID are empty/invalid
  TypeOnly = 'TypeOnly', // Type selected but no ID provided
  IdOnly = 'IdOnly', // ID provided but no type selected
  Complete = 'Complete', // Both type and ID provided
  Masked = 'Masked', // ID is masked (starts with "*")
}

export interface InputFormContactData {
  contactInfo: {
    name: string;
    email: string;
    address: {
      address1: string;
      address2: string;
      postalCode: string;
      city: string;
      state: string;
      country: string;
    };
  };
}

export const defaultContactInfo: InputFormContactData['contactInfo'] = {
  name: '',
  email: '',
  address: {
    address1: '',
    address2: '',
    postalCode: '',
    city: '',
    state: '',
    country: '',
  },
};

export interface InputFormAccountData {
  accountInfo: {
    entityName: string;
    taxId: {
      type: TaxIdType;
      id: string;
    };
  };
}

export const defaultAccountInfo: InputFormAccountData['accountInfo'] = {
  entityName: '',
  taxId: {
    type: TaxIdType.Invalid,
    id: '',
  },
};

export enum AccountInformationTab {
  CoreAccountInfo = 'coreAccountInfo',
  BillingAddress = 'billingAddress',
  LegalAddress = 'legalAddress',
  Invoicing = 'invoicing',
}

export type AccountInformationTabType = {
  key: AccountInformationTab;
  translationKey: string;
};

export type InputFormData = InputFormContactData & InputFormAccountData;
