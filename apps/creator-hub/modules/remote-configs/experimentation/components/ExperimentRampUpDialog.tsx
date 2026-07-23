import React, { useState, useCallback, useMemo } from 'react';
import { addDays } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import {
  DialogActions,
  Button,
  DialogTitle,
  DialogContent,
  DialogContentText,
  Dialog,
  Alert,
  AlertTitle,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  makeStyles,
  Link,
} from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useLocale from '@modules/charts-generic/context/useLocale';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { formatDate } from '@modules/miscellaneous/utils/dateUtils';
import { ExperimentState } from '../../api/universeExperimentationClientEnums';
import {
  isExperimentRunningAndDurationMet,
  isExperimentStatsSig,
  isExperimentStoppable,
} from '../../utils/experimentProperties';
import useExperiment from '../hooks/useExperiment';
import useExperimentVariantsResults from '../hooks/useExperimentVariantsResults';

type ExperimentRampUpDialogProps = {
  experimentId: string;
  open: boolean;
  onClose: () => void;
  onCancel: () => void;
  onConfirm: ({ variantId, experimentId }: { variantId: string; experimentId: string }) => void;
  hideAlert?: boolean;
  titleLabel?: FormattedText;
  description?: FormattedText;
  confirmLabel?: FormattedText;
};

const useStyles = makeStyles()(() => ({
  alertContainer: {
    margin: '8px 0 16px',
  },
  formControl: {
    marginTop: '16px',
  },
  radioGroup: {
    marginLeft: '4px',
  },
}));

const ExperimentRampUpDialog = ({
  experimentId,
  open,
  onClose,
  onCancel,
  onConfirm,
  hideAlert = false,
  titleLabel: givenTitleLabel,
  description: givenDescription,
  confirmLabel: givenConfirmLabel,
}: ExperimentRampUpDialogProps) => {
  const locale = useLocale();
  const { translate } = useTranslationWrapper(useTranslation());
  const {
    classes: { alertContainer, formControl, radioGroup },
  } = useStyles();

  const { experiment } = useExperiment({ experimentId });
  const firstVariantId = useMemo(() => {
    if (!experiment) {
      return null;
    }
    return experiment.variants[0].variantId;
  }, [experiment]);

  const { experimentVariantsResults } = useExperimentVariantsResults(experimentId);

  const titleLabel = useMemo(() => {
    return (
      givenTitleLabel ??
      translate(
        translationKey(
          'Title.ExperimentRampUpDialog.StopExperimentAndFinalize',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      )
    );
  }, [givenTitleLabel, translate]);

  const description = useMemo(() => {
    return (
      givenDescription ??
      translate(
        translationKey(
          'Description.ExperimentRampUpDialog.SelectVariant',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      )
    );
  }, [givenDescription, translate]);

  const alert: null | {
    title: FormattedText;
    description: FormattedText;
  } = useMemo(() => {
    if (hideAlert) {
      return null;
    }
    if (!experiment || !isExperimentStoppable(experiment.state)) {
      return null;
    }

    const isDurationMet = isExperimentRunningAndDurationMet(experiment);

    if (!isDurationMet) {
      return {
        title: translate(
          translationKey(
            'Title.ExperimentRampUpDialog.DurationNotMet',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        ),
        description: translate(
          translationKey(
            'Description.ExperimentRampUpDialog.DurationNotMet',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          {
            date:
              experiment.state === ExperimentState.Running
                ? formatDate(addDays(experiment.startedTime, experiment.durationDays), locale)
                : '',
          },
        ),
      };
    }

    return isExperimentStatsSig({
      experiment,
      experimentVariantsResults,
    })
      ? null
      : {
          title: translate(
            translationKey(
              'Title.ExperimentRampUpDialog.Significant',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
          description: translate(
            translationKey(
              'Description.ExperimentRampUpDialog.Significant',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
        };
  }, [experiment, experimentVariantsResults, hideAlert, locale, translate]);

  const [selectedVariantId, setSelectedVariantId] = useState(firstVariantId);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedVariantId(event.target.value);
  }, []);
  const onRampUp = useCallback(() => {
    if (selectedVariantId) {
      onConfirm({ variantId: selectedVariantId, experimentId });
    } else if (firstVariantId) {
      onConfirm({ variantId: firstVariantId, experimentId });
    }
  }, [experimentId, firstVariantId, onConfirm, selectedVariantId]);

  const confirmLabel = useMemo(() => {
    return (
      givenConfirmLabel ??
      translate(
        translationKey(
          'Label.ExperimentRampUpDialog.StopAndRamp',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      )
    );
  }, [givenConfirmLabel, translate]);

  const alertAction = useMemo(() => {
    return (
      <Link href={creatorHub.docs.getExperimentationBestPracticesUrl()} target='_blank'>
        <Button variant='contained' color='secondary'>
          {translate(
            translationKey(
              'Label.LearnMore',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </Button>
      </Link>
    );
  }, [translate]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle id='experiment-ramp-up-dialog' data-testid='experiment-ramp-up-dialog-title'>
        {titleLabel}
      </DialogTitle>
      <DialogContent>
        {alert && (
          <Alert
            variant='standard'
            severity='warning'
            classes={{ root: alertContainer }}
            action={alertAction}>
            <AlertTitle data-testid='alert-title'>{alert.title}</AlertTitle>
            {alert.description && (
              <Typography
                component='div'
                marginTop='6px'
                variant='smallLabel1'
                data-testid='alert-description'>
                {alert.description}
              </Typography>
            )}
          </Alert>
        )}
        <DialogContentText
          id='dialog-content-text-describe-id'
          data-testid='dialog-content-text-describe-id'>
          {description}
        </DialogContentText>
        <FormControl classes={{ root: formControl }}>
          <FormLabel>
            <Typography variant='largeLabel1' color='secondary'>
              {translate(
                translationKey(
                  'Label.ExperimentRampUpDialog.Variants',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
            </Typography>
          </FormLabel>
          <RadioGroup
            value={selectedVariantId}
            onChange={handleChange}
            classes={{ root: radioGroup }}>
            {experiment?.variants.map((variant) => (
              <FormControlLabel
                key={variant.variantId}
                value={variant.variantId}
                control={<Radio aria-label={variant.label} />}
                label={variant.label}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button
          data-testid='cancel-button'
          size='large'
          variant='outlined'
          aria-label='Cancel'
          color='secondary'
          onClick={onCancel}>
          {translate(
            translationKey(
              'Label.ExperimentRampUpDialog.Cancel',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </Button>
        <Button
          data-testid='stop-and-ramp-button'
          size='large'
          variant='contained'
          aria-label='Stop and ramp'
          color='primaryBrand'
          onClick={onRampUp}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExperimentRampUpDialog;
