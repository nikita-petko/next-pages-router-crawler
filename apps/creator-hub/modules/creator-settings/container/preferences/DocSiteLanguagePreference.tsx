import React, { FunctionComponent, useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Grid, makeStyles, MenuItem, Select, Typography } from '@rbx/ui';
import { Locale, toLocaleNativeName, useTranslation } from '@rbx/intl';
import { getCookieValueByKey, setCookie } from '@rbx/core';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import DocsLocaleCookie from './localizationCookieConstants';
import { availableDocsLocales, StringLocaleMap } from './LocaleConstants';
import sendLanguageSettingAnalyticsEvent from '../../events/utils/eventsHelper';

const useDocSiteLanguagePreferenceStyles = makeStyles()(() => ({
  sectionTitle: {
    marginBottom: 24,
  },

  descriptionTitle: {
    marginBottom: 16,
  },

  description: {
    marginBottom: 36,
  },

  selector: {
    width: '60%',
    maxWidth: 350,
  },

  betaDescription: {
    marginTop: 16,
  },
}));

const DocSiteLanguagePreference: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { translate } = useTranslation();
  const {
    classes: { descriptionTitle, description, selector, betaDescription },
  } = useDocSiteLanguagePreferenceStyles();
  const [currentLocale, setCurrentLocale] = useState<Locale | 'default'>('default');
  const { unifiedLogger } = useUnifiedLoggerProvider();

  useEffect(() => {
    const locale = getCookieValueByKey(DocsLocaleCookie.Name);
    setCurrentLocale(StringLocaleMap.get(locale ?? '') ?? 'default');
  }, []);

  const handleChangeLocale = useCallback(
    async (event: ChangeEvent<{ value: unknown }>) => {
      if (event.target.value === 'default') {
        setCookie(DocsLocaleCookie.Name, '', { path: '/', 'max-age': 0 });
        setCurrentLocale('default');
        return;
      }
      const targetLocale = event.target.value as Locale;
      sendLanguageSettingAnalyticsEvent(unifiedLogger, {
        from: currentLocale,
        to: targetLocale,
      });
      setCookie(DocsLocaleCookie.Name, targetLocale.toLowerCase(), DocsLocaleCookie.Options);
      setCurrentLocale(targetLocale);
    },
    [unifiedLogger, currentLocale],
  );

  return (
    <Grid container direction='column'>
      <Grid item className={descriptionTitle}>
        <Typography variant='h4'>{translate('Title.DocumentationLanguage')}</Typography>
      </Grid>
      <Grid item className={description}>
        <Typography variant='body2' color='secondary'>
          {translate('Description.DocumentationLanguage')}
        </Typography>
      </Grid>
      <Grid item>
        <Select
          className={selector}
          value={currentLocale}
          label={translate('Label.DocumentationLanguage')}
          onChange={handleChangeLocale}>
          <MenuItem key='default' value='default'>
            {translate('Label.SyncWithRoblox')}
          </MenuItem>
          {availableDocsLocales.map((availableLocale) => {
            return (
              <MenuItem key={availableLocale} value={availableLocale}>
                <Grid container direction='row' alignItems='center'>
                  <Grid item>{toLocaleNativeName(availableLocale)}</Grid>
                </Grid>
              </MenuItem>
            );
          })}
        </Select>
      </Grid>
      {currentLocale !== Locale.English && (
        <Grid item className={betaDescription}>
          <Typography variant='body2' color='disabled'>
            {translate('Description.BetaMachineTranslationsWithoutLink')}
          </Typography>
        </Grid>
      )}
    </Grid>
  );
};

export default DocSiteLanguagePreference;
