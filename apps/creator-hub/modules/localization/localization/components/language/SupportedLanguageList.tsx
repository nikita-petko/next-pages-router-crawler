import React, { FunctionComponent, useMemo } from 'react';
import { Grid, List, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import LanguageItem from './LanguageItem';
import { LanguageDetailedInfo } from '../../types/LanguageInfo';
import useSupportedLanguageListStyles from './SupportedLanguageList.styles';

export interface SupportedLanguagesListProps {
  languageInfoList: LanguageDetailedInfo[] | null;
  isAutoTranslationAllowed: boolean;
}

const SupportedLanguageList: FunctionComponent<
  React.PropsWithChildren<SupportedLanguagesListProps>
> = ({ languageInfoList, isAutoTranslationAllowed }) => {
  const { translate } = useTranslation();
  const {
    classes: { placeholder },
  } = useSupportedLanguageListStyles();

  const supportedLanguagesList = useMemo(() => {
    if (languageInfoList === null) {
      return null;
    }
    return languageInfoList.map((language) => (
      <LanguageItem
        key={language.languageCode}
        isAddingLanguage={language.isAdding}
        isDeletingLanguage={language.isDeleting}
        languageCode={language.languageCode}
        defaultLocalizationTargetCode={language.languageCode}
        languageName={language.languageName}
        isAutoTranslationAvailable={isAutoTranslationAllowed && language.isAutoTranslationAvailable}
        isAutoTranslationOn={language.isAutoTranslationOn}
        isInfoAutoTranslationOn={language.isInfoAutoTranslationOn}
        translationProgress={language.translationProgress}
      />
    ));
  }, [languageInfoList, isAutoTranslationAllowed]);

  if (supportedLanguagesList?.length === 0) {
    return (
      <Grid className={placeholder} justifyContent='center' container>
        <Typography variant='largeLabel2'>{translate('Label.PleaseAddLanguages')}</Typography>
      </Grid>
    );
  }
  return <List disablePadding>{supportedLanguagesList}</List>;
};

export default SupportedLanguageList;
