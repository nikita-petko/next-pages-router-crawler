import { createContext } from 'react';
import { Locale } from '@rbx/intl';

type CurrentLocaleType = {
  urlLocale: Locale;
  targetLocale: Locale;
  creatorHubLocale: Locale;
  subPath: string;
  isLocalePrefixed: boolean;
};

const CurrentLocaleContext = createContext<CurrentLocaleType>({
  urlLocale: Locale.English,
  targetLocale: Locale.English,
  creatorHubLocale: Locale.English,
  subPath: '',
  isLocalePrefixed: true,
});
CurrentLocaleContext.displayName = 'CurrentLocale';

export default CurrentLocaleContext;
