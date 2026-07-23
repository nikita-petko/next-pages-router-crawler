import { useLocalization } from '@rbx/intl';
import { useMemo } from 'react';

import { defaultTimeZone, timezones } from '@constants/app';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import {
  getLocalizedDefaultTimeZone,
  getLocalizedTimezones,
  type TimezoneFormOptionObj,
} from '@utils/timezone';

const useTimezones = () => {
  const { locale } = useLocalization();
  const { translate } = useNamespacedTranslation(TranslationNamespace.Timezone);

  const localizedTimezones: TimezoneFormOptionObj[] = useMemo(
    () => (locale ? getLocalizedTimezones(locale, translate) : timezones),
    [locale, translate],
  );

  const localizedDefaultTimeZone: TimezoneFormOptionObj = useMemo(
    () => (locale ? getLocalizedDefaultTimeZone(locale, translate) : defaultTimeZone),
    [locale, translate],
  );

  const getTimezoneByEnum = useMemo(
    () => (enumValue?: number) => {
      if (!enumValue) {
        return localizedDefaultTimeZone;
      }
      return localizedTimezones.find((tz) => tz.value === enumValue) ?? localizedDefaultTimeZone;
    },
    [localizedTimezones, localizedDefaultTimeZone],
  );

  return { getTimezoneByEnum, localizedDefaultTimeZone, localizedTimezones };
};

export default useTimezones;
