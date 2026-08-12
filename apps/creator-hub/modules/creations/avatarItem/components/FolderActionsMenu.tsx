import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, IconButton, Menu, MenuItem, SettingsIcon, Typography } from '@rbx/ui';
import AddItemToFolderDialog from './AddItemToFolderDialog';
import DeleteFolderDialog from './DeleteFolderDialog';
import RenameFolderDialog from './RenameFolderDialog';

type ActiveDialog = 'rename' | 'add' | 'delete' | null;

export interface FolderActionsMenuProps {
  selectedFolderId: string;
  selectedFolderName: string;
  onFolderUpdated: (folderId: string) => void;
  onFolderContentsUpdated: () => void;
  onFolderDeleted: () => void;
}

const FolderActionsMenu: FunctionComponent<FolderActionsMenuProps> = ({
  selectedFolderId,
  selectedFolderName,
  onFolderUpdated,
  onFolderContentsUpdated,
  onFolderDeleted,
}) => {
  const { translate } = useTranslation();
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

  const openMenu = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(e.currentTarget);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  const closeDialog = useCallback(() => {
    setActiveDialog(null);
  }, []);

  // Selecting an action closes the menu and opens the matching folder-level dialog. The dialogs live
  // outside the Menu so they survive it closing.
  const openRenameDialog = useCallback(() => {
    setActiveDialog('rename');
    setMenuAnchorEl(null);
  }, []);

  const openAddItemDialog = useCallback(() => {
    setActiveDialog('add');
    setMenuAnchorEl(null);
  }, []);

  const openDeleteDialog = useCallback(() => {
    setActiveDialog('delete');
    setMenuAnchorEl(null);
  }, []);

  return (
    <Grid item>
      <IconButton
        aria-label={translate('Label.FolderActions')}
        color='inherit'
        size='large'
        onClick={openMenu}>
        <SettingsIcon fontSize='large' />
      </IconButton>
      <Menu
        open={Boolean(menuAnchorEl)}
        anchorEl={menuAnchorEl}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <MenuItem onClick={openRenameDialog} disableRipple>
          <Typography>{translate('Action.RenameFolder')}</Typography>
        </MenuItem>
        <MenuItem onClick={openAddItemDialog} disableRipple>
          <Typography>{translate('Action.AddItemToFolder')}</Typography>
        </MenuItem>
        <MenuItem onClick={openDeleteDialog} disableRipple>
          <Typography color='error'>{translate('Action.DeleteFolder')}</Typography>
        </MenuItem>
      </Menu>
      {activeDialog === 'rename' && (
        <RenameFolderDialog
          selectedFolderId={selectedFolderId}
          selectedFolderName={selectedFolderName}
          onClose={closeDialog}
          onFolderUpdated={onFolderUpdated}
          onFolderContentsUpdated={onFolderContentsUpdated}
        />
      )}
      {activeDialog === 'add' && (
        <AddItemToFolderDialog
          selectedFolderId={selectedFolderId}
          onClose={closeDialog}
          onFolderContentsUpdated={onFolderContentsUpdated}
        />
      )}
      {activeDialog === 'delete' && (
        <DeleteFolderDialog
          selectedFolderId={selectedFolderId}
          onClose={closeDialog}
          onFolderDeleted={onFolderDeleted}
        />
      )}
    </Grid>
  );
};

export default FolderActionsMenu;
