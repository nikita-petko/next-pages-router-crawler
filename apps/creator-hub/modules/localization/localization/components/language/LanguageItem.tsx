import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  ListItem,
  ListItemSecondaryAction,
  Grid,
  CircularProgress,
  ListItemText,
  Typography,
} from '@rbx/ui';
import { LOCALIZATION_LOADER_SIZE } from '../../constants/LocalizationConstants';
import AutoTranslationStatus from './AutoTranslationStatus';
import LanguageItemMenu from './LanguageItemMenu';
import useSupportedLanguageListStyles from './SupportedLanguageList.styles';

export interface LanguageItemProps {
  isAddingLanguage?: boolean;
  isDeletingLanguage?: boolean;
  languageCode: string;
  languageName: string;
  defaultLocalizationTargetCode: string;
  isAutoTranslationAvailable: boolean;
  isAutoTranslationOn: boolean;
  isInfoAutoTranslationOn: boolean;
  isImageAutoTranslationAvailable: boolean;
  isImageAutoTranslationOn: boolean;
  translationProgress: number;
}

const LanguageItem: FunctionComponent<React.PropsWithChildren<LanguageItemProps>> = ({
  isAddingLanguage,
  isDeletingLanguage,
  languageCode,
  languageName,
  defaultLocalizationTargetCode,
  isAutoTranslationAvailable,
  isAutoTranslationOn,
  isInfoAutoTranslationOn,
  isImageAutoTranslationAvailable,
  isImageAutoTranslationOn,
  translationProgress,
}) => {
  const { translate } = useTranslation();
  const {
    classes: {
      languageListItem,
      autoTranslationStatus,
      wrapper,
      overlay,
      deletingOverlay,
      loader,
      languageListItemPlaceHolder,
    },

    cx,
  } = useSupportedLanguageListStyles();
  const router = useRouter();
  const handleClickLanguage = useCallback(() => {
    const { id } = router.query;
    router.push({
      pathname: `${router.pathname}/translation`,
      query: { id, activeTranslationKey: defaultLocalizationTargetCode },
    });
  }, [defaultLocalizationTargetCode, router]);
  const listItem = (
    <ListItem className={languageListItem} onClick={handleClickLanguage}>
      <ListItemText>
        <Typography align='left' color='primary' variant='largeLabel1'>
          {`${languageName}`}
        </Typography>
        <br />
        <Typography align='left' color='secondary' variant='caption'>
          {`${translationProgress}% ${translate('Label.Complete')}`}
        </Typography>
      </ListItemText>
      <div className={autoTranslationStatus}>
        <AutoTranslationStatus
          languageCode={languageCode}
          autoTranslationSwitchedOn={isAutoTranslationOn}
          isInfoAutoTranslationOn={isInfoAutoTranslationOn}
          isAutoTranslationAvailable={isAutoTranslationAvailable}
          isImageAutoTranslationAvailable={isImageAutoTranslationAvailable}
          isImageAutoTranslationOn={isImageAutoTranslationOn}
        />
      </div>
      <ListItemSecondaryAction>
        <LanguageItemMenu
          languageCode={languageCode}
          languageName={languageName}
          isAutoTranslationAvailable={isAutoTranslationAvailable}
          isAutoTranslationOn={isAutoTranslationOn}
          isInfoAutoTranslationOn={isInfoAutoTranslationOn}
          isImageAutoTranslationAvailable={isImageAutoTranslationAvailable}
          isImageAutoTranslationOn={isImageAutoTranslationOn}
        />
      </ListItemSecondaryAction>
    </ListItem>
  );
  let content;
  if (isAddingLanguage) {
    content = (
      <div className={wrapper}>
        <ListItem className={languageListItemPlaceHolder} />
        <div className={overlay}>
          <Grid className={loader}>
            <CircularProgress color='secondary' size={LOCALIZATION_LOADER_SIZE} />
          </Grid>
        </div>
      </div>
    );
  } else if (isDeletingLanguage) {
    content = (
      <div className={wrapper}>
        {listItem}
        <div className={cx(overlay, deletingOverlay)}>
          <Grid className={loader}>
            <CircularProgress color='secondary' size={LOCALIZATION_LOADER_SIZE} />
          </Grid>
        </div>
      </div>
    );
  } else {
    content = listItem;
  }
  return content;
};

export default LanguageItem;
