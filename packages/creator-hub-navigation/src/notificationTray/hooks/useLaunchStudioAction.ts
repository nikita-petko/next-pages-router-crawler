import { useCallback } from 'react';
import type { NotificationButtonAction } from '@rbx/client-creator-notification-streams-api/v1';
import { EStudioTaskType } from '@rbx/studio';
import { useNavigationStudioLauncher } from '../../providers/NavigationStudioLauncherProvider';

// Backend action types that map onto Studio launch tasks.
const StudioActionType = {
  OpenStudioDefault: 'OpenStudioDefault',
  OpenStudioReturnFromLogin: 'OpenStudioReturnFromLogin',
  OpenStudioViewAsset: 'OpenStudioViewAsset',
  OpenStudioEditPlace: 'OpenStudioEditPlace',
} as const;

// Returns a callback that maps a notification action to a Studio launch and fires the injected
// launcher. Missing required params mean a malformed action, so we no-op (OpenStudioDefault is
// the dedicated "no place" action, so there's nothing to fall back to).
const useLaunchStudioAction = (): ((action: NotificationButtonAction) => void) => {
  const { openStudio } = useNavigationStudioLauncher();

  return useCallback(
    (action: NotificationButtonAction) => {
      const { actionType, parameters } = action;
      switch (actionType) {
        case StudioActionType.OpenStudioDefault:
          openStudio({ task: EStudioTaskType.Default });
          return;
        case StudioActionType.OpenStudioReturnFromLogin:
          openStudio({ task: EStudioTaskType.ReturnFromLogin });
          return;
        case StudioActionType.OpenStudioViewAsset: {
          const assetId = parameters?.assetId;
          if (!assetId) {
            console.error('OpenStudioViewAsset notification action missing assetId', action);
            return;
          }
          openStudio({ task: EStudioTaskType.ViewAsset, assetId });
          return;
        }
        case StudioActionType.OpenStudioEditPlace: {
          const placeId = parameters?.placeId;
          const universeId = parameters?.universeId;
          if (!placeId || !universeId) {
            console.error(
              'OpenStudioEditPlace notification action missing placeId/universeId',
              action,
            );
            return;
          }
          openStudio({ task: EStudioTaskType.EditPlace, placeId, universeId });
          return;
        }
        default:
          console.error('Unsupported notification action type', actionType);
      }
    },
    [openStudio],
  );
};

export default useLaunchStudioAction;
