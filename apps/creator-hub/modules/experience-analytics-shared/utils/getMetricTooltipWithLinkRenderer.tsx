import React from 'react';
import { TranslationKeyAndTagsToFormattedReactNode } from '@modules/analytics-translations';
import { TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import { Link } from '@modules/miscellaneous/common';
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
