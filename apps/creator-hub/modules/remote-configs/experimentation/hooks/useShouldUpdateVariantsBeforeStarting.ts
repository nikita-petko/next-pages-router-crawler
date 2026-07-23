import { useUniverseResource } from '@modules/experience-analytics-shared';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { logAnalyticsError } from '@modules/charts-generic';
import { configEntryToBestEntryValue, configEntryToKey } from '../../utils/configEntryAccessors';
import {
  SortKey,
  SortOrder,
  ValidConfigEntryValueType,
} from '../../api/universeConfigsClientEnums';
import useLatestConfigurations, {
  getCachedFilteredAndSortedEntries,
} from '../../hooks/useLatestConfigurations';
import { ExperimentProductType } from '../../api/universeExperimentationClientEnums';
import { ValidConfigExperimentVariant, ValidExperiment } from '../../api/validExperimentationTypes';
import {
  CheckingShouldUpdateVariantsError,
  ShouldUpdateVariantsBeforeStarting,
} from '../types/ShouldUpdateVairantsBeforeStarting';

const useShouldUpdateVariantsBeforeStarting = ({
  experiment,
}: {
  experiment: ValidExperiment & { experimentType: ExperimentProductType.Configs };
}): ShouldUpdateVariantsBeforeStarting => {
  const { id: universeId, isLoading: isUniverseLoading } = useUniverseResource();
  const queryClient = useQueryClient();

  const baselineVariant = useMemo(() => {
    const control = experiment.variants.find((v) => v.isBaseline);
    if (!control) {
      throw new Error(`Baseline variant not found for experiment ${experiment.id}`);
    }
    return control;
  }, [experiment.id, experiment.variants]);

  const targetingConfigKey = baselineVariant.configEntry.key;

  const { refetch } = useLatestConfigurations({
    universeId,
    isUniverseLoading,
    sortKey: SortKey.ConfigEntryKey,
    sortOrder: SortOrder.Ascending,
    searchKey: targetingConfigKey,
  });

  return useCallback(async () => {
    // Step 1: Refresh the latest configuration data
    await refetch();

    // Step 2: Retrieve the most recent value for the targeting config
    const entries = getCachedFilteredAndSortedEntries({
      queryClient,
      universeId,
      searchKey: targetingConfigKey,
      sortOrder: SortOrder.Ascending,
      sortKey: SortKey.ConfigEntryKey,
    });
    const targetingConfigEntry = entries.find(
      (entry) => configEntryToKey(entry) === targetingConfigKey,
    );
    const targetingConfigValue = targetingConfigEntry
      ? configEntryToBestEntryValue(targetingConfigEntry)
      : undefined;

    if (!targetingConfigValue) {
      return {
        shouldUpdateVariants: false,
        error: CheckingShouldUpdateVariantsError.NO_TARGETING_CONFIG_FOUND,
      };
    }

    // Step 3: Compare and update the control variant's value if the latest targeting config value has changed
    let shouldUpdateVariants = false;
    if (targetingConfigValue.valueType === baselineVariant.configEntry.entryValue.valueType) {
      switch (targetingConfigValue.valueType) {
        case ValidConfigEntryValueType.String:
          shouldUpdateVariants =
            targetingConfigValue.stringValue !== baselineVariant.configEntry.entryValue.stringValue;
          break;
        case ValidConfigEntryValueType.Number:
          shouldUpdateVariants =
            targetingConfigValue.numberValue !== baselineVariant.configEntry.entryValue.numberValue;
          break;
        case ValidConfigEntryValueType.Boolean:
          shouldUpdateVariants =
            targetingConfigValue.boolValue !== baselineVariant.configEntry.entryValue.boolValue;
          break;
        case ValidConfigEntryValueType.Json:
          shouldUpdateVariants =
            targetingConfigValue.jsonValue !== baselineVariant.configEntry.entryValue.jsonValue;
          break;
        default: {
          const exhaustiveCheck: never = targetingConfigValue;
          throw new Error(`Unknown ConfigEntryValueType: ${exhaustiveCheck}`);
        }
      }
    } else {
      // The value type of the baseline variant should always match the targeting config's value type
      logAnalyticsError(
        `Baseline variant value type ${baselineVariant.configEntry.entryValue.valueType} does not match targeting config value type ${targetingConfigValue.valueType} for experiment ${experiment.id}`,
      );
    }

    if (shouldUpdateVariants) {
      const updatedVariants: Array<Omit<ValidConfigExperimentVariant, 'variantId'>> =
        experiment.variants.map(({ variantId, ...rest }) => {
          if (rest.isBaseline) {
            return {
              ...rest,
              configEntry: { ...rest.configEntry, entryValue: targetingConfigValue },
            };
          }
          return rest;
        });

      return {
        shouldUpdateVariants: true,
        variants: updatedVariants,
        experimentType: ExperimentProductType.Configs,
      };
    }
    return { shouldUpdateVariants: false };
  }, [
    baselineVariant.configEntry.entryValue.boolValue,
    baselineVariant.configEntry.entryValue.jsonValue,
    baselineVariant.configEntry.entryValue.numberValue,
    baselineVariant.configEntry.entryValue.stringValue,
    baselineVariant.configEntry.entryValue.valueType,
    experiment.id,
    experiment.variants,
    queryClient,
    refetch,
    targetingConfigKey,
    universeId,
  ]);
};

export default useShouldUpdateVariantsBeforeStarting;
