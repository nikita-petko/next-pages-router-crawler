import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import type { TButtonProps } from '@rbx/ui';
import { Button, Tooltip } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ExperimentOperationStatus } from '../../api/universeExperimentationClientEnums';
import useCanConfigureOrPublish from '../../hooks/useCanConfigureOrPublish';
import useExperimentActionsWithOperationStatusObserver from '../hooks/useExperimentActionWithOperationStatusObserver';
import StopExperimentDialog from './StopExperimentDialog';

type StopExperimentButtonProps = {
  buttonLabel: FormattedText;
  buttonColor: TButtonProps['color'];
  buttonVariant: TButtonProps['variant'];
  experimentId: string;
};

const StopExperimentButton = ({
  buttonLabel,
  buttonColor,
  buttonVariant,
  experimentId,
}: StopExperimentButtonProps) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { canPublish, publishErrorMessage } = useCanConfigureOrPublish();
  const { getExperimentOperationStatus } = useExperimentActionsWithOperationStatusObserver();
  const isCompleting = useMemo(() => {
    const status = getExperimentOperationStatus(experimentId);
    return (
      status === ExperimentOperationStatus.Stopping ||
      status === ExperimentOperationStatus.RampingUp ||
      status === ExperimentOperationStatus.RollingOut
    );
  }, [experimentId, getExperimentOperationStatus]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const openDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);
  const closeDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const label = useMemo(() => {
    if (isCompleting) {
      return translate(
        translationKey(
          'Label.StopExperimentButton.IsStopping',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      );
    }
    return buttonLabel;
  }, [buttonLabel, isCompleting, translate]);

  return (
    <>
      <Tooltip title={canPublish ? undefined : publishErrorMessage}>
        <span>
          <Button
            onClick={openDialog}
            color={buttonColor}
            variant={buttonVariant}
            loading={isCompleting}
            disabled={!canPublish}>
            {label}
          </Button>
        </span>
      </Tooltip>
      <StopExperimentDialog
        experimentId={experimentId}
        open={dialogOpen}
        onClose={closeDialog}
        onCancel={closeDialog}
        onConfirmed={closeDialog}
      />
    </>
  );
};

export default StopExperimentButton;
