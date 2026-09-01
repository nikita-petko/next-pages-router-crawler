import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography, Grid, CircularProgress, InfoOutlinedIcon, Tooltip } from '@rbx/ui';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import uselanguageManagement from '../../hooks/useLanguageManagement';
import useSupportedLanguageListStyles from './SupportedLanguageList.styles';

export interface AutoTranslationStatusProps {
  languageCode: string;
  autoTranslationSwitchedOn: boolean;
  isAutoTranslationAvailable: boolean;
  isInfoAutoTranslationOn: boolean;
  isImageAutoTranslationAvailable: boolean;
  isImageAutoTranslationOn: boolean;
}

const AutoTranslationStatus: FunctionComponent<
  React.PropsWithChildren<AutoTranslationStatusProps>
> = ({
  languageCode,
  autoTranslationSwitchedOn,
  isAutoTranslationAvailable,
  isInfoAutoTranslationOn,
  isImageAutoTranslationAvailable,
  isImageAutoTranslationOn,
}) => {
  const {
    classes: {
      statusText,
      statusOnText,
      statusOffText,
      descriptionText,
      notAvailableWithInfo,
      notAvailableInfoIcon,
      imageAutoTranslationTooltip,
      imageAutoTranslationTooltipText,
    },
  } = useSupportedLanguageListStyles();
  const { translate } = useTranslation();
  const { settings } = useSettings();
  const enableImageTranslationEnrollment = !!settings?.enableImageTranslationEnrollment;
  const { langCodeListInATUpdate, langCodeListInInfoATUpdate, langCodeListInImageATUpdate } =
    uselanguageManagement();

  const infoAutoTranslationContent = useMemo(() => {
    if (langCodeListInInfoATUpdate.includes(languageCode)) {
      return <CircularProgress size={12} />;
    }
    if (isInfoAutoTranslationOn) {
      return <span className={statusOnText}>{translate('Label.SwitchedOn')}</span>;
    }
    return <span className={statusOffText}>{translate('Label.SwitchedOff')}</span>;
  }, [
    languageCode,
    isInfoAutoTranslationOn,
    langCodeListInInfoATUpdate,
    statusOnText,
    statusOffText,
    translate,
  ]);

  const autoTranslationContent = useMemo(() => {
    if (langCodeListInATUpdate.includes(languageCode)) {
      return <CircularProgress size={12} />;
    }
    if (autoTranslationSwitchedOn) {
      return <span className={statusOnText}>{translate('Label.SwitchedOn')}</span>;
    }
    return <span className={statusOffText}>{translate('Label.SwitchedOff')}</span>;
  }, [
    languageCode,
    autoTranslationSwitchedOn,
    langCodeListInATUpdate,
    statusOnText,
    statusOffText,
    translate,
  ]);

  const imageAutoTranslationContent = useMemo(() => {
    if (langCodeListInImageATUpdate.includes(languageCode)) {
      return <CircularProgress size={12} />;
    }
    if (!isImageAutoTranslationAvailable) {
      return (
        <span className={notAvailableWithInfo}>
          {translate('Label.NotAvailable')}
          <Tooltip
            arrow
            classes={{ tooltip: imageAutoTranslationTooltip }}
            title={
              <Typography
                component='span'
                variant='body2'
                className={imageAutoTranslationTooltipText}>
                {translate('Description.ImageAutoTranslationNotAvailable')}
              </Typography>
            }
            placement='top'
            enterTouchDelay={0}
            leaveTouchDelay={3000}>
            <span className={notAvailableInfoIcon}>
              <InfoOutlinedIcon
                fontSize='small'
                aria-label={translate('Label.ImageAutoTranslationNotAvailable')}
              />
            </span>
          </Tooltip>
        </span>
      );
    }
    if (isImageAutoTranslationOn) {
      return <span className={statusOnText}>{translate('Label.SwitchedOn')}</span>;
    }
    return <span className={statusOffText}>{translate('Label.SwitchedOff')}</span>;
  }, [
    languageCode,
    isImageAutoTranslationOn,
    langCodeListInImageATUpdate,
    isImageAutoTranslationAvailable,
    notAvailableInfoIcon,
    notAvailableWithInfo,
    imageAutoTranslationTooltip,
    imageAutoTranslationTooltipText,
    statusOnText,
    statusOffText,
    translate,
  ]);

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
      {enableImageTranslationEnrollment && (
        <Grid item>
          <Typography variant='footer' color='secondary' className={descriptionText}>
            {translate('Label.AutoTranslationImage')}:&nbsp;
            {imageAutoTranslationContent}
          </Typography>
        </Grid>
      )}
    </Grid>
  );
};

export default AutoTranslationStatus;
