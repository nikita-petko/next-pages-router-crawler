import { useState, Fragment } from 'react';
import {
  Alert,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Paper,
  InfoOutlinedIcon,
  BlockIcon,
  ScheduleIcon,
  Grid,
} from '@rbx/ui';
import usePublishAppDialogCardStyles from './PublishAppDialogCard.styles';

interface PublishAppDialogCardProps {
  onCancel: () => void;
  translate: (key: string, args?: { [key: string]: string }) => string;
  publishApp: () => Promise<string | undefined>;
}

const PublishAppDialogCard = ({ onCancel, translate, publishApp }: PublishAppDialogCardProps) => {
  const {
    classes: { alertLabel, textBlock, disclaimerBlock, disclaimerText },
  } = usePublishAppDialogCardStyles();

  const [hasError, setHasError] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);

  const onAppPublish = async () => {
    setLoading(true);
    const error = await publishApp();
    if (error) {
      setHasError(translate(error));
    }
    setLoading(false);
  };

  return (
    <>
      <DialogTitle>{translate('Message.PublishAppHeading')}</DialogTitle>
      <DialogContent dividers>
        <DialogContentText id='dialog-content-text-describe-id'>
          {hasError && (
            <Alert className={alertLabel} severity='error'>
              {hasError}
            </Alert>
          )}
          <Typography
            className={disclaimerBlock}
            component='p'
            color='primary'
            variant='largeLabel1'>
            {translate('Message.PublishInformation')}
          </Typography>

          <Paper classes={{ root: textBlock }}>
            <Grid container alignItems='center' wrap='nowrap'>
              <Grid item>
                <InfoOutlinedIcon />
              </Grid>
              <Grid item classes={{ root: disclaimerText }}>
                <Typography color='primary' variant='largeLabel1' component='p'>
                  {translate('Heading.DailyLimit')}
                </Typography>
                <Typography color='secondary'>{translate('Message.DailyLimit')}</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Paper classes={{ root: textBlock }}>
            <Grid container alignItems='center' wrap='nowrap'>
              <Grid item>
                <BlockIcon />
              </Grid>
              <Grid item classes={{ root: disclaimerText }}>
                <Typography color='primary' variant='largeLabel1' component='p'>
                  {translate('Heading.EditsDisabled')}
                </Typography>
                <Typography color='secondary'>{translate('Message.EditsDisabled')}</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Paper classes={{ root: textBlock }}>
            <Grid container alignItems='center' wrap='nowrap'>
              <Grid item>
                <ScheduleIcon />
              </Grid>
              <Grid item classes={{ root: disclaimerText }}>
                <Typography color='primary' variant='largeLabel1' component='p'>
                  {translate('Heading.ReviewStatus')}
                </Typography>
                <Typography color='secondary'>{translate('Message.ReviewStatus')}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant='outlined' color='primary' onClick={onCancel}>
          {translate('Label.Cancel')}
        </Button>
        <Button variant='contained' color='primaryBrand' loading={loading} onClick={onAppPublish}>
          {translate('Label.SubmitAppForReview')}
        </Button>
      </DialogActions>
    </>
  );
};

export default PublishAppDialogCard;
