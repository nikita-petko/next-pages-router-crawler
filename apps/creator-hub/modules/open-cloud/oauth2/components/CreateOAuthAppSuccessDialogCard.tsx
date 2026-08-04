import { useEffect, useState } from 'react';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import {
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Link,
  Typography,
  Alert,
  AlertTitle,
  LaunchIcon,
} from '@rbx/ui';
import {
  oauthCreationSuccessPath,
  dialogImageHeight,
  dialogImageWidth,
} from '../constants/assetConstants';
import { confirmButtonInactiveTime } from '../constants/oAuthConstants';
import useCreateFormSuccessDialogStyles from './CreateOAuthAppSuccessDialogCard.styles';
import InlineCodeRowContent from './InlineCodeRowContent';

interface CreateFormSuccessDialogProps {
  onContinueEdits: () => void;
  loadOAuthApps: () => Promise<void>;
  onCancel: () => void;
  translate: (key: string, args?: { [key: string]: string }) => string;
  clientId: string;
  clientSecret: string;
}

const CreateOAuthFormSuccessDialogCard = ({
  onContinueEdits,
  loadOAuthApps,
  onCancel,
  clientId,
  clientSecret,
  translate,
}: CreateFormSuccessDialogProps) => {
  const {
    classes: {
      iconButton,
      dialogImage,
      firstDialogTextContent,
      dialogLinkContent,
      loadingButton,
      inlineContent,
      warningLabel,
    },
  } = useCreateFormSuccessDialogStyles();
  const [isDialogLoading, setIsDialogLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsDialogLoading(false);
    }, confirmButtonInactiveTime);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <DialogTitle>{translate('Title.AppCreationSuccessDialog')}</DialogTitle>
      <DialogContent dividers>
        <img
          className={dialogImage}
          src={oauthCreationSuccessPath}
          width={dialogImageWidth}
          height={dialogImageHeight}
          alt='celebrate'
        />

        <Typography component='p' className={firstDialogTextContent}>
          {translate('Description.SuccessDialogContent')}
        </Typography>

        <Grid container direction='column' alignItems='center' justifyContent='center'>
          <Grid className={inlineContent} item>
            <InlineCodeRowContent
              label={translate('Label.ClientId')}
              stringContent={clientId}
              copyMessage={translate('Label.Copied')}
              isCopyable
            />
          </Grid>
          <Grid className={inlineContent} item>
            <InlineCodeRowContent
              label={translate('Label.Secret')}
              stringContent={clientSecret}
              copyMessage={translate('Label.Copied')}
              isVisibilityToggleable
              isCopyable
              isContentInitiallyVisible={false}
            />
          </Grid>
          <Grid item classes={{ root: warningLabel }}>
            <Alert severity='warning' variant='standard'>
              <AlertTitle>{translate('Title.SaveSecret')}</AlertTitle>
              {translate('Description.SaveSecret')}
            </Alert>
          </Grid>
        </Grid>

        <div className={dialogLinkContent}>
          <Typography>
            <Link
              href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/cloud/open-cloud/oauth2-overview#roles-and-interaction-protocol`}
              target='_blank'
              underline='always'>
              {translate('Description.DialogLinkContent')}
              <LaunchIcon className={iconButton} />
            </Link>
          </Typography>
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          variant='outlined'
          aria-label={translate('Label.Cancel')}
          color='primary'
          onClick={async () => {
            onCancel();
            await loadOAuthApps();
          }}>
          {translate('Label.Cancel')}
        </Button>
        <Button disabled={isDialogLoading} variant='contained' onClick={onContinueEdits}>
          <div>{translate('Label.ContinueToEdit')}</div>
          {isDialogLoading && <CircularProgress className={loadingButton} />}
        </Button>
      </DialogActions>
    </div>
  );
};

export default CreateOAuthFormSuccessDialogCard;
