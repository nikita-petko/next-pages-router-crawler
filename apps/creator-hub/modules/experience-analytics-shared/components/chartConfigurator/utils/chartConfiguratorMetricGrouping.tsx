import React from 'react';
import { AnalyticsTranslationNamespace } from '@rbx/creator-hub-analytics-config';
import { Icon, MenuItem, MenuSeparator } from '@rbx/foundation-ui';
import type {
  FormattedText,
  TranslationKey,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations/types';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { TChartConfiguratorMetrics } from '../../../chartConfigurator/chartConfiguratorMetricsConfig';
import { codegenChartConfiguratorMetricToGroup } from '../../../chartConfigurator/codegenChartConfiguratorMetricGrouping';
import getAnalyticsMetricDisplayConfig from '../../../constants/AnalyticsMetricDisplayConfig';

export type MetricGroup = {
  groupKey: TranslationKey;
  groupLabel: FormattedText;
  metrics: Array<{ metric: TChartConfiguratorMetrics; label: FormattedText }>;
};

// We don't have a "group" enum from the codegen config, so we need to sort the groups by their TranslationKey's
const GROUP_SORT_ORDER: ReadonlyArray<TranslationKey> = [
  { key: 'Heading.CustomEvents', namespace: TranslationNamespace.Analytics },
  { key: 'Heading.Retention', namespace: TranslationNamespace.Analytics },
  { key: 'Heading.Engagement', namespace: TranslationNamespace.Analytics },
  { key: 'Heading.Monetization', namespace: TranslationNamespace.Analytics },
  { key: 'Heading.Acquisition', namespace: TranslationNamespace.Analytics },
  { key: 'Heading.Performance', namespace: TranslationNamespace.Analytics },
  { key: 'Heading.Economy', namespace: TranslationNamespace.Analytics },
  { key: 'Heading.StoreItems', namespace: AnalyticsTranslationNamespace.StoreAnalytics },
  { key: 'Heading.SpeechToText', namespace: TranslationNamespace.Analytics },
  { key: 'Heading.TextToSpeech', namespace: TranslationNamespace.Analytics },
  { key: 'Heading.Matchmaking', namespace: TranslationNamespace.Analytics },
  { key: 'Heading.DataStore', namespace: TranslationNamespace.Analytics },
  { key: 'Heading.MemoryStores', namespace: AnalyticsTranslationNamespace.CloudServices },
  { key: 'Heading.Safety', namespace: TranslationNamespace.Analytics },
  { key: 'Heading.Advertising', namespace: TranslationNamespace.Analytics },
];

export function getGroupSortIndex(key: string, namespace?: string): number {
  const idx = GROUP_SORT_ORDER.findIndex(
    (entry) =>
      entry.key === key && (namespace === undefined || String(entry.namespace) === namespace),
  );
  return idx === -1 ? GROUP_SORT_ORDER.length : idx;
}

/**
 * Groups metrics by category using TranslationKey as the map key (not translated string).
 */
export function groupMetricsByCategory(
  metrics: TChartConfiguratorMetrics[],
  translate: TranslationKeyToFormattedText,
): MetricGroup[] {
  const groupMap = new Map<string, MetricGroup>();
  metrics.forEach((metric) => {
    const groupKey = codegenChartConfiguratorMetricToGroup(metric);
    const mapKey = groupKey.key;
    let group = groupMap.get(mapKey);
    if (!group) {
      group = {
        groupKey,
        groupLabel: translate(groupKey),
        metrics: [],
      };
      groupMap.set(mapKey, group);
    }
    const { localizedName } = getAnalyticsMetricDisplayConfig(metric);
    const translatedLabel = localizedName ? translate(localizedName) : null;
    if (!translatedLabel) {
      return;
    }
    group.metrics.push({ metric, label: translatedLabel });
  });
  const groups = Array.from(groupMap.values()).filter((group) => group.metrics.length > 0);
  groups.forEach((group) => {
    group.metrics.sort((a, b) => a.label.localeCompare(b.label));
  });
  return groups.sort(
    (a, b) =>
      getGroupSortIndex(a.groupKey.key, a.groupKey.namespace) -
      getGroupSortIndex(b.groupKey.key, b.groupKey.namespace),
  );
}

/**
 * Builds grouped menu items for use inside a Menu. Each group is wrapped in a
 * div[role="group"] with padding-small (matching MenuSection layout). An
 * optional category label (text-caption-medium, content-default) precedes the
 * MenuItems when showCategoryLabels is true. MenuSeparator dividers appear
 * between groups when labels are shown.
 */
export function buildMetricGroupMenuItems(
  groups: MetricGroup[],
  selectedMetric: TChartConfiguratorMetrics | null,
  { showCategoryLabels = true }: { showCategoryLabels?: boolean } = {},
): React.ReactElement[] {
  const items: React.ReactElement[] = [];
  groups.forEach((group, idx) => {
    if (showCategoryLabels && idx > 0) {
      items.push(<MenuSeparator key={`sep-${group.groupKey.key}`} />);
    }
    const menuItems = group.metrics.map(({ metric, label }) => (
      <MenuItem
        key={metric}
        value={metric}
        title={label}
        trailing={
          selectedMetric === metric ? <Icon name='icon-filled-check' size='Medium' /> : undefined
        }
      />
    ));
    items.push(
      <div key={`section-${group.groupKey.key}`} className='padding-small'>
        {showCategoryLabels && (
          <div
            role='none'
            className='padding-x-medium padding-y-small text-caption-medium content-default'>
            {group.groupLabel}
          </div>
        )}
        {menuItems}
      </div>,
    );
  });
  return items;
}
