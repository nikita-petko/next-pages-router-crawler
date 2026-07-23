import { createContext, Context } from 'react';
import TranslationResource from './interfaces/TranslationResource';

export type TranslationResourceType = {
  key?: string;
  ready: boolean;
  resources: TranslationResource | null;
};

export interface TranslationResourceContext extends Context<TranslationResourceType> {
  displayName: 'Translation';
}

const translationResourceContext = createContext<TranslationResourceType>({
  resources: null,
  ready: false,
});
translationResourceContext.displayName = 'Translation';

export default translationResourceContext;
