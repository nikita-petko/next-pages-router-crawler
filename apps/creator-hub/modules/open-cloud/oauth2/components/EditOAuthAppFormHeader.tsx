import { useState, Fragment, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Grid,
  Typography,
  Button,
  IconButton,
  MoreVertIcon,
  Menu,
  MenuItem,
  CloseIcon,
  EditOutlinedIcon,
} from '@rbx/ui';
import type { AppVersionInfo } from '@modules/clients/applicationAuthorization';
import useEditOAuthAppFormHeaderStyles from './EditOAuthAppFormHeader.styles';

interface EditOAuthAppFormHeaderProps {
  initialName: string;
  onSaveAndClosePromptHandler: (redirectToTable: boolean) => void;
  openDeleteDialog: () => void;
  handleUpdate: () => void;
  handlePublish: () => void;
  onEditActiveHandler: (isEditActive: boolean) => void;
  isDirty: boolean;
  isValid: boolean;
  isEditActive?: boolean;
  versionInfo: AppVersionInfo;
  isBanned: boolean;
}

const EditOAuthAppFormHeader = ({
  initialName,
  onSaveAndClosePromptHandler,
  openDeleteDialog,
  handleUpdate,
  handlePublish,
  onEditActiveHandler,
  isDirty,
  isValid,
  isEditActive,
  versionInfo,
  isBanned,
}: EditOAuthAppFormHeaderProps) => {
  const {
    classes: { header, headerLeft, footerButton, appName },
  } = useEditOAuthAppFormHeaderStyles();
  const { translate } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // determines if a user shouldn't be able to edit the OAuth app
  const { editLocked, publishLocked } = useMemo(() => {
    return {
      editLocked: versionInfo.isInReview || isBanned,
      publishLocked:
        versionInfo.isInReview ||
        versionInfo.lastApprovedVersionNumber === versionInfo.versionNumber ||
        isBanned,
    };
  }, [versionInfo, isBanned]);

  const deleteAppMenu = (
    <>
      <IconButton
        aria-label='menu'
        color='secondary'
        disabled={editLocked}
        onClick={(event: { currentTarget: React.SetStateAction<HTMLElement | null> }) =>
          setAnchorEl(event.currentTarget)
        }
        size='large'>
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={openDeleteDialog}>
          <Typography color='error'>{translate('Label.OAuthDelete')}</Typography>
        </MenuItem>
      </Menu>
    </>
  );

  return (
    <Grid justifyContent='space-between' alignItems='center' className={header} container>
      <Grid className={headerLeft}>
        <IconButton
          aria-label='menu'
          color='secondary'
          onClick={() => onSaveAndClosePromptHandler(true)}
          size='large'>
          <CloseIcon />
        </IconButton>
        {isEditActive ? (
          <Typography variant='h1' className={appName}>
            {translate('Heading.OAuthEdit', {
              appName: initialName,
            })}
          </Typography>
        ) : (
          <Typography variant='h1' className={appName}>
            {initialName}
          </Typography>
        )}
      </Grid>
      {isEditActive ? (
        <Grid item>
          <Button
            onClick={() => onSaveAndClosePromptHandler(false)}
            className={footerButton}
            color='primary'>
            {translate('Label.Cancel')}
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={!isDirty || !isValid}
            className={footerButton}
            variant='contained'
            color='primaryBrand'>
            {translate('Label.SaveChanges')}
          </Button>
          {deleteAppMenu}
        </Grid>
      ) : (
        <Grid item>
          <Button
            onClick={() => onEditActiveHandler(true)}
            className={footerButton}
            disabled={editLocked}
            startIcon={<EditOutlinedIcon />}
            color='primary'>
            {translate('Label.OAuthEdit')}
          </Button>
          <Button
            onClick={handlePublish}
            className={footerButton}
            disabled={publishLocked}
            variant='contained'
            color='primaryBrand'>
            {translate('Label.ReviewAndPublish')}
          </Button>
          {deleteAppMenu}
        </Grid>
      )}
    </Grid>
  );
};

export default EditOAuthAppFormHeader;
