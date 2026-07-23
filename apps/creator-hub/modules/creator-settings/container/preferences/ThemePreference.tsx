import React, { FunctionComponent, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Alert,
  CheckCircleIcon,
  List,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Typography,
} from '@rbx/ui';
import { useThemeMode } from '@rbx/settings';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import Flex from '@modules/miscellaneous/common/components/Flex';
import { ThemeOption, themeOptions } from '../../constants/themeConstants';
import useThemePreferenceContainerStyles from './ThemePreference.styles';

const ThemePreferenceContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { translate } = useTranslation();
  const { themeOption, updateThemeMode } = useThemeMode();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [openSnackbar, setOpenSnackbar] = useState<'error' | 'success' | null>(null);
  const {
    classes: { title, listButton, themeList, themeIcon, themeTitle, themeDescription },
  } = useThemePreferenceContainerStyles();

  const getClickThemeHandler = (newThemeOption: ThemeOption) => {
    return async () => {
      try {
        setIsLoading(true);
        const updated = await updateThemeMode(newThemeOption);
        if (updated) {
          setOpenSnackbar('success');
        } else {
          setOpenSnackbar('error');
        }
      } catch {
        setOpenSnackbar('error');
      } finally {
        setIsLoading(false);
      }
    };
  };

  return (
    <div>
      <Snackbar
        open={openSnackbar === 'error'}
        onClose={() => setOpenSnackbar(null)}
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'top',
        }}
        autoHide
        autoHideDuration={3000}>
        <Alert severity='error'>{translate('Description.SetPreferenceFailed')}</Alert>
      </Snackbar>
      <Snackbar
        open={openSnackbar === 'success'}
        onClose={() => setOpenSnackbar(null)}
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'bottom',
        }}
        message={translate('Description.SetPreferenceSuccessful')}
        autoHide
        autoHideDuration={3000}
      />
      <div className={title}>
        <Typography variant='h4'>{translate('Heading.Appearance')}</Typography>
      </div>
      <List classes={{ root: themeList }}>
        {themeOptions.map((option) => (
          <ListItemButton
            classes={{ root: listButton }}
            key={option.id}
            onClick={getClickThemeHandler(option.theme)}
            selected={themeOption === option.theme}
            disabled={isLoading}>
            <Flex flexDirection='column'>
              <Flex flexDirection='row' alignItems='center'>
                <ListItemIcon classes={{ root: themeIcon }}>{option.icon}</ListItemIcon>
                {themeOption === option.theme && (
                  <ListItemSecondaryAction>
                    <CheckCircleIcon color='primary' />
                  </ListItemSecondaryAction>
                )}
                <ListItemText
                  classes={{ root: themeTitle }}
                  primary={translate(option.nameTranslationKey)}
                />
              </Flex>
              {option.descriptionTranslationKey && (
                <ListItemText
                  classes={{ root: themeDescription }}
                  secondary={translate(option.descriptionTranslationKey)}
                />
              )}
            </Flex>
          </ListItemButton>
        ))}
      </List>
    </div>
  );
};

export default withTranslation(ThemePreferenceContainer, [TranslationNamespace.Preferences]);
