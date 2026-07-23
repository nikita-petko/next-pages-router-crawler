import React, { Fragment } from 'react';
import {
  Grid,
  Button,
  Typography,
  IconButton,
  LinearProgress,
  makeStyles,
  CloseIcon,
} from '@rbx/ui';
import type { StudioDialogTranslations } from '../types';

const useStyles = makeStyles()(() => ({
  closeIcon: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
  studioIcon: {
    width: 80,
  },
  dialogText: {
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
}));

interface TDialogProps {
  logoSrc: string;
  translations: StudioDialogTranslations;
}

interface TClosableDialogProps extends TDialogProps {
  onClose: () => void;
}

interface TDownloadDialogProps extends TClosableDialogProps {
  downloadUrl: string;
  onDownload: () => void;
}

const Loading = ({ logoSrc, translations }: TDialogProps) => {
  const {
    classes: { studioIcon, dialogText },
  } = useStyles();
  return (
    <Fragment>
      <Grid container data-testid='studio-dialog-loading' direction='column' alignItems='center'>
        <img width={64} className={studioIcon} src={logoSrc} alt='studio logo' />
        <Typography classes={{ root: dialogText }} variant='body1' color='secondary'>
          {translations['Message.CheckingStudio']}
        </Typography>
      </Grid>
      <LinearProgress title='progress bar' />
    </Fragment>
  );
};

const Error = ({ logoSrc, translations, onClose }: TClosableDialogProps) => {
  const {
    classes: { closeIcon, studioIcon, dialogText },
  } = useStyles();
  return (
    <Grid container data-testid='studio-dialog-error' direction='column' alignItems='center'>
      <IconButton
        className={closeIcon}
        color='secondary'
        aria-label='close'
        onClick={onClose}
        size='large'>
        <CloseIcon />
      </IconButton>
      <img width={64} className={studioIcon} src={logoSrc} alt='studio logo' />
      <Typography classes={{ root: dialogText }} variant='body1' color='secondary'>
        {translations['Message.OpenStudioError']}
      </Typography>
    </Grid>
  );
};

const Download = ({
  downloadUrl,
  logoSrc,
  translations,
  onClose,
  onDownload,
}: TDownloadDialogProps) => {
  const {
    classes: { closeIcon, studioIcon, dialogText },
  } = useStyles();
  return (
    <Grid container data-testid='studio-dialog-download' direction='column' alignItems='center'>
      <IconButton
        className={closeIcon}
        color='secondary'
        aria-label='close'
        onClick={onClose}
        size='large'>
        <CloseIcon />
      </IconButton>
      <img width={64} className={studioIcon} src={logoSrc} alt='studio logo' />
      <Typography classes={{ root: dialogText }} variant='body1' color='secondary'>
        {translations['Message.StartYourCreation']}
      </Typography>
      <Button
        data-testid='cancel-studio-dialog-button'
        variant='contained'
        onClick={() => {
          onDownload();
          window.open(downloadUrl, '_blank');
        }}
        aria-label={translations['Action.DownloadStudio']}>
        {translations['Action.DownloadStudio']}
      </Button>
    </Grid>
  );
};

export default {
  Loading,
  Error,
  Download,
};
