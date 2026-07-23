import { Locale } from '@rbx/intl';
import type { UnifiedLogger } from '@rbx/unified-logger';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import CreatorDashboardSource from '@modules/eventStream/enum/CreatorDashboardSource';

type TDocLanguageChangeAnalyticsEvent = {
  from?: string;
  to?: string;
};

const sendLanguageSettingAnalyticsEvent = (
  client: UnifiedLogger,
  { from, to }: TDocLanguageChangeAnalyticsEvent,
) => {
  client.logClickEvent({
    eventName: CreatorDashboardEventType.DocumentationLanguageChanged,
    parameters: {
      from: from || Locale.English,
      to: to || Locale.English,
      source: `${CreatorDashboardSource.DocumentationLanguageSetting}`,
    },
  });
};

export default sendLanguageSettingAnalyticsEvent;
