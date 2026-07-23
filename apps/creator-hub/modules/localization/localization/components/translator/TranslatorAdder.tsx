import React, { Fragment, FunctionComponent, useRef, useState, useCallback, useMemo } from 'react';
import { Menu, MenuItem, Typography, Divider, AddCircleOutlineIcon, Button } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';

import { TranslatorType } from '@modules/clients';
import { selectInviteTranslatorsEventModel } from '@modules/eventStream/constants/eventConstants';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import useTranslatorAdderStyles from './TranslatorAdder.styles';
import TranslatorInviteOptions from '../../enums/TranslatorInviteOptions';
import { TranslatorAssigneeData } from '../../types/TranslatorInfo';
import useTranslatorManagement from '../../hooks/useTranslatorManagement';
import TranslatorSearchByUserIdDialog from './TranslatorSearchByUserIdDialog';
import TranslatorSearchByUsernameDialog from './TranslatorSearchByUsernameDialog';
import TranslatorSearchByGroupIdDialog from './TranslatorSearchByGroupIdDialog';

export interface TranslatorAdderProps {
  currentTranslators: TranslatorAssigneeData[] | null;
}

const TranslatorAdder: FunctionComponent<React.PropsWithChildren<TranslatorAdderProps>> = ({
  currentTranslators,
}) => {
  const { trackerClient } = useEventTrackerProvider();
  const inviteButtonRef = useRef<HTMLButtonElement>(null);
  const { translate } = useTranslation();
  const {
    classes: { inviteMenu, inviteMenuItem },
  } = useTranslatorAdderStyles();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const { isAddingTranslator } = useTranslatorManagement();
  const [selectedInviteOption, setSelectedInviteOption] = useState<TranslatorInviteOptions | null>(
    null,
  );

  const handleClickMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);
  const handleCloseMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);
  const handleOpenDialog = useCallback(
    (inviteOption: TranslatorInviteOptions) => {
      handleCloseMenu();
      setSelectedInviteOption(inviteOption);
      trackerClient.sendEvent(selectInviteTranslatorsEventModel);
    },
    [handleCloseMenu, trackerClient],
  );
  const handleCloseDialog = useCallback(() => {
    setSelectedInviteOption(null);
    handleCloseMenu();
  }, [handleCloseMenu]);
  const currentUserIds = useMemo(() => {
    return new Set(
      currentTranslators
        ? currentTranslators
            .filter((assignee) => assignee.type === TranslatorType.User)
            .map((data) => data.id)
        : [],
    );
  }, [currentTranslators]);
  const currentGroupIds = useMemo(() => {
    return new Set(
      currentTranslators
        ? currentTranslators
            .filter((assignee) => assignee.type !== TranslatorType.User)
            .map((data) => data.id)
        : [],
    );
  }, [currentTranslators]);
  return (
    <Fragment>
      <Button
        aria-label='invite-translators'
        variant='text'
        color='primary'
        size='small'
        disabled={isAddingTranslator}
        ref={inviteButtonRef}
        onClick={handleClickMenu}
        endIcon={<AddCircleOutlineIcon color='secondary' fontSize='medium' />}>
        <Typography color='secondary' variant='smallLabel1'>
          {translate('Action.InviteTranslator')}
        </Typography>
      </Button>
      <Menu
        className={inviteMenu}
        anchorEl={inviteButtonRef.current}
        open={isMenuOpen}
        onClose={handleCloseMenu}
        disablePortal={false}>
        <MenuItem
          className={inviteMenuItem}
          onClick={() => handleOpenDialog(TranslatorInviteOptions.ByUsername)}>
          {translate('Action.InviteByUsername')}
        </MenuItem>
        {process.env.buildTarget !== 'luobu' && (
          <Fragment>
            <Divider />
            <MenuItem
              className={inviteMenuItem}
              onClick={() => handleOpenDialog(TranslatorInviteOptions.ByUserId)}>
              {translate('Action.InviteByUserId')}
            </MenuItem>
            <Divider />
            <MenuItem
              className={inviteMenuItem}
              onClick={() => handleOpenDialog(TranslatorInviteOptions.ByGroupId)}>
              {translate('Action.InviteByGroupId')}
            </MenuItem>
          </Fragment>
        )}
      </Menu>
      <TranslatorSearchByUserIdDialog
        currentUserIds={currentUserIds}
        isDialogOpen={selectedInviteOption === TranslatorInviteOptions.ByUserId}
        onCloseDialog={handleCloseDialog}
      />
      <TranslatorSearchByUsernameDialog
        currentUserIds={currentUserIds}
        isDialogOpen={selectedInviteOption === TranslatorInviteOptions.ByUsername}
        onCloseDialog={handleCloseDialog}
      />
      <TranslatorSearchByGroupIdDialog
        currentGroupIds={currentGroupIds}
        isDialogOpen={selectedInviteOption === TranslatorInviteOptions.ByGroupId}
        onCloseDialog={handleCloseDialog}
      />
    </Fragment>
  );
};

export default TranslatorAdder;
