import { createContext, Context } from 'react';
import TranslationResourceProvider from './interfaces/TranslationResourceProvider';

export type TranslationResourceProviderType = {
  provider: TranslationResourceProvider | null;
};

export interface TranslationResourceProviderContext
  extends Context<TranslationResourceProviderType> {
  displayName: 'TranslationProvider';
}

const translationResourceProviderContext = createContext<TranslationResourceProviderType>({
  provider: null,
});
translationResourceProviderContext.displayName = 'TranslationProvider';

export default translationResourceProviderContext;
