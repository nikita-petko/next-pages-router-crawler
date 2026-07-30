import type { ComponentProps, FC, PropsWithChildren } from 'react';
import { useFlag } from '@rbx/flags';
import { isAnalyticsAssistantChatEnabled as isAnalyticsAssistantChatEnabledFlag } from '@generated/flags/creatorAnalytics';
import { analyticsAgentNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import buildExperienceAnalyticsUrlWithParams from '@modules/charts-generic/utils/analyticsUrlBuilder';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import { useCurrentGame } from '@modules/providers/game/GameProvider';

/**
 * Wraps the shared CreatorHubLayout for experience (creations) pages and supplies the top-nav
 * nebula analytics-assistant-chat entrypoint. Gated by the same conditions as the (now removed)
 * left-nav entry: the `isAnalyticsAssistantChatEnabled` flag AND analytics-view permission for
 * the current universe. Must render inside GameProvider (useCurrentGame throws otherwise), which
 * is always the case for creations experience layouts.
 */
const ExperienceCreatorHubLayout: FC<PropsWithChildren<ComponentProps<typeof CreatorHubLayout>>> = (
  props,
) => {
  const { gameDetails } = useCurrentGame();
  const universeId = gameDetails?.id ?? 0;

  const { ready: isAssistantChatReady, value: isAssistantChatEnabledValue } = useFlag(
    isAnalyticsAssistantChatEnabledFlag,
  );
  const { userCanViewAnalyticsForUniverse } = useAnalyticsExperiencePermissions(universeId);

  const analyticsAssistantChatEnabled =
    isAssistantChatReady &&
    isAssistantChatEnabledValue &&
    userCanViewAnalyticsForUniverse &&
    universeId > 0;

  // Only pass the href/universe id when enabled — the shared layout treats a present href as the
  // signal to show the nebula entrypoint.
  return (
    <CreatorHubLayout
      {...props}
      analyticsAssistantChatHref={
        analyticsAssistantChatEnabled
          ? buildExperienceAnalyticsUrlWithParams(analyticsAgentNavigationItem, {}, universeId)
          : undefined
      }
      analyticsAssistantChatUniverseId={analyticsAssistantChatEnabled ? universeId : undefined}
    />
  );
};

export default ExperienceCreatorHubLayout;
