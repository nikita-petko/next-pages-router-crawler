import React, { FC } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@rbx/ui';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getAnalyticsMetricDisplayConfig } from '@modules/experience-analytics-shared';
import { Link } from '@modules/miscellaneous/common';
import { ExperimentMetricToRAQIV2Metric } from '../../api/makeValidatedExperimentationAPI';
import ConfidenceIntervalTable, { ConfidenceIntervalTableProps } from './ConfidenceIntervalTable';

type ConfidenceIntervalDialogProps = ConfidenceIntervalTableProps & {
  open: boolean;
  onClose: () => void;
};

const ConfidenceIntervalDialog: FC<ConfidenceIntervalDialogProps> = ({
  open,
  onClose,
  metric,
  orderedCellDataWithConfidenceInterval,
}) => {
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  return (
    <Dialog open={open} onClose={onClose} maxWidth='Large'>
      <DialogTitle>
        {translate(
          translationKey(
            'Title.ConfidenceIntervalDialog',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          {
            metric: translate(
              getAnalyticsMetricDisplayConfig(ExperimentMetricToRAQIV2Metric[metric]).localizedName,
            ),
          },
        )}
      </DialogTitle>
      <DialogContent>
        <DialogContentText color='secondary' variant='caption'>
          {translateHTML(
            translationKey(
              'Description.ConfidenceIntervalDialog',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
            [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content: (chunks) => (
                  <Link href='/docs/production/experiments' target='_blank'>
                    {chunks}
                  </Link>
                ),
              },
            ],
          )}
        </DialogContentText>
        <Typography variant='h6' marginTop='24px' marginBottom='16px' component='div'>
          {translate(
            translationKey(
              'Table.Title.ConfidenceInterval',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </Typography>
        <ConfidenceIntervalTable
          metric={metric}
          orderedCellDataWithConfidenceInterval={orderedCellDataWithConfidenceInterval}
        />
      </DialogContent>
      <DialogActions>
        <Button color='primaryBrand' variant='contained' onClick={onClose}>
          {translate(
            translationKey('Action.Close', TranslationNamespace.UniverseConfigAndExperimentation),
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfidenceIntervalDialog;
