import { useState, useCallback } from 'react';
import { ValidConfigEntryDetail } from '../api/validTypes';

import { configEntryToDescription, configEntryToKey } from '../utils/configEntryAccessors';
import { RemoteConfigDialogState } from '../components/RemoteConfigDialog';
import { DeploymentStrategy } from '../api/universeConfigsClientEnums';

const useRemoteConfigsDialogState = (draftCount: number) => {
  const [dialogState, setDialogState] = useState<RemoteConfigDialogState>(null);
  const onStartCreateConfig = useCallback(() => setDialogState({ type: 'create' }), []);
  const onOpenPublishDialog = useCallback(
    (deploymentStrategy: DeploymentStrategy) => {
      setDialogState({ type: 'publish', draftCount, deploymentStrategy });
    },
    [draftCount],
  );
  const onEdit = useCallback(
    (entry: ValidConfigEntryDetail) => {
      const configKey = configEntryToKey(entry);
      const initialDescription = configEntryToDescription(entry);
      setDialogState({
        type: 'edit',
        configKey,
        priorOverride: entry.overrideEntry?.entry?.entryValue,
        initialDescription,
      });
    },
    [setDialogState],
  );

  return {
    dialogState,
    setDialogState,
    onStartCreateConfig,
    onOpenPublishDialog,
    onEdit,
  };
};
export default useRemoteConfigsDialogState;
