import React, { FunctionComponent, useMemo } from 'react';
import { Typography, Grid, CircularProgress } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useSupportedLanguageListStyles from './SupportedLanguageList.styles';
import uselanguageManagement from '../../hooks/useLanguageManagement';

export interface AutoTranslationStatusProps {
  languageCode: string;
  autoTranslationSwitchedOn: boolean;
  isAutoTranslationAvailable: boolean;
  isInfoAutoTranslationOn: boolean;
}

const AutoTranslationStatus: FunctionComponent<
  React.PropsWithChildren<AutoTranslationStatusProps>
> = ({
  languageCode,
  autoTranslationSwitchedOn,
  isAutoTranslationAvailable,
  isInfoAutoTranslationOn,
}) => {
  const {
    classes: { statusText, statusOnText, descriptionText },
  } = useSupportedLanguageListStyles();
  const { translate } = useTranslation();
  const { langCodeListInATUpdate, langCodeListInInfoATUpdate } = uselanguageManagement();

  const infoAutoTranslationContent = useMemo(() => {
    if (langCodeListInInfoATUpdate.includes(languageCode)) {
      return <CircularProgress size={12} />;
    }
    if (isInfoAutoTranslationOn) {
      return <span className={statusOnText}>{translate('Label.SwitchedOn')}</span>;
    }
    return translate('Label.SwitchedOff');
  }, [languageCode, isInfoAutoTranslationOn, langCodeListInInfoATUpdate, statusOnText, translate]);

  const autoTranslationContent = useMemo(() => {
    if (langCodeListInATUpdate.includes(languageCode)) {
      return <CircularProgress size={12} />;
    }
    if (autoTranslationSwitchedOn) {
      return <span className={statusOnText}>{translate('Label.SwitchedOn')}</span>;
    }
    return translate('Label.SwitchedOff');
  }, [languageCode, autoTranslationSwitchedOn, langCodeListInATUpdate, statusOnText, translate]);

  if (!isAutoTranslationAvailable) {
    return (
      <Typography variant='footer' className={statusText}>
        {translate('Label.AutoTranslation')}&nbsp;{translate('Label.NotAvailable')}
      </Typography>
    );
  }

  return (
    <Grid container direction='column' className={statusText}>
      <Grid item>
        <Typography variant='footer' className={descriptionText}>
          {translate('Label.AutoTranslation')}
        </Typography>
      </Grid>
      <Grid item>
        <Typography variant='footer' color='secondary' className={descriptionText}>
          {translate('Label.AutoTranslationStringAndProduct')}:&nbsp;
          {autoTranslationContent}
        </Typography>
      </Grid>
      <Grid item>
        <Typography variant='footer' color='secondary' className={descriptionText}>
          {translate('Label.AutoTranslationInformation')}:&nbsp;
          {infoAutoTranslationContent}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default AutoTranslationStatus;
