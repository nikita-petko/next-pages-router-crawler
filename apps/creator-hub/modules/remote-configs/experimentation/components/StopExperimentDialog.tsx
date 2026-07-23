import React, { useCallback, useMemo } from 'react';
import { useFlag } from '@rbx/flags';
import { isExperimentRolloutEnabled as isExperimentRolloutEnabledFlag } from '@generated/flags/creatorAnalytics';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { ExperimentProductType } from '../../api/universeExperimentationClientEnums';
import useExperiment from '../hooks/useExperiment';
import useExperimentActionsWithOperationStatusObserver from '../hooks/useExperimentActionWithOperationStatusObserver';
import ExperimentRampUpDialog from './ExperimentRampUpDialog';
import ExperimentRolloutDialog from './ExperimentRolloutDialog';

type StopExperimentDialogProps = {
  experimentId: string;
  open: boolean;
  onClose: () => void;
  onCancel: () => void;
  onBeforeConfirm?: () => void;
  onConfirmed?: () => void;
};

const StopExperimentDialog = ({
  experimentId,
  open,
  onClose,
  onCancel,
  onBeforeConfirm,
  onConfirmed,
}: StopExperimentDialogProps) => {
  const { completeExperiment, applyRollout } = useExperimentActionsWithOperationStatusObserver();
  const { id: universeId } = useUniverseResource();
  const { value: isExperimentRolloutEnabledValue, ready: isExperimentRolloutEnabledReady } =
    useFlag(isExperimentRolloutEnabledFlag, {
      universeId,
    });
  const isExperimentRolloutEnabled =
    isExperimentRolloutEnabledReady && isExperimentRolloutEnabledValue;
  const { experiment } = useExperiment({ experimentId });
  // Rollout preview only supports config experiments; other product types
  // (e.g. matchmaking) always use the legacy ramp-up flow.
  const useTargetedRolloutDialog =
    isExperimentRolloutEnabled && experiment?.experimentType === ExperimentProductType.Configs;

  const onLegacyConfirm = useCallback(
    ({ variantId }: { variantId: string; experimentId: string }) => {
      onBeforeConfirm?.();
      completeExperiment({ variantId, experimentId });
      onConfirmed?.();
    },
    [completeExperiment, experimentId, onBeforeConfirm, onConfirmed],
  );

  const onRolloutConfirm = useCallback(
    ({
      variantId,
      previewHash,
      overrides,
    }: {
      variantId: string;
      previewHash: string;
      overrides?: { conditionNames?: Record<string, string> };
    }) => {
      onBeforeConfirm?.();
      applyRollout({ experimentId, variantId, previewHash, overrides });
      onConfirmed?.();
    },
    [applyRollout, experimentId, onBeforeConfirm, onConfirmed],
  );

  return useMemo(() => {
    if (!open) {
      return null;
    }

    if (useTargetedRolloutDialog) {
      return (
        <ExperimentRolloutDialog
          experimentId={experimentId}
          open={open}
          onClose={onClose}
          onCancel={onCancel}
          onConfirm={onRolloutConfirm}
        />
      );
    }

    return (
      <ExperimentRampUpDialog
        experimentId={experimentId}
        open={open}
        onClose={onClose}
        onCancel={onCancel}
        onConfirm={onLegacyConfirm}
      />
    );
  }, [
    experimentId,
    useTargetedRolloutDialog,
    onCancel,
    onClose,
    onLegacyConfirm,
    onRolloutConfirm,
    open,
  ]);
};

export default StopExperimentDialog;
