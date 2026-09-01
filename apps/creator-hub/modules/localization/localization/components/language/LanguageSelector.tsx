import type { FunctionComponent } from 'react';
import React, { useState } from 'react';
import { useLocalization, useTranslation } from '@rbx/intl';
import {
  Dialog,
  DialogTemplate,
  Select,
  MenuItem,
  Typography,
  Tooltip,
  Grid,
  IconButton,
  InfoOutlinedIcon,
} from '@rbx/ui';
import type { LanguageBriefInfo } from '../../types/LanguageInfo';
import useLanguageSelectorStyles from './LanguageSelector.styles';

export interface LocalizationLanguageSelectorProps {
  value: string;
  placeholder: string;
  allLanguageList: LanguageBriefInfo[];
  onSelect: (languageCode: string) => Promise<void>;
  errorText: string | null;
}

const LanguageSelector: FunctionComponent<
  React.PropsWithChildren<LocalizationLanguageSelectorProps>
> = ({ value, placeholder, allLanguageList, onSelect, errorText }) => {
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [targetLanguage, setTargetLanguage] = useState<LanguageBriefInfo | null>(null);
  const { locale } = useLocalization();
  const { translate } = useTranslation();
  const {
    classes: { grid, select, error },
  } = useLanguageSelectorStyles();

  const handleTargetLanguageSelected = (language: LanguageBriefInfo) => {
    if (language.languageCode !== value) {
      setOpenDialog(true);
      setTargetLanguage(language);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleConfirm = async () => {
    setOpenDialog(false);
    await onSelect(targetLanguage?.languageCode ?? '');
  };

  return (
    <>
      <Dialog maxWidth='Medium' open={openDialog}>
        <DialogTemplate
          cancelText={translate('Action.Cancel')}
          confirmText={translate('Action.Confirm')}
          onCancel={handleDialogClose}
          onConfirm={handleConfirm}
          title={translate('Title.ChangeSourceLanguage')}
          content={
            <Typography align='center'>
              {translate('Description.ConfirmSelectSourceLanguage', {
                language: targetLanguage?.name ?? '',
              })}
              &nbsp;
              {translate('Description.ChangeSourceLanguageEffect')}
            </Typography>
          }
        />
      </Dialog>
      <Grid className={grid} container alignItems='center'>
        <Typography variant='footer'>{translate('Label.SourceLanguage')}</Typography>
        <Tooltip
          color='secondary'
          arrow
          title={translate('Description.SourceLanguage')}
          placement='right'>
          <IconButton aria-label='info' size='large'>
            <InfoOutlinedIcon fontSize='small' />
          </IconButton>
        </Tooltip>
      </Grid>
      <Select className={select} value={value} helperText={placeholder}>
        {allLanguageList
          .sort((a, b) => a.name.localeCompare(b.name, locale?.toString() ?? 'en'))
          .map((language) => (
            <MenuItem
              key={language.languageCode}
              value={language.languageCode}
              onClick={() => handleTargetLanguageSelected(language)}>
              {language.name}
            </MenuItem>
          ))}
      </Select>
      {errorText && (
        <Typography className={error} variant='footer' color='error'>
          {errorText}
        </Typography>
      )}
    </>
  );
};

export default LanguageSelector;
