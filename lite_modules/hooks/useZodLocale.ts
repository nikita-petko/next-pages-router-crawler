import { Locale as RbxLocale, useLocalization } from '@rbx/intl';
import { useEffect } from 'react';
import { z } from 'zod';

import { CaptureException } from '@utils/error';

// Locales supported by Creator Hub: https://roblox.atlassian.net/wiki/spaces/IN/pages/1557596565/Supported+Languages#Creator-Hub
const LOCALE_TO_ZOD_KEY: Partial<Record<RbxLocale, string>> = {
  [RbxLocale.Arabic]: 'ar',
  [RbxLocale.BrazilPortuguese]: 'pt',
  [RbxLocale.French]: 'fr',
  [RbxLocale.German]: 'de',
  [RbxLocale.Indonesian]: 'id',
  [RbxLocale.Italian]: 'it',
  [RbxLocale.Japanese]: 'ja',
  [RbxLocale.Korean]: 'ko',
  [RbxLocale.Polish]: 'pl',
  [RbxLocale.Russian]: 'ru',
  [RbxLocale.SimplifiedChinese]: 'zhCN',
  [RbxLocale.Spanish]: 'es',
  [RbxLocale.Thai]: 'th',
  [RbxLocale.TraditionalChinese]: 'zhTW',
  [RbxLocale.Turkish]: 'tr',
  [RbxLocale.Vietnamese]: 'vi',
};

const useZodLocale = () => {
  const { locale } = useLocalization();

  useEffect(() => {
    if (!locale) {
      return;
    }

    const zodKey = LOCALE_TO_ZOD_KEY[locale as RbxLocale];
    if (!zodKey) {
      return;
    }

    import('zod/locales')
      .then((locales) => {
        const localeFn = locales[zodKey as keyof typeof locales];
        if (typeof localeFn === 'function') {
          z.config(localeFn());
        }
      })
      .catch((err) => {
        CaptureException(`Failed to load zod locale for ${locale}: ${err}`);
      });
  }, [locale]);
};

export default useZodLocale;
