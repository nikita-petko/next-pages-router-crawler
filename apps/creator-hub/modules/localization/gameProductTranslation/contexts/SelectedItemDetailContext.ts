import { createContext } from 'react';
import {
  NameField,
  DescriptionField,
  IconField,
  FieldUpdateEventCallback,
  FieldUpdateEvent,
  ProductFieldIdentifier,
} from '../types';

export type SelectedItemDetailContext = {
  itemDetail: NameField | DescriptionField | IconField | null;
  setSelectedItem: (item: NameField | DescriptionField | IconField | null) => void;
  addEventListener: (
    listener: FieldUpdateEventCallback,
    identifier: ProductFieldIdentifier,
  ) => void;
  removeEventListener: (identifier: ProductFieldIdentifier) => void;
  dispatchEvent: (event: FieldUpdateEvent) => void;
};

const selectedItemDetailContext = createContext<SelectedItemDetailContext>({
  itemDetail: null,
  setSelectedItem: () => {
    throw Error('UnImplemented');
  },
  addEventListener: () => {
    throw Error('UnImplemented');
  },
  removeEventListener: () => {
    throw Error('UnImplemented');
  },
  dispatchEvent: () => {
    throw Error('UnImplemented');
  },
});
selectedItemDetailContext.displayName = 'SelectedItemDetail';

export default selectedItemDetailContext;
