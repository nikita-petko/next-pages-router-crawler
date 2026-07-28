import { useMemo } from 'react';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { SortKey, SortOrder } from '../../api/universeConfigsClientEnums';
import type { ValidConfigEntry, ValidConfigEntryDetail } from '../../api/validTypes';
import useLatestConfigurations from '../../hooks/useLatestConfigurations';
import { configEntryToKey } from '../../utils/configEntryAccessors';
import configEntryToExperimentFormValue from '../utils/configEntryToExperimentFormValue';

const isConfigEntryValueEntry = (
  entry: ValidConfigEntryDetail['overrideEntry']['entry'],
): entry is ValidConfigEntry => {
  return 'entryValue' in entry;
};

const useLatestChosenConfigPublishedEntryForExperiment = ({
  chosenConfigKey,
}: {
  chosenConfigKey?: string;
}) => {
  const { id: universeId, isLoading: isUniverseLoading } = useUniverseResource();

  const { entries } = useLatestConfigurations({
    searchKey: chosenConfigKey,
    sortKey: SortKey.ConfigEntryKey,
    sortOrder: SortOrder.Ascending,
    universeId,
    isUniverseLoading,
  });

  return useMemo(() => {
    if (!chosenConfigKey) {
      return { publishedEntry: undefined, formValue: null };
    }

    const configEntryDetail = entries.find((detail) => {
      return configEntryToKey(detail) === chosenConfigKey;
    });

    const entry = configEntryDetail?.overrideEntry.entry;
    if (!entry || !isConfigEntryValueEntry(entry)) {
      return { publishedEntry: undefined, formValue: null };
    }

    return {
      publishedEntry: entry,
      formValue: configEntryToExperimentFormValue(entry.entryValue) ?? null,
    };
  }, [chosenConfigKey, entries]);
};

export default useLatestChosenConfigPublishedEntryForExperiment;
