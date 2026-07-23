import React, { FunctionComponent, useCallback } from 'react';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  useTheme,
} from '@rbx/ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useShareLinkDialogStyles from './ShareLinkDialog.styles';

type TCreatedShareLinkDialogProps = {
  shareLink: string;
  close: VoidFunction;
  copyLink: (link: string) => void;
};

const CreatedShareLinkDialog: FunctionComponent<TCreatedShareLinkDialogProps> = ({
  shareLink,
  copyLink,
  close,
}) => {
  const { translate } = useTranslation();
  const theme = useTheme();

  const {
    classes: { shareLinkResult, dialogSpacing },
  } = useShareLinkDialogStyles();

  const copyShareLink = useCallback(() => {
    if (shareLink) {
      copyLink(shareLink);
    }
  }, [copyLink, shareLink]);

  return (
    <React.Fragment>
      <DialogTitle classes={{ root: dialogSpacing }}>
        {translate('Heading.ShareYourLinkV2')}
      </DialogTitle>
      <DialogContent>
        <Typography variant='body1' color='secondary'>
          {translate('Description.ShareYourLink')}
        </Typography>
        <TextField
          id='share-link'
          label=''
          value={shareLink}
          disabled
          fullWidth
          classes={{ root: shareLinkResult }}
          sx={{
            '& .MuiInputBase-input.Mui-disabled': {
              WebkitTextFillColor: theme.palette.content.standard,
            },
          }}
          InputProps={{
            endAdornment: (
              <Button color='secondary' variant='contained' size='small' onClick={copyShareLink}>
                {translate('Action.Copy')}
              </Button>
            ),
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button size='large' variant='contained' onClick={close}>
          {translate('Action.Done')}
        </Button>
      </DialogActions>
    </React.Fragment>
  );
};

export default withTranslation(CreatedShareLinkDialog, [TranslationNamespace.ShareLinksManagement]);
