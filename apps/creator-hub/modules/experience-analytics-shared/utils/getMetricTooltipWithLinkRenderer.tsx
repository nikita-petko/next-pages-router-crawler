import type { TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import type { TranslationKeyAndTagsToFormattedReactNode } from '@modules/analytics-translations/types';
import { Link } from '@modules/miscellaneous/components';
import getAnalyticsMetricDisplayConfig from '../constants/AnalyticsMetricDisplayConfig';

const getMetricTooltipWithLinkRenderer = (metric: TRAQIV2UIMetric, link?: string) => {
  return (translateHTML: TranslationKeyAndTagsToFormattedReactNode) => {
    const { localizedDescription } = getAnalyticsMetricDisplayConfig(metric);
    return localizedDescription
      ? translateHTML(localizedDescription, [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content(chunks) {
              return link ? <Link href={link}>{chunks}</Link> : chunks;
            },
          },
        ])
      : null;
  };
};

export default getMetricTooltipWithLinkRenderer;
