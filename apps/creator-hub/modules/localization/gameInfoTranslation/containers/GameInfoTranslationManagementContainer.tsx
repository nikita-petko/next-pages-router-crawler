import {
  Alert,
  AlertTitle,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
  WarningIcon,
} from '@rbx/ui';
import React, { Fragment, FunctionComponent, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import TranslationStatusIcon from '../../translation/components/TranslationStatusIcon';
import useTranslationLogic from '../../translation/hooks/useTranslationLogic';
import useGameInfoTranslationManagementContainerStyles from './GameInfoTranslationManagementContainer.styles';
import SaveGameInfoTranslation from '../components/SaveGameInfoTranslation';
import SaveGameInfoIcon from '../components/SaveGameInfoIcon';
import ThumbnailImageUploader from '../components/SaveGameInfoThumbnails';
import useIconTranslation from '../hooks/useIconTranslation';
import useThumbnailsTranslation from '../hooks/useThumbnailsTranslation';
import useNameAndDescriptionTranslation from '../hooks/useNameAndDescriptionTranslation';
import GameInfoField from '../enums/GameInfoField';
import TextFilterWarning from '../components/TextFilterWarning';

const GameInfoTranslationManagementContainer: FunctionComponent<
  React.PropsWithChildren<unknown>
> = () => {
  const {
    classes: { entrySide, translationSide, verticalDivider, listItem, errorText, errorTextGrid },
  } = useGameInfoTranslationManagementContainerStyles();
  const { translate } = useTranslation();
  const { defaultSourceLocaleCode, activeTranslationTarget } = useTranslationLogic();
  const [selectedField, setSelectedField] = useState<GameInfoField>(GameInfoField.Name);
  const {
    nameTranslation,
    nameTranslationStatus,
    descriptionTranslation,
    descriptionTranslationStatus,
    isNameAndDescriptionTranslationLoading,
    getNameAndDescriptionTranslation,
    fetchNameAndDescriptionError,
  } = useNameAndDescriptionTranslation();
  const {
    iconTranslation,
    isIconTranslationLoading,
    getIconTranslation,
    iconTranslationStatus,
    fetchIconError,
  } = useIconTranslation();
  const {
    thumbnailsTranslation,
    isThumbnailsTranslationLoading,
    getThumbnailsTranslation,
    thumbnailsTranslationStatus,
    fetchThumbnailsError,
  } = useThumbnailsTranslation();

  const handleSelectField = (field: GameInfoField) => {
    setSelectedField(field);
  };

  const isLocaleSupported = defaultSourceLocaleCode !== activeTranslationTarget?.translationKey;

  if (fetchNameAndDescriptionError || fetchIconError || fetchThumbnailsError) {
    return (
      <Grid className={errorTextGrid} container justifyContent='center' alignItems='center'>
        <WarningIcon />
        <Typography className={errorText} variant='alertTitle'>
          {translate('Message.FailedToFetchGameInfoData')}
        </Typography>
      </Grid>
    );
  }

  return (
    <Grid container wrap='nowrap'>
      <Grid className={entrySide}>
        {!isLocaleSupported && (
          <Alert severity='info' variant='standard' style={{ marginTop: 15, marginRight: 8 }}>
            <AlertTitle style={{ marginTop: 3 }}>
              {translate('Tooltip.LocaleNotSupported')}
            </AlertTitle>
          </Alert>
        )}
        <List>
          <ListItem className={listItem}>
            <ListItemText>
              <Typography variant='largeLabel1'>{translate('Label.Info')}</Typography>
            </ListItemText>
          </ListItem>
          <ListItemButton
            className={listItem}
            selected={selectedField === GameInfoField.Name}
            onClick={() => handleSelectField(GameInfoField.Name)}>
            <ListItemText>
              <Typography variant='largeLabel2'>{translate('Label.Name')}</Typography>
            </ListItemText>
            <ListItemSecondaryAction>
              <TranslationStatusIcon
                isLoading={typeof nameTranslation === 'undefined'}
                status={nameTranslationStatus}
              />
            </ListItemSecondaryAction>
          </ListItemButton>
          <ListItemButton
            className={listItem}
            selected={selectedField === GameInfoField.Description}
            onClick={() => handleSelectField(GameInfoField.Description)}>
            <ListItemText>
              <Typography variant='largeLabel2'>{translate('Label.Description')}</Typography>
            </ListItemText>
            <ListItemSecondaryAction>
              <TranslationStatusIcon
                isLoading={typeof descriptionTranslation === 'undefined'}
                status={descriptionTranslationStatus}
              />
            </ListItemSecondaryAction>
          </ListItemButton>
          <ListItemButton
            className={listItem}
            selected={selectedField === GameInfoField.Icon}
            onClick={() => handleSelectField(GameInfoField.Icon)}>
            <ListItemText>
              <Typography variant='largeLabel2'>{translate('Label.Icon')}</Typography>
            </ListItemText>
            <ListItemSecondaryAction>
              <TranslationStatusIcon
                isLoading={typeof iconTranslation === 'undefined'}
                status={iconTranslationStatus}
              />
            </ListItemSecondaryAction>
          </ListItemButton>
          <ListItemButton
            className={listItem}
            selected={selectedField === GameInfoField.Thumbnails}
            onClick={() => handleSelectField(GameInfoField.Thumbnails)}>
            <ListItemText>
              <Typography variant='largeLabel2'>{translate('Label.Thumbnails')}</Typography>
            </ListItemText>
            <ListItemSecondaryAction>
              <TranslationStatusIcon
                isLoading={typeof thumbnailsTranslation === 'undefined'}
                status={thumbnailsTranslationStatus}
              />
            </ListItemSecondaryAction>
          </ListItemButton>
        </List>
      </Grid>
      <Divider orientation='vertical' className={verticalDivider} />
      {isLocaleSupported && (
        <Grid className={translationSide}>
          {nameTranslation &&
            descriptionTranslation &&
            (selectedField === GameInfoField.Name ||
              selectedField === GameInfoField.Description) && (
              <Fragment>
                <SaveGameInfoTranslation
                  entryInfo={
                    selectedField === GameInfoField.Name ? nameTranslation : descriptionTranslation
                  }
                  isLoading={isNameAndDescriptionTranslationLoading}
                  onSaveSuccess={() => getNameAndDescriptionTranslation()}
                />
                <TextFilterWarning />
              </Fragment>
            )}
          {iconTranslation && selectedField === GameInfoField.Icon && (
            <SaveGameInfoIcon
              imageInfo={iconTranslation}
              isLoading={isIconTranslationLoading}
              onSaveSuccess={() => getIconTranslation()}
            />
          )}
          {thumbnailsTranslation && selectedField === GameInfoField.Thumbnails && (
            <ThumbnailImageUploader
              imageList={thumbnailsTranslation}
              isLoading={isThumbnailsTranslationLoading}
              onSaveSuccess={() => getThumbnailsTranslation()}
            />
          )}
        </Grid>
      )}
    </Grid>
  );
};

export default GameInfoTranslationManagementContainer;
