import { Locale as RbxLocale, useLocalization } from '@rbx/intl';
import { Locale } from 'date-fns';
import { useEffect, useState } from 'react';

import { CaptureException } from '@utils/error';

// Locales supported by Creator Hub: https://roblox.atlassian.net/wiki/spaces/IN/pages/1557596565/Supported+Languages#Creator-Hub
const LOCALE_IMPORT_MAP: Partial<Record<RbxLocale, () => Promise<{ default: Locale }>>> = {
  [RbxLocale.Arabic]: () => import('date-fns/locale/ar-SA'),
  [RbxLocale.BrazilPortuguese]: () => import('date-fns/locale/pt-BR'),
  [RbxLocale.French]: () => import('date-fns/locale/fr'),
  [RbxLocale.German]: () => import('date-fns/locale/de'),
  [RbxLocale.Hindi]: () => import('date-fns/locale/hi'),
  [RbxLocale.Indonesian]: () => import('date-fns/locale/id'),
  [RbxLocale.Italian]: () => import('date-fns/locale/it'),
  [RbxLocale.Japanese]: () => import('date-fns/locale/ja'),
  [RbxLocale.Korean]: () => import('date-fns/locale/ko'),
  [RbxLocale.Polish]: () => import('date-fns/locale/pl'),
  [RbxLocale.Russian]: () => import('date-fns/locale/ru'),
  [RbxLocale.SimplifiedChinese]: () => import('date-fns/locale/zh-CN'),
  [RbxLocale.Spanish]: () => import('date-fns/locale/es'),
  [RbxLocale.Thai]: () => import('date-fns/locale/th'),
  [RbxLocale.TraditionalChinese]: () => import('date-fns/locale/zh-TW'),
  [RbxLocale.Turkish]: () => import('date-fns/locale/tr'),
  [RbxLocale.Vietnamese]: () => import('date-fns/locale/vi'),
};

const localeCache = new Map<string, Locale>();

const useDateFnsLocale = (): Locale | undefined => {
  const { locale } = useLocalization();
  const [dateFnsLocale, setDateFnsLocale] = useState<Locale | undefined>(
    locale ? localeCache.get(locale) : undefined,
  );

  useEffect(() => {
    if (!locale || locale === RbxLocale.English) {
      setDateFnsLocale(undefined);
      return;
    }

    const cached = localeCache.get(locale);
    if (cached) {
      setDateFnsLocale(cached);
      return;
    }

    const importer = LOCALE_IMPORT_MAP[locale as RbxLocale];
    if (!importer) {
      setDateFnsLocale(undefined);
      return;
    }

    importer()
      .then((mod) => {
        localeCache.set(locale, mod.default);
        setDateFnsLocale(mod.default);
      })
      .catch((err) => {
        CaptureException(`Failed to load date-fns locale for ${locale}: ${err}`);
        setDateFnsLocale(undefined);
      });
  }, [locale]);

  return dateFnsLocale;
};

export default useDateFnsLocale;
