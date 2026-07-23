import type { ChangeEvent, FunctionComponent } from 'react';
import React, { useMemo, useState } from 'react';
import { useTranslation, useLocalization } from '@rbx/intl';
import {
  Grid,
  InputAdornment,
  Dialog,
  DialogTemplate,
  Autocomplete,
  ListItem,
  Typography,
  SearchIcon,
  ListItemText,
  AddCircleOutlineIcon,
  TextField,
  Button,
} from '@rbx/ui';
import type { TrackerClientRequest } from '@modules/eventStream/constants/eventConstants';
import { manageSupportedLanguageEventModel } from '@modules/eventStream/constants/eventConstants';
import CreatorDashboardContext from '@modules/eventStream/enum/CreatorDashboardContext';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import CreatorDashboardSource from '@modules/eventStream/enum/CreatorDashboardSource';
import CreatorDashboardUserResponse from '@modules/eventStream/enum/CreatorDashboardUserResponse';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import type { LanguageBriefInfo } from '../../types/LanguageInfo';
import useLanguageAdderStyles from './LanguageAdder.styles';

export interface LanguageAdderProps {
  sourceLanguageCode: string;
  allLanguageList: LanguageBriefInfo[];
  addedLanguageList: LanguageBriefInfo[];
  automaticTranslationSupportedLanguageList: LanguageBriefInfo[];
  isAutoTranslationAllowed: boolean;
  onAdd: (languageCode: string[]) => void;
  disableAdding: boolean;
}

const LanguageAdder: FunctionComponent<React.PropsWithChildren<LanguageAdderProps>> = (props) => {
  const { trackerClient } = useEventTrackerProvider();
  const {
    sourceLanguageCode,
    allLanguageList,
    addedLanguageList,
    automaticTranslationSupportedLanguageList,
    isAutoTranslationAllowed,
    onAdd,
    disableAdding,
  } = props;
  const [customizedOpen, setCustomizedOpen] = useState(false);
  const [languageSelected, setLanguageSelected] = useState<LanguageBriefInfo | null>(null);
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const {
    classes: { grid, successText, notSupportedText },
  } = useLanguageAdderStyles();
  const { gameDetails } = useCurrentGame();

  const gameId = useMemo(() => {
    return gameDetails?.id;
  }, [gameDetails]);

  const shownLanguageList = useMemo(() => {
    return allLanguageList
      ?.filter(
        (lan) =>
          !addedLanguageList?.find((lang) => lang.languageCode === lan.languageCode) &&
          lan.languageCode !== sourceLanguageCode,
      )
      .sort((a, b) => a.name.localeCompare(b.name, locale?.toString() ?? 'en'));
    /* eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE
(jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
responsible for triaging issue. */
  }, [allLanguageList, addedLanguageList, locale]);

  const isAutoTranslationSupportedLanguage = (language: LanguageBriefInfo | null) => {
    if (!language) {
      return false;
    }
    return !!(
      isAutoTranslationAllowed &&
      automaticTranslationSupportedLanguageList.some(
        (lan) => lan.languageCode === language.languageCode,
      )
    );
  };

  const handleCustomizedOpen = () => {
    const selectAddLanguageTrackerRequest: TrackerClientRequest = {
      eventType: CreatorDashboardEventType.SelectAddSupportedLanguage,
      context: CreatorDashboardContext.Click,
      additionalProperties: {
        Source: CreatorDashboardSource.LocalizationAddSupportedLanguage,
      },
    };
    trackerClient.sendEvent(selectAddLanguageTrackerRequest);
    setCustomizedOpen(true);
  };
  const handleCustomizedCancel = () => {
    if (languageSelected?.languageCode !== undefined && gameId !== undefined) {
      trackerClient.sendEvent(
        manageSupportedLanguageEventModel(
          [languageSelected?.languageCode],
          gameId,
          CreatorDashboardUserResponse.Cancel,
          true,
        ),
      );
    }
    setCustomizedOpen(false);
    setLanguageSelected(null);
  };
  const handleCustomizedConfirm = () => {
    if (languageSelected) {
      onAdd([languageSelected.languageCode]);
      setCustomizedOpen(false);
      setLanguageSelected(null);
    }
  };
  const onSelectLanguage = (selectedLanguage: LanguageBriefInfo | null) => {
    if (!selectedLanguage) {
      return;
    }
    setLanguageSelected(selectedLanguage);
  };
  return (
    <>
      <Grid className={grid} container wrap='nowrap'>
        <Grid item container alignItems='center'>
          <Typography variant='footer'>{translate('Title.SupportedLanguages')}</Typography>
        </Grid>
        <Grid item container alignItems='center' justifyContent='flex-end'>
          <Button
            aria-label='add language'
            color='primary'
            variant='text'
            disabled={disableAdding}
            onClick={handleCustomizedOpen}
            endIcon={<AddCircleOutlineIcon color='secondary' />}>
            <Typography variant='footer'>{translate('Label.AddLanguage')}</Typography>
          </Button>
        </Grid>
      </Grid>
      <Grid>
        <Dialog open={customizedOpen} fullWidth>
          <DialogTemplate
            title={translate('Label.AddLanguage')}
            cancelText={translate('Action.Cancel')}
            confirmText={translate('Action.Confirm')}
            onCancel={handleCustomizedCancel}
            onConfirm={handleCustomizedConfirm}
            content={
              <Autocomplete
                options={shownLanguageList}
                getOptionLabel={(option) => option.name}
                clearIcon={false}
                noOptionsText={translate('Label.NoOptions')}
                onChange={(event: ChangeEvent<unknown>, newValue: LanguageBriefInfo | null) => {
                  onSelectLanguage(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    id='language'
                    label=''
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position='start'>
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                renderOption={(optionProps, option: LanguageBriefInfo) => (
                  <ListItem {...optionProps}>
                    <Grid container direction='row' justifyContent='space-between'>
                      <Grid>
                        <ListItemText>
                          <Typography align='left' variant='smallLabel1' color='primary'>
                            {option.name}
                          </Typography>
                        </ListItemText>
                      </Grid>
                      <Grid>
                        <ListItemText>
                          <Typography
                            className={
                              isAutoTranslationSupportedLanguage(option)
                                ? successText
                                : notSupportedText
                            }
                            align='right'
                            variant='body2'>
                            {isAutoTranslationSupportedLanguage(option)
                              ? translate('Label.AutoTranslationSupported')
                              : translate('Label.AutoTranslationNotAvailable')}
                          </Typography>
                        </ListItemText>
                      </Grid>
                    </Grid>
                  </ListItem>
                )}
              />
            }
          />
        </Dialog>
      </Grid>
    </>
  );
};

export default LanguageAdder;
