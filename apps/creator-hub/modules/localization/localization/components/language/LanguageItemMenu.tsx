import React, { FunctionComponent, useMemo, useRef, useState } from 'react';
import {
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  Typography,
  ListItemText,
  DialogTemplate,
  MoreHorizIcon,
  ListItemButton,
} from '@rbx/ui';
import CreatorDashboardContext from '@modules/eventStream/enum/CreatorDashboardContext';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import CreatorDashboardSource from '@modules/eventStream/enum/CreatorDashboardSource';
import CreatorDashboardUserResponse from '@modules/eventStream/enum/CreatorDashboardUserResponse';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import type { TrackerClientRequest } from '@modules/eventStream/constants/eventConstants';
import {
  manageSupportedLanguageEventModel,
  switchOffAutomaticTranslationEventModel,
  switchOnAutomaticTranslationEventModel,
} from '@modules/eventStream/constants/eventConstants';
import { useTranslation } from '@rbx/intl';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import useLanguageManagement from '../../hooks/useLanguageManagement';

export interface LanguageItemMenuProps {
  languageCode: string;
  languageName: string;
  isAutoTranslationAvailable: boolean;
  isAutoTranslationOn: boolean;
  isInfoAutoTranslationOn: boolean;
}

const LanguageItemMenu: FunctionComponent<React.PropsWithChildren<LanguageItemMenuProps>> = ({
  languageCode,
  languageName,
  isAutoTranslationAvailable,
  isAutoTranslationOn,
  isInfoAutoTranslationOn,
}) => {
  const { trackerClient } = useEventTrackerProvider();
  const anchorButtonRef = useRef<HTMLButtonElement>(null);
  const { translate } = useTranslation();
  const autoTranslationSwitchText = isAutoTranslationOn
    ? translate('Label.TurnAutoTranslationOff')
    : translate('Label.TurnAutoTranslationOn');

  const infoAutoTranslationSwitchText = isInfoAutoTranslationOn
    ? translate('Label.TurnAutoTranslationOff')
    : translate('Label.TurnAutoTranslationOn');
  const {
    handleSwitchAutoTranslation,
    handleDeleteLanguage,
    handleSwitchInformationAutoTranslation,
  } = useLanguageManagement();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isAutoTranslationDeleteDialogOpen, setIsAutoTranslationDeleteDialogOpen] =
    useState<boolean>(false);
  const [isAutoTranslationInfoDeleteDialogOpen, setIsAutoTranslationInfoDeleteDialogOpen] =
    useState<boolean>(false);
  const { gameDetails } = useCurrentGame();

  const gameId = useMemo(() => {
    return gameDetails?.id;
  }, [gameDetails]);

  const handleClickMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const handleCloseMenu = () => {
    setIsMenuOpen(false);
  };
  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };
  const handleCloseDialog = () => {
    if (gameId !== undefined) {
      trackerClient.sendEvent(
        manageSupportedLanguageEventModel(
          [languageCode],
          gameId,
          CreatorDashboardUserResponse.Cancel,
          false,
        ),
      );
    }
    setIsDialogOpen(false);
    handleCloseMenu();
  };
  const handleClickDelete = () => {
    handleDeleteLanguage(languageCode);
    handleCloseMenu();
  };
  const handleAutoTranslationSwitchOn = () => {
    handleSwitchAutoTranslation(languageCode, true);
    trackerClient.sendEvent(
      switchOnAutomaticTranslationEventModel(
        CreatorDashboardSource.LocalizationAutoTranslationStrings,
        gameId,
        languageCode,
      ),
    );
    handleCloseMenu();
  };
  const handleAutoTranslationSwitchOff = () => {
    handleSwitchAutoTranslation(languageCode, false);
    setIsAutoTranslationDeleteDialogOpen(false);
    trackerClient.sendEvent(
      switchOffAutomaticTranslationEventModel(
        CreatorDashboardSource.LocalizationAutoTranslationStrings,
        gameId,
        languageCode,
        CreatorDashboardUserResponse.TurnOff,
      ),
    );
    handleCloseMenu();
  };
  const handleAutoTranslationInfoSwitchOn = () => {
    handleSwitchInformationAutoTranslation(languageCode, true);
    trackerClient.sendEvent(
      switchOnAutomaticTranslationEventModel(
        CreatorDashboardSource.LocalizationAutoTranslationInfo,
        gameId,
        languageCode,
      ),
    );
    handleCloseMenu();
  };
  const handleAutoTranslationInfoSwitchOff = () => {
    handleSwitchInformationAutoTranslation(languageCode, false);
    setIsAutoTranslationInfoDeleteDialogOpen(false);
    trackerClient.sendEvent(
      switchOffAutomaticTranslationEventModel(
        CreatorDashboardSource.LocalizationAutoTranslationInfo,
        gameId,
        languageCode,
        CreatorDashboardUserResponse.TurnOff,
      ),
    );
    handleCloseMenu();
  };
  const handleAutoTranslationDeleteOpenDialog = () => {
    setIsAutoTranslationDeleteDialogOpen(true);
    const openATSwitchOffDialogTrackerClientRequest: TrackerClientRequest = {
      eventType: CreatorDashboardEventType.OpenSwitchOffAutomaticTranslationConfirmDialogue,
      context: CreatorDashboardContext.Click,
      additionalProperties: {
        Source: CreatorDashboardSource.LocalizationAutoTranslationStrings,
        UniverseId: gameId ?? 'undefined',
        LanguageCode: languageCode,
      },
    };
    trackerClient.sendEvent(openATSwitchOffDialogTrackerClientRequest);
  };
  const handleAutoTranslationDeleteCloseDialog = () => {
    setIsAutoTranslationDeleteDialogOpen(false);
    trackerClient.sendEvent(
      switchOffAutomaticTranslationEventModel(
        CreatorDashboardSource.LocalizationAutoTranslationStrings,
        gameId,
        languageCode,
        CreatorDashboardUserResponse.Cancel,
      ),
    );
    handleCloseMenu();
  };
  const handleAutoTranslationInfoDeleteOpenDialog = () => {
    setIsAutoTranslationInfoDeleteDialogOpen(true);
  };
  const handleAutoTranslationInfoDeleteCloseDialog = () => {
    setIsAutoTranslationInfoDeleteDialogOpen(false);
    trackerClient.sendEvent(
      switchOffAutomaticTranslationEventModel(
        CreatorDashboardSource.LocalizationAutoTranslationInfo,
        gameId,
        languageCode,
        CreatorDashboardUserResponse.Cancel,
      ),
    );
    handleCloseMenu();
  };
  const autoTranslationSwitchOffDescription = (
    <Typography variant='largeLabel2' align='left'>
      {translate('Description.AutomaticTranslationOff')}
      <br />
      <br />
      {translate('Description.AutomaticTranslationOffDevRel')}
      <br />
      <br />
      {translate('Description.AutomaticTranslationOffConfirmation')}
    </Typography>
  );

  return (
    <React.Fragment>
      {' '}
      <IconButton aria-label='more' onClick={handleClickMenu} ref={anchorButtonRef} size='large'>
        <MoreHorizIcon color='secondary' />
      </IconButton>
      <Menu
        anchorEl={anchorButtonRef.current}
        open={isMenuOpen}
        onClose={handleCloseMenu}
        disablePortal={false}>
        {isAutoTranslationAvailable && (
          <ListItemButton
            onClick={
              isAutoTranslationOn
                ? handleAutoTranslationDeleteOpenDialog
                : handleAutoTranslationSwitchOn
            }>
            <ListItemText>
              <Typography variant='captionHeader' display='block'>
                {autoTranslationSwitchText}
              </Typography>
              <Typography variant='captionBody'>
                {translate('Label.AutoTranslationStringAndProduct')}
              </Typography>
            </ListItemText>
          </ListItemButton>
        )}
        <Dialog maxWidth='Medium' open={isAutoTranslationDeleteDialogOpen}>
          <DialogTemplate
            color='destructive'
            cancelText={translate('Action.CloseATDeleteDialog')}
            confirmText={translate('Action.TurnOff')}
            onCancel={handleAutoTranslationDeleteCloseDialog}
            onConfirm={handleAutoTranslationSwitchOff}
            title={translate('Label.AutomaticTranslationOff') + languageName}
            content={autoTranslationSwitchOffDescription}
          />
        </Dialog>

        {isAutoTranslationAvailable && (
          <ListItemButton
            onClick={
              isInfoAutoTranslationOn
                ? handleAutoTranslationInfoDeleteOpenDialog
                : handleAutoTranslationInfoSwitchOn
            }>
            <ListItemText>
              <Typography variant='captionHeader' display='block'>
                {infoAutoTranslationSwitchText}
              </Typography>
              <Typography variant='captionBody'>
                {translate('Label.AutoTranslationInformation')}
              </Typography>
            </ListItemText>
          </ListItemButton>
        )}
        <Dialog maxWidth='Medium' open={isAutoTranslationInfoDeleteDialogOpen}>
          <DialogTemplate
            color='destructive'
            cancelText={translate('Action.CloseATDeleteDialog')}
            confirmText={translate('Action.TurnOff')}
            onCancel={handleAutoTranslationInfoDeleteCloseDialog}
            onConfirm={handleAutoTranslationInfoSwitchOff}
            title={translate('Label.AutomaticTranslationOff') + languageName}
            content={autoTranslationSwitchOffDescription}
          />
        </Dialog>
        {isAutoTranslationAvailable && <Divider />}
        <MenuItem onClick={handleOpenDialog}>
          <Typography variant='captionHeader' display='block'>
            {translate('Action.Delete')}
          </Typography>
        </MenuItem>
        <Dialog maxWidth='Medium' open={isDialogOpen}>
          <DialogTemplate
            color='destructive'
            cancelText={translate('Action.Cancel')}
            confirmText={translate('Action.Delete')}
            onCancel={handleCloseDialog}
            onConfirm={handleClickDelete}
            title={translate('Label.DeleteLanguage')}
            content={
              <Typography align='center'>
                {translate('Description.DeleteLanguageWarning')}
              </Typography>
            }
          />
        </Dialog>
      </Menu>
    </React.Fragment>
  );
};

export default LanguageItemMenu;
