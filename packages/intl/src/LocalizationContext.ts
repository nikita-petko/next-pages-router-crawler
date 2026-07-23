import { createContext, Context } from 'react';
import Localization from './interfaces/Localization';

export type LocalizationType = Localization | undefined;

export interface LocalizationContext extends Context<LocalizationType> {
  displayName: 'Localization';
}

const localizationContext = createContext<LocalizationType>(undefined);
localizationContext.displayName = ' Localization';

export default localizationContext;
