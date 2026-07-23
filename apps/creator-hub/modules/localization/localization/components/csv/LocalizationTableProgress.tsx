import { useTranslation } from '@rbx/intl';
import { Button, Dialog, DialogTemplate, Grid, LinearProgress, Typography } from '@rbx/ui';
import React, { FunctionComponent, ReactNode, useEffect, useState } from 'react';
import CsvProgressType from '../../enums/CsvProgressType';
import LocalizationTableUploaderStyles from './LocalizationTablesUploader.styles';

export interface LocalizationTableProgressProps {
  progress: number;
  progressType: CsvProgressType;
  progressTitle: string;
  errorDialogTitle: string;
  errorDialogContent: ReactNode;
  shouldShowErrors: boolean;
}

const LocalizationTableProgress: FunctionComponent<
  React.PropsWithChildren<LocalizationTableProgressProps>
> = ({
  progress,
  progressType,
  shouldShowErrors,
  progressTitle,
  errorDialogTitle,
  errorDialogContent,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { progressBar, descriptionText, errorButton },
  } = LocalizationTableUploaderStyles();
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    if (shouldShowErrors) {
      setIsErrorDialogOpen(true);
    }
  }, [shouldShowErrors]);

  const shouldShowRefreshPrompt =
    progressType === CsvProgressType.Deleting || progressType === CsvProgressType.Uploading;

  return (
    <Grid>
      <Grid container direction='column' className={progressBar}>
        {shouldShowErrors ? (
          <Grid className={errorButton}>
            <Button
              color='destructive'
              size='small'
              variant='text'
              onClick={() => setIsErrorDialogOpen(true)}>
              {`${translate('Label.ParsingError')}`}
            </Button>
          </Grid>
        ) : (
          <Typography variant='subtitle2' className={descriptionText}>
            <span>{`${progressTitle} - ${progress}%. ${
              progress < 100 ? translate('Description.TakeSeveralMinutes') : ''
            } `}</span>
            <span>{shouldShowRefreshPrompt ? `${translate('Description.RefreshPage')}` : ''}</span>
          </Typography>
        )}
        <LinearProgress
          title={progressTitle}
          value={progress}
          variant='determinate'
          color={shouldShowErrors ? 'secondary' : 'primary'}
        />
      </Grid>
      <Dialog maxWidth='Medium' open={isErrorDialogOpen}>
        <DialogTemplate
          color='primaryBrand'
          cancelText={translate('Label.Cancel')}
          confirmText={translate('Label.Okay')}
          onCancel={() => setIsErrorDialogOpen(false)}
          onConfirm={() => setIsErrorDialogOpen(false)}
          title={errorDialogTitle}
          content={errorDialogContent}
        />
      </Dialog>
    </Grid>
  );
};

export default LocalizationTableProgress;
