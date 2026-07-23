/**
 * Dialog shown when edit-in-studio is blocked due to place moderation (sequestered).
 * Design: warning icon + title, close X, short body with Terms of Use link, OK button.
 * Size: maxWidth='Medium' for comfortable reading of body text.
 *
 * New strings to register in Translations Hub (CreatorDashboard.Creations):
 * | Key                             | English String                                                                                  |
 * |---------------------------------|-------------------------------------------------------------------------------------------------|
 * | Heading.ExperienceLocked        | This Experience is locked                                                                       |
 * | Description.ExperienceLockedTermsOfUse | We found content in this Experience that breaks the rules of our linkStartTerms of UselinkEnd. The owner needs to send an appeal to unlock this place. |
 * OK button uses CreatorDashboard.Controls Action.OK (existing).
 */
import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Link,
  Typography,
  WarningIcon,
  IconButton,
  CloseIcon,
  makeStyles,
} from '@rbx/ui';

const TERMS_OF_USE_URL = `https://www.${process.env.robloxSiteDomain}/info/terms`;

const useStyles = makeStyles()(() => ({
  closeIcon: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
  titleWrapper: {
    position: 'relative',
  },
}));

export interface ExperienceLockedDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Dialog shown when a user tries to edit an experience in Studio but the place
 * (or its universe root place) is sequestered. Shows warning, message with Terms of Use link, and OK.
 */
const ExperienceLockedDialog: FunctionComponent<ExperienceLockedDialogProps> = ({
  open,
  onClose,
}) => {
  const { translate, translateHTML } = useTranslation();
  const { classes } = useStyles();

  return (
    <Dialog open={open} onClose={onClose} maxWidth='Medium'>
      <DialogTitle className={classes.titleWrapper}>
        <IconButton
          className={classes.closeIcon}
          color='secondary'
          aria-label={translate('Action.Close' /* TranslationNamespace.Controls */)}
          onClick={onClose}
          size='large'>
          <CloseIcon />
        </IconButton>
        <Grid container alignItems='center' gap={2}>
          <WarningIcon color='warning' fontSize='large' />
          <Typography variant='h4'>
            {translate('Heading.ExperienceLocked' /* TranslationNamespace.Creations */)}
          </Typography>
        </Grid>
      </DialogTitle>
      <DialogContent>
        <Typography variant='body1' component='div'>
          {translateHTML(
            'Description.ExperienceLockedTermsOfUse' /* TranslationNamespace.Creations */,
            [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content(chunks: React.ReactNode) {
                  return (
                    <Link href={TERMS_OF_USE_URL} target='_blank' rel='noopener noreferrer'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ],
          )}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant='contained' color='primaryBrand' size='large' onClick={onClose}>
          {translate('Action.OK' /* TranslationNamespace.Controls */)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExperienceLockedDialog;
