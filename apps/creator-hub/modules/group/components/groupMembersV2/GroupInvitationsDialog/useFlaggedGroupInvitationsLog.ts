import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { useSettings } from '@modules/settings';
import { useCallback } from 'react';
import { OrganizationsEventName, logOrganizationsEvent } from '../../../utils/eventUtils';

export default function useFlaggedGroupInvitationsLog() {
  const { settings, isFetched: isSettingsFetched } = useSettings();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const flaggedLog = useCallback(
    (eventName: OrganizationsEventName, params?: Record<string, string>) => {
      if (isSettingsFetched && settings.enableGroupInvitationsTelemetry) {
        logOrganizationsEvent(unifiedLogger, eventName, params);
      }
    },
    [isSettingsFetched, settings.enableGroupInvitationsTelemetry, unifiedLogger],
  );

  return flaggedLog;
}
