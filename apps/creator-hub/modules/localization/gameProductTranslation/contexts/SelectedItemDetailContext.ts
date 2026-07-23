import { createContext } from 'react';
import type {
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
    throw new Error('UnImplemented');
  },
  addEventListener: () => {
    throw new Error('UnImplemented');
  },
  removeEventListener: () => {
    throw new Error('UnImplemented');
  },
  dispatchEvent: () => {
    throw new Error('UnImplemented');
  },
});
selectedItemDetailContext.displayName = 'SelectedItemDetail';

export default selectedItemDetailContext;
