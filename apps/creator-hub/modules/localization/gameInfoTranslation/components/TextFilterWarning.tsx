import type { FunctionComponent } from 'react';
import React, { Fragment, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Divider, Grid, Typography } from '@rbx/ui';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import { textFilterSupportedLanguageCodes } from '../constants';
import useTextFilterWarningStyles from './TextFilterWarning.styles';

const TextFilterWarning: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const { currentLanguageOrLocaleCode } = useEntryManagementMetadata();
  const {
    classes: { divider, heading, text },
  } = useTextFilterWarningStyles();

  const isTextFilterSupportedLanguage = useMemo(() => {
    return textFilterSupportedLanguageCodes.has(currentLanguageOrLocaleCode ?? 'en');
  }, [currentLanguageOrLocaleCode]);

  return !isTextFilterSupportedLanguage ? (
    <>
      <Divider className={divider} />
      <Grid container direction='column'>
        <Typography variant='captionHeader' className={heading}>
          {translate('Label.Note')}
        </Typography>
        <Typography variant='body2' color='secondary' className={text}>
          {translate('Message.TextFilterNotSupportedWarning')}
        </Typography>
      </Grid>
    </>
  ) : null;
};

export default TextFilterWarning;
