import type { FC } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { formatNumberWithSpec } from '@modules/charts-generic/charts/numberFormatters';
import useLocale from '@modules/charts-generic/context/useLocale';
import getAnalyticsMetricDisplayConfig from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import { Link } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ExperimentMetricToRAQIV2Metric } from '../../api/makeValidatedExperimentationAPI';
import type { ConfidenceIntervalTableProps } from './ConfidenceIntervalTable';
import ConfidenceIntervalTable from './ConfidenceIntervalTable';

type ConfidenceIntervalDialogProps = ConfidenceIntervalTableProps & {
  open: boolean;
  onClose: () => void;
  isEarlyHarmAnalysisPeriod: boolean;
  statSigThreshold: number;
};

const ConfidenceIntervalDialog: FC<ConfidenceIntervalDialogProps> = ({
  open,
  onClose,
  metric,
  statSigThreshold,
  orderedCellDataWithConfidenceInterval,
  isEarlyHarmAnalysisPeriod,
}) => {
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const locale = useLocale();
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
          {isEarlyHarmAnalysisPeriod
            ? translateHTML(
                translationKey(
                  'Description.ConfidenceIntervalDialog.EarlyHarm',
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
                {
                  harmThreshold: formatNumberWithSpec(
                    statSigThreshold,
                    {
                      abbreviate: false,
                      numberFormatOptions: {
                        style: 'percent',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      },
                    },
                    { locale, translate },
                  ),
                },
              )
            : translateHTML(
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
          statSigThreshold={statSigThreshold}
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
