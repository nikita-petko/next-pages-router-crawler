import { TranslationKey, translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RAQIV2DimensionDisplayConfig } from '@rbx/creator-hub-analytics-config';
import { NonRAQIUIDimension } from '../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import type { TSupportedFilterBarDimensions } from './FilterDimensionConfig';

const defaultFilterGroup: TranslationKey = translationKey(
  'Label.Metric',
  TranslationNamespace.Analytics,
);

/**
 * Derives the filter group for a given dimension from the codegen config
 * (RAQIV2DimensionDisplayConfig[dimension].filterGroup) rather than
 * maintaining a hardcoded mapping in the frontend.
 *
 * NonRAQI dimensions (Version, Text) default to the Metric group.
 */
export const codegenFilterBarDimensionToGroup = (
  dimension: TSupportedFilterBarDimensions,
): TranslationKey => {
  if (dimension === NonRAQIUIDimension.Version || dimension === NonRAQIUIDimension.Text) {
    return defaultFilterGroup;
  }

  const config = RAQIV2DimensionDisplayConfig[dimension];
  if (config?.filterGroup) {
    const { key, namespace } = config.filterGroup;
    return { key, namespace };
  }

  return defaultFilterGroup;
};

/**
 * Groups the given dimensions by their codegen-derived filter group,
 * preserving insertion order. Equivalent to the old
 * groupDimensionsByCategoryInOrder but driven by codegen filterGroup
 * instead of a hardcoded FilterBarDimensionToGroup mapping.
 */
export const codegenGroupDimensionsByCategoryInOrder = (
  dimensions: readonly TSupportedFilterBarDimensions[],
): Map<string, { groupKey: TranslationKey; dimensions: TSupportedFilterBarDimensions[] }> => {
  const grouped = new Map<
    string,
    { groupKey: TranslationKey; dimensions: TSupportedFilterBarDimensions[] }
  >();

  dimensions.forEach((dimension) => {
    const groupKey = codegenFilterBarDimensionToGroup(dimension);
    const mapKey = `${groupKey.key}::${groupKey.namespace}`;

    let entry = grouped.get(mapKey);
    if (!entry) {
      entry = { groupKey, dimensions: [] };
      grouped.set(mapKey, entry);
    }
    entry.dimensions.push(dimension);
  });

  return grouped;
};
