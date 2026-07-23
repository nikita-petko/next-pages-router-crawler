import { TTheme } from '@rbx/ui';
import {
  benchmarkInsightsDarkImage,
  benchmarkInsightsLightImage,
  economyFunnelEventsDarkImage,
  economyFunnelEventsLightImage,
  eventsUpsellDarkImage,
  eventsUpsellLightImage,
  thumbnailPersonalizationDarkImage,
  thumbnailPersonalizationLightImage,
} from './assetConstants';

const BannerImageMap: Record<string, Record<TTheme['palette']['mode'], string>> = {
  benchmarkInsights: {
    dark: benchmarkInsightsDarkImage,
    light: benchmarkInsightsLightImage,
  },
  economyFunnelEvents: {
    dark: economyFunnelEventsDarkImage,
    light: economyFunnelEventsLightImage,
  },
  eventsUpsell: {
    dark: eventsUpsellDarkImage,
    light: eventsUpsellLightImage,
  },
  thumbnailPersonalization: {
    dark: thumbnailPersonalizationDarkImage,
    light: thumbnailPersonalizationLightImage,
  },
};

export default BannerImageMap;
