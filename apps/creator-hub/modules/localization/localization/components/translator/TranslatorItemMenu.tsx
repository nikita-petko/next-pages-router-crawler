import React, { Fragment, FunctionComponent, useRef, useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTemplate,
  Typography,
  MoreHorizIcon,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';

export interface TranslatorItemMenuProps {
  onDelete: () => void;
}

const TranslatorItemMenu: FunctionComponent<React.PropsWithChildren<TranslatorItemMenuProps>> = ({
  onDelete,
}) => {
  const anchorButtonRef = useRef<HTMLButtonElement>(null);
  const { translate } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const handleClickMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const handleCloseMenu = () => {
    setIsMenuOpen(false);
  };
  const handleOpenDialog = () => {
    handleCloseMenu();
    setIsDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    handleCloseMenu();
  };
  const handleClickDelete = () => {
    handleCloseDialog();
    onDelete();
  };
  return (
    <Fragment>
      <IconButton aria-label='more' onClick={handleClickMenu} ref={anchorButtonRef} size='large'>
        <MoreHorizIcon color='secondary' />
      </IconButton>
      <Menu
        anchorEl={anchorButtonRef.current}
        open={isMenuOpen}
        onClose={handleCloseMenu}
        disablePortal={false}>
        <MenuItem onClick={handleOpenDialog}>{translate('Action.Delete')}</MenuItem>
      </Menu>
      <Dialog open={isDialogOpen}>
        <DialogTemplate
          color='destructive'
          cancelText={translate('Action.Cancel')}
          confirmText={translate('Action.Delete')}
          onCancel={handleCloseDialog}
          onConfirm={handleClickDelete}
          title={translate('Label.DeleteTranslator')}
          content={
            <Typography align='center'>
              {translate('Description.DeleteTranslatorWarning')}
            </Typography>
          }
        />
      </Dialog>
    </Fragment>
  );
};

export default TranslatorItemMenu;
