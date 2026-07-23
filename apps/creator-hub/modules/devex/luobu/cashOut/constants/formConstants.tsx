import React, { ReactNode } from 'react';
import CurrencyAdornment from '../components/CurrencyAdornment';
import TermsOfServiceLabel from '../components/TermsOfServiceLabel';

export type Editor = 'textfield' | 'numberfield' | 'checkbox';
type InputType = 'text' | 'email' | 'number' | 'password' | 'submit';

export interface FormField {
  editor: Editor;
  id: string;
  nameKey?: string;
  label?: ReactNode;
  placeholder?: string;
  type?: InputType;
  startAdornment?: ReactNode;
}

const cashOutFormFields: FormField[] = [
  {
    editor: 'textfield',
    id: 'firstName',
    nameKey: 'Label.FirstName',
  },
  {
    editor: 'textfield',
    id: 'lastName',
    nameKey: 'Label.LastName',
  },
  {
    editor: 'textfield',
    id: 'email',
    nameKey: 'Label.EmailAddress',
    type: 'email',
  },
  {
    editor: 'numberfield',
    id: 'amount',
    nameKey: 'Label.Amount',
    placeholder: 'Amount',
    // FIXME: Hard coded currency symbol
    startAdornment: <CurrencyAdornment>¥</CurrencyAdornment>,
  },
  {
    editor: 'checkbox',
    id: 'termsOfService',
    label: <TermsOfServiceLabel />,
  },
];

export default cashOutFormFields;
