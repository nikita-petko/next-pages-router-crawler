import type { FC, ReactElement } from 'react';
import React, { Fragment, useMemo } from 'react';
import { subDays } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Button,
  makeStyles,
  Typography,
  Alert,
  LightbulbIcon,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type TimeSeriesChartExportButton from '@modules/charts-generic/charts/TimeSeriesChartExportButton';
import { ListItemTag } from '@modules/charts-generic/utils/translateHTMLTags';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const useStyles = makeStyles()(() => {
  return {
    alert: {
      marginTop: '14px',
    },
    dialogContent: {
      paddingBottom: 0,
    },
    buttonContainer: {
      justifyContent: 'space-between',
    },
    confirmButton: {
      marginLeft: '8px',
    },
    actionButtons: {
      marginLeft: 'auto',
    },
    tipsList: {
      paddingLeft: '16px',
      margin: '8px 0',
    },
  };
});

type WillStartNewTestDialogProps = {
  lastDataResetDateUTC: Date | null;
  exportButton: ReactElement<typeof TimeSeriesChartExportButton> | null;
  onPrimaryButtonClick: () => void;
  onSecondaryButtonClick: () => void;
};

const WillStartNewTestDialog: FC<WillStartNewTestDialogProps> = ({
  lastDataResetDateUTC,
  exportButton,
  onPrimaryButtonClick,
  onSecondaryButtonClick,
}) => {
  const {
    classes: { alert, dialogContent, buttonContainer, confirmButton, actionButtons, tipsList },
  } = useStyles();
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());

  const { title, content } = useMemo(() => {
    const today = new Date(new Date().toISOString());
    const sevenDaysAgo = subDays(today, 7);
    const wasResetMoreThanSevenDaysAgo =
      lastDataResetDateUTC && lastDataResetDateUTC < sevenDaysAgo;

    return {
      title: wasResetMoreThanSevenDaysAgo
        ? translate(
            translationKey('Title.ConfirmTestNewThumbnails', TranslationNamespace.PlaceThumbnails),
          )
        : translate(
            translationKey(
              'Title.ConfirmTestNewThumbnailsWithinAWeek',
              TranslationNamespace.PlaceThumbnails,
            ),
          ),
      content: wasResetMoreThanSevenDaysAgo
        ? translate(
            translationKey(
              'Description.ConfirmTestNewThumbnailsDynamicPrior',
              TranslationNamespace.PlaceThumbnails,
            ),
          )
        : translate(
            translationKey(
              'Description.ConfirmTestNewThumbnailsWithinAWeek',
              TranslationNamespace.PlaceThumbnails,
            ),
          ),
    };
  }, [lastDataResetDateUTC, translate]);

  const tips = useMemo(() => {
    return (
      <>
        {translate(
          translationKey(
            'Title.ConfirmTestNewThumbnailsTips',
            TranslationNamespace.PlaceThumbnails,
          ),
        )}
        <ol className={tipsList}>
          {translateHTML(
            translationKey(
              'Description.ConfirmTestNewThumbnailsTipsDynamicPrior',
              TranslationNamespace.PlaceThumbnails,
            ),
            [ListItemTag],
          )}
        </ol>
      </>
    );
  }, [tipsList, translate, translateHTML]);

  return (
    <>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent classes={{ root: dialogContent }}>
        <div className={dialogContent}>
          <Typography variant='body1' color='primary'>
            {content}
          </Typography>
          <Alert className={alert} variant='standard' severity='info' icon={<LightbulbIcon />}>
            {tips}
          </Alert>
        </div>
      </DialogContent>
      <DialogActions classes={{ root: buttonContainer }}>
        {exportButton}
        <Grid item classes={{ root: actionButtons }}>
          <Button
            variant='outlined'
            color='secondary'
            size='large'
            onClick={onSecondaryButtonClick}>
            {translate(translationKey('Action.Cancel', TranslationNamespace.Controls))}
          </Button>
          <Button
            variant='contained'
            color='primaryBrand'
            size='large'
            onClick={onPrimaryButtonClick}
            classes={{ root: confirmButton }}>
            {translate(translationKey('Action.ConfirmTest', TranslationNamespace.PlaceThumbnails))}
          </Button>
        </Grid>
      </DialogActions>
    </>
  );
};

export default withTranslation(WillStartNewTestDialog, [
  TranslationNamespace.Controls,
  TranslationNamespace.PlaceThumbnails,
]);
