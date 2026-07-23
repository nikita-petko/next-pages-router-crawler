import { useMemo } from 'react';
import { useUniverseResource } from '@modules/experience-analytics-shared';
import { SortKey, SortOrder } from '../../api/universeConfigsClientEnums';
import { configEntryToBestEntryValue, configEntryToKey } from '../../utils/configEntryAccessors';
import useLatestConfigurations from '../../hooks/useLatestConfigurations';
import configEntryToExperimentFormValue from '../utils/configEntryToExperimentFormValue';

const useLatestTargetingConfigEntryValueForExperiment = ({
  chosenConfigKey,
}: {
  chosenConfigKey?: string;
}) => {
  const { id: universeId, isLoading: isUniverseLoading } = useUniverseResource();
  const { entries: chosenConfigEntries } = useLatestConfigurations({
    searchKey: chosenConfigKey,
    sortKey: SortKey.ConfigEntryKey,
    sortOrder: SortOrder.Ascending,
    universeId,
    isUniverseLoading,
  });

  return useMemo(() => {
    if (!chosenConfigKey) {
      return null;
    }

    const configEntry = chosenConfigEntries.find((detail) => {
      const key = configEntryToKey(detail);
      return key === chosenConfigKey;
    });

    const entryValue = configEntry ? configEntryToBestEntryValue(configEntry) : undefined;
    return configEntryToExperimentFormValue(entryValue);
  }, [chosenConfigEntries, chosenConfigKey]);
};

export default useLatestTargetingConfigEntryValueForExperiment;
