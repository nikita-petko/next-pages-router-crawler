import {
  FormattedText,
  translationKey,
  useTranslationWrapper,
} from '@modules/analytics-translations';
import { Button, TButtonProps, Tooltip } from '@rbx/ui';
import React, { useCallback, useMemo, useState } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation } from '@rbx/intl';
import useCanConfigureOrPublish from '../../hooks/useCanConfigureOrPublish';
import { ExperimentOperationStatus } from '../../api/universeExperimentationClientEnums';
import useExperimentActionsWithOperationStatusObserver from '../hooks/useExperimentActionWithOperationStatusObserver';
import ExperimentRampUpDialog from './ExperimentRampUpDialog';

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
  const { completeExperiment, getExperimentOperationStatus } =
    useExperimentActionsWithOperationStatusObserver();
  const isCompleting = useMemo(() => {
    const status = getExperimentOperationStatus(experimentId);
    return (
      status === ExperimentOperationStatus.Stopping ||
      status === ExperimentOperationStatus.RampingUp
    );
  }, [experimentId, getExperimentOperationStatus]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const openDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);
  const closeDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const onConfirm = useCallback(
    ({ variantId }: { variantId: string }) => {
      completeExperiment({ variantId, experimentId });
      setDialogOpen(false);
    },
    [completeExperiment, experimentId],
  );

  const stopDialog = useMemo(() => {
    return dialogOpen ? (
      <ExperimentRampUpDialog
        experimentId={experimentId}
        open={dialogOpen}
        onClose={closeDialog}
        onCancel={closeDialog}
        onConfirm={onConfirm}
      />
    ) : null;
  }, [closeDialog, dialogOpen, experimentId, onConfirm]);

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
    <React.Fragment>
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
      {stopDialog}
    </React.Fragment>
  );
};

export default StopExperimentButton;
