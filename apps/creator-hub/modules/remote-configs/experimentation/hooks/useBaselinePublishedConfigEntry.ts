import { useMemo } from 'react';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { SortKey, SortOrder } from '../../api/universeConfigsClientEnums';
import type { ValidConfigExperimentVariant } from '../../api/validExperimentationTypes';
import type { ValidConfigEntry, ValidConfigEntryDetail } from '../../api/validTypes';
import useLatestConfigurations from '../../hooks/useLatestConfigurations';
import { configEntryToKey } from '../../utils/configEntryAccessors';

const isConfigEntryValueEntry = (
  entry: ValidConfigEntryDetail['overrideEntry']['entry'],
): entry is ValidConfigEntry => {
  return 'entryValue' in entry;
};

const useBaselinePublishedConfigEntry = ({
  variants,
}: {
  variants?: ValidConfigExperimentVariant[];
}) => {
  const { id: universeId, isLoading: isUniverseLoading } = useUniverseResource();

  const baselineConfigKey = variants?.find((variant) => variant.isBaseline)?.configEntry.key;

  const { entries, ruleOrdering, isLoading, isError } = useLatestConfigurations({
    searchKey: baselineConfigKey,
    sortKey: SortKey.ConfigEntryKey,
    sortOrder: SortOrder.Ascending,
    universeId,
    isUniverseLoading,
  });

  const baselinePublishedEntry = useMemo((): ValidConfigEntry | undefined => {
    if (!baselineConfigKey) {
      return undefined;
    }

    const configEntryDetail = entries.find((detail) => {
      return configEntryToKey(detail) === baselineConfigKey;
    });

    const entry = configEntryDetail?.overrideEntry.entry;
    if (!entry || !isConfigEntryValueEntry(entry)) {
      return undefined;
    }

    return entry;
  }, [baselineConfigKey, entries]);

  return {
    baselinePublishedEntry,
    ruleOrdering,
    isLoading,
    isError,
  };
};

export default useBaselinePublishedConfigEntry;
