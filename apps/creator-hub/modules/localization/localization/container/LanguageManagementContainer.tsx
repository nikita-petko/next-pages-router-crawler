import type { FunctionComponent } from 'react';
import React, { Fragment, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/components';
import LanguageAdder from '../components/language/LanguageAdder';
import LanguageSelector from '../components/language/LanguageSelector';
import SupportedLanguagesList from '../components/language/SupportedLanguageList';
import useLanguageManagement from '../hooks/useLanguageManagement';
import useLanguageManagementContainerStyles from './LanguageManagementContainer.styles';

export interface LanguageManagementContainerProps {
  isAutoTranslationAllowed: boolean;
}

const LanguageManagementContainer: FunctionComponent<
  React.PropsWithChildren<LanguageManagementContainerProps>
> = ({ isAutoTranslationAllowed }) => {
  const {
    allLanguagesBriefInfoList,
    supportedLanguagesBriefInfoList,
    eligibleLanguagesBriefInfoList,
    supportedLanguagesDetailedInfoList,
    sourceLanguageCode,
    handleAddLanguage,
    handleChangeSourceLanguage,
    isLoadingSourceLanguage,
    fetchSourceLanguageError,
    isLoadingSupportedLanguages,
    fetchSupportedLanguagesError,
  } = useLanguageManagement();
  const {
    classes: { errorText },
  } = useLanguageManagementContainerStyles();
  const { translate } = useTranslation();
  const isLoadingLanguageList = useMemo(() => {
    return isLoadingSupportedLanguages || isLoadingSourceLanguage;
  }, [isLoadingSupportedLanguages, isLoadingSourceLanguage]);

  const shouldDisableAddingLanguage = useMemo(() => {
    return fetchSupportedLanguagesError !== null;
  }, [fetchSupportedLanguagesError]);

  const languageSelectorErrorText = useMemo(() => {
    if (fetchSourceLanguageError !== null) {
      return translate('Message.SourceLanguageError');
    }
    return null;
  }, [fetchSourceLanguageError, translate]);

  let languageListPlaceholder;
  if (isLoadingLanguageList) {
    languageListPlaceholder = <PageLoading />;
  } else if (fetchSupportedLanguagesError) {
    languageListPlaceholder = (
      <Grid className={errorText} justifyContent='center' container>
        <Typography variant='largeLabel2'>
          {translate('Message.SupportedLanguagesError')}
        </Typography>
      </Grid>
    );
  } else {
    languageListPlaceholder = (
      <SupportedLanguagesList
        languageInfoList={supportedLanguagesDetailedInfoList}
        isAutoTranslationAllowed={isAutoTranslationAllowed}
      />
    );
  }
  return (
    <>
      <LanguageSelector
        value={sourceLanguageCode ?? ''}
        placeholder={translate('Message.SelectSourceLanguage')}
        allLanguageList={allLanguagesBriefInfoList}
        onSelect={handleChangeSourceLanguage}
        errorText={languageSelectorErrorText}
      />
      <LanguageAdder
        sourceLanguageCode={sourceLanguageCode ?? ''}
        allLanguageList={allLanguagesBriefInfoList}
        addedLanguageList={supportedLanguagesBriefInfoList}
        automaticTranslationSupportedLanguageList={eligibleLanguagesBriefInfoList}
        isAutoTranslationAllowed={isAutoTranslationAllowed}
        onAdd={handleAddLanguage}
        disableAdding={shouldDisableAddingLanguage}
      />
      {languageListPlaceholder}
    </>
  );
};

export default LanguageManagementContainer;
