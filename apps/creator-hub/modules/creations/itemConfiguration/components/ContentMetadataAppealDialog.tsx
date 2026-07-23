import React, { useCallback, useEffect, useState } from 'react';
import {
  Typography,
  Button,
  useSnackbar,
  Dialog,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
} from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { GetAppealStatusResponse } from '@modules/clients';
import useContentMetadataAppealDialogStyles from './ContentMetadataAppealDialog.styles';

interface ContentMetadataAppealDialogProps {
  showContentMetadataAppealDialog: boolean;
  setShowContentMetadataAppealDialog: (show: boolean) => void;
  itemId: string;
  isBodySuit: boolean;
  onFetchAppealStatus: (itemId: string) => Promise<GetAppealStatusResponse>;
  onSubmitAppeal: (itemId: string) => Promise<void>;
  onFetchCategory: (itemId: string) => Promise<void>;
}

function ContentMetadataAppealDialog(props: ContentMetadataAppealDialogProps) {
  const {
    showContentMetadataAppealDialog,
    setShowContentMetadataAppealDialog,
    itemId,
    isBodySuit,
    onFetchAppealStatus,
    onSubmitAppeal,
    onFetchCategory,
  } = props;
  const { translate } = useTranslation();
  const { enqueue } = useSnackbar();
  const { classes: styles } = useContentMetadataAppealDialogStyles();

  const [appealStatus, setAppealStatus] = useState<GetAppealStatusResponse | null>(null);
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

  const fetchAppealStatus = useCallback(async () => {
    if (!itemId) return;

    try {
      const response = await onFetchAppealStatus(itemId);
      setAppealStatus(response);
    } catch {
      enqueue(
        {
          message: <span data-testid='error-message'>{translate('Error.ReviewStatusError')}</span>,
          autoHide: true,
        },
        (reason) => reason === 'timeout',
      );
    }
  }, [itemId, onFetchAppealStatus, enqueue, translate]);

  const handleSubmitAppeal = useCallback(async () => {
    if (!itemId) return;

    setIsSubmittingAppeal(true);
    try {
      await onSubmitAppeal(itemId);

      // Close the main dialog first
      setShowContentMetadataAppealDialog(false);

      // Show success snackbar
      enqueue(
        {
          message: (
            <span data-testid='success-message'>
              {translate('Message.CategoryReviewSubmitted')}
            </span>
          ),
          autoHide: true,
        },
        (reason) => reason === 'timeout',
      );
    } catch {
      enqueue(
        {
          message: <span data-testid='error-message'>{translate('Error.CreateReviewError')}</span>,
          autoHide: true,
        },
        (reason) => reason === 'timeout',
      );
    } finally {
      setIsSubmittingAppeal(false);
    }
  }, [itemId, onSubmitAppeal, setShowContentMetadataAppealDialog, enqueue, translate]);

  const handleCloseAppealDialog = useCallback(() => {
    setShowContentMetadataAppealDialog(false);
  }, [setShowContentMetadataAppealDialog]);

  useEffect(() => {
    if (itemId) {
      fetchAppealStatus();
      onFetchCategory(itemId).catch(() => {});
    }
  }, [showContentMetadataAppealDialog, itemId, fetchAppealStatus, onFetchCategory]);

  const getAppealStatusDisplay = (status: number | undefined) => {
    switch (status) {
      case 1:
        return translate('Label.CategoryNotAppealed');
      case 2:
        return translate('Label.CategoryInReview');
      case 3:
        return translate('Label.CategoryReviewed');
      case 4:
        return translate('Label.CategoryAlreadyOverwritten');
      default:
        return 'Unknown';
    }
  };

  const getMainMessage = (status: number | undefined) => {
    switch (status) {
      case 2:
        return translate('Label.CategoryReviewRequested');
      case 3:
        return translate('Label.CategoryReviewFinished');
      case 4:
        return translate('Label.CategoryReviewAlreadyOverwritten');
      default:
        return translate('Label.RequestCategoryReview');
    }
  };

  return (
    <Dialog
      onClose={handleCloseAppealDialog}
      open={showContentMetadataAppealDialog}
      maxWidth={false}
      PaperProps={{ className: styles.dialogPaper }}>
      <DialogContent className={styles.dialogContent}>
        <div className={styles.contentContainer}>
          <div className={styles.titleContainer}>
            <Typography className={styles.title}>{translate('Heading.CategoryReview')}</Typography>
          </div>
          <div className={styles.subtitleContainer}>
            <Typography className={styles.subtitle}>
              {getMainMessage(appealStatus?.appealStatus)}
            </Typography>
          </div>
          <Divider className={styles.divider} />

          <Grid container direction='column' spacing={3}>
            <Grid item>
              <div className={styles.infoRow}>
                <Typography className={styles.infoLabel}>
                  {appealStatus?.appealStatus === 3 || appealStatus?.appealStatus === 4
                    ? translate('Label.ReviewedCategory')
                    : translate('Label.DetectedCategory')}
                </Typography>
                <Typography className={styles.infoValue}>
                  {isBodySuit
                    ? translate('Label.CategoryBodysuit')
                    : translate('Label.CategoryNotBodysuit')}
                </Typography>
              </div>
            </Grid>

            <Grid item>
              <div className={styles.infoRow}>
                <Typography className={styles.infoLabel}>
                  {translate('Label.CategoryReviewStatus')}
                </Typography>
                <Typography className={styles.infoValue}>
                  {getAppealStatusDisplay(appealStatus?.appealStatus)}
                </Typography>
              </div>
            </Grid>
          </Grid>
        </div>
      </DialogContent>

      <DialogActions>
        {appealStatus && appealStatus.appealStatus === 1 ? (
          <React.Fragment>
            <Button
              variant='contained'
              size='large'
              color='secondary'
              onClick={handleCloseAppealDialog}>
              {translate('Action.CancelCategoryReview')}
            </Button>
            <Button
              variant='contained'
              size='large'
              color='primaryBrand'
              onClick={handleSubmitAppeal}
              disabled={isSubmittingAppeal}>
              {isSubmittingAppeal
                ? translate('Label.CategoryReviewSubmitting')
                : translate('Action.SubmitCategoryReview')}
            </Button>
          </React.Fragment>
        ) : (
          <Button
            variant='contained'
            size='large'
            color='primaryBrand'
            onClick={handleCloseAppealDialog}>
            {translate('Action.CloseCategoryReview')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default withTranslation(ContentMetadataAppealDialog, [TranslationNamespace.ConfigureItem]);
