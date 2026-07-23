import React, { useState, useCallback, useRef, Fragment } from 'react';
import { IconButton, Menu, MenuItem, MoreVertIcon, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import ApplyConfigToPlaceDialog from '../ApplyConfigToPlaceDialog';
import DeleteConfigurationDialog from '../DeleteConfigurationDialog';

type ConfigTableOptionsProps = {
  configId?: string;
  onApplyToPlaces: (configId: string, placeIds: number[]) => void;
  onDeleteConfig: (configId: string) => void;
};

const ConfigTableOptions = ({
  configId,
  onApplyToPlaces,
  onDeleteConfig,
}: ConfigTableOptionsProps) => {
  const { translate } = useTranslation();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonOpen, setButtonOpen] = useState(false);
  const [applyConfigDialogOpen, setApplyConfigDialogOpen] = useState(false);
  const [deleteConfigDialogOpen, setDeleteConfigDialogOpen] = useState(false);

  const buttonClick = useCallback(() => {
    setButtonOpen((prev) => !prev);
  }, [setButtonOpen]);
  const closeMenu = useCallback(() => {
    setButtonOpen(false);
  }, [setButtonOpen]);

  const applyButtonClick = useCallback(() => {
    setApplyConfigDialogOpen(true);
    setButtonOpen(false);
  }, [setApplyConfigDialogOpen]);

  const deleteButtonClick = useCallback(() => {
    setDeleteConfigDialogOpen(true);
    setButtonOpen(false);
  }, [setDeleteConfigDialogOpen]);

  const handleConfirmDelete = useCallback(() => {
    if (configId) {
      onDeleteConfig(configId);
    }
  }, [configId, onDeleteConfig]);

  const handleApplyToPlaces = useCallback(
    (configurationId: string, placeIds: number[]) => {
      setApplyConfigDialogOpen(false);
      onApplyToPlaces(configurationId, placeIds);
    },
    [onApplyToPlaces],
  );

  return (
    <Fragment>
      <IconButton
        onClick={buttonClick}
        aria-label='more'
        ref={buttonRef}
        disableRipple
        size='small'
        color='secondary'>
        <MoreVertIcon />
      </IconButton>
      <Menu
        open={buttonOpen}
        anchorEl={buttonRef.current}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}>
        <MenuItem key='apply' onClick={applyButtonClick}>
          <Typography variant='smallLabel1'>{translate('Label.ApplyToPlaces')}</Typography>
        </MenuItem>
        <MenuItem key='delete' onClick={deleteButtonClick}>
          <Typography variant='smallLabel1'>{translate('Label.DeleteConfig')}</Typography>
        </MenuItem>
      </Menu>
      <ApplyConfigToPlaceDialog
        isOpen={applyConfigDialogOpen}
        onClose={() => setApplyConfigDialogOpen(false)}
        configId={configId}
        onApplyToPlaces={handleApplyToPlaces}
      />
      <DeleteConfigurationDialog
        configId={configId}
        isOpen={deleteConfigDialogOpen}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfigDialogOpen(false)}
      />
    </Fragment>
  );
};

export default ConfigTableOptions;
