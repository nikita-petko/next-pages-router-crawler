import type { FunctionComponent } from 'react';
import React, { createContext, useCallback, useMemo } from 'react';
import { useFlag } from '@rbx/flags';
import {
  isExperimentNullControlValueEnabled as isExperimentNullControlValueEnabledFlag,
  isTargetingConfigsEnabled as isTargetingConfigsEnabledFlag,
} from '@generated/flags/creatorAnalytics';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { ValidConfigEntryValueType } from '../../api/universeConfigsClientEnums';
import { ExperimentProductType } from '../../api/universeExperimentationClientEnums';
import type { ValidConfigsExperimentConfigurationForCreation } from '../../api/validExperimentationTypes';
import type { ValidConfigEntryValue } from '../../api/validTypes';
import type { ConfigurationStepFormDataInExperience } from '../types/FormData';
import configEntryToExperimentFormValue from '../utils/configEntryToExperimentFormValue';
import type { VariantsConfigurationContextType } from './types';

export const VariantsConfigurationForInExperienceContext = createContext<
  VariantsConfigurationContextType<ExperimentProductType.Configs>
>({
  getConfigs: () => {
    throw new Error('Not implemented');
  },
  transformVariantsFormDataToValidVariants: () => {
    throw new Error('Not implemented');
  },
  transformValidVariantsToFormData: () => {
    throw new Error('Not implemented');
  },
});

const formValueToEntryValue = ({
  value,
  valueType,
}: {
  value: string;
  valueType: ValidConfigEntryValueType;
}): ValidConfigEntryValue => {
  switch (valueType) {
    case ValidConfigEntryValueType.String:
      return {
        valueType: ValidConfigEntryValueType.String,
        stringValue: value,
      };
    case ValidConfigEntryValueType.Number:
      return {
        valueType: ValidConfigEntryValueType.Number,
        numberValue: Number(value),
      };
    case ValidConfigEntryValueType.Boolean:
      return {
        valueType: ValidConfigEntryValueType.Boolean,
        boolValue: value === 'true',
      };
    case ValidConfigEntryValueType.Json:
      return {
        valueType: ValidConfigEntryValueType.Json,
        jsonValue: value,
      };
    default: {
      const exhaustiveCheck: never = valueType;
      throw new Error(`Unknown ConfigEntryValueType: ${String(exhaustiveCheck)}`);
    }
  }
};

export const VariantsConfigurationForInExperienceProvider: FunctionComponent<
  React.PropsWithChildren
> = ({ children }) => {
  const { id: universeId } = useUniverseResource();
  const flagContext = { universeId };
  const { ready: isTargetingConfigsReady, value: isTargetingConfigsEnabledValue } = useFlag(
    isTargetingConfigsEnabledFlag,
    flagContext,
  );
  const {
    ready: isExperimentNullControlValueReady,
    value: isExperimentNullControlValueEnabledValue,
  } = useFlag(isExperimentNullControlValueEnabledFlag, flagContext);
  const isTargetingConfigsEnabled = isTargetingConfigsReady && isTargetingConfigsEnabledValue;
  const isExperimentNullControlValueEnabled =
    isExperimentNullControlValueReady && isExperimentNullControlValueEnabledValue;
  const shouldSendNullControlValue =
    isTargetingConfigsEnabled && isExperimentNullControlValueEnabled;

  const getConfigs = useCallback(() => {
    return {
      configs: [],
      refresh: () => {
        // No-op for in-experience configs as they don't need refreshing
      },
    };
  }, []);

  const transformVariantsFormDataToValidVariants = useCallback(
    ({
      chosenConfig,
      variants,
    }: ConfigurationStepFormDataInExperience): ValidConfigsExperimentConfigurationForCreation => {
      if (!chosenConfig) {
        return {
          experimentType: ExperimentProductType.Configs,
          variants: [],
        };
      }

      const validVariants = variants.map((variant) => {
        const entryValue =
          shouldSendNullControlValue && variant.isBaseline
            ? null
            : formValueToEntryValue({
                value: variant.value,
                valueType: chosenConfig.valueType,
              });

        return {
          label: variant.label,
          weight: variant.weight,
          isBaseline: variant.isBaseline,
          configEntry: {
            key: chosenConfig.key,
            entryValue,
          },
        };
      });

      return {
        experimentType: ExperimentProductType.Configs,
        variants: validVariants,
      };
    },
    [shouldSendNullControlValue],
  );

  const transformValidVariantsToFormData: (
    variants: ValidConfigsExperimentConfigurationForCreation['variants'],
  ) => ConfigurationStepFormDataInExperience = useCallback((variants) => {
    // Given an in-experinece experiment, every variant should map to the same config
    // Hence we are extract config data: key and type from the first config entry of the first variant.
    // This is a solid assumption because an experiment should have more than 1 variant and a variant
    // should have exactly one config entry. But nonetheless, guarding it with
    if (variants.length === 0) {
      return {
        chosenConfig: null,
        variants: [],
      };
    }

    const { configEntry } = variants[0];
    const baselineVariant = variants.find((variant) => variant.isBaseline);
    const baselineValueType =
      baselineVariant?.configEntry.entryValue?.valueType ??
      variants.find((variant) => variant.configEntry.entryValue != null)?.configEntry.entryValue
        ?.valueType;

    return {
      chosenConfig: {
        key: configEntry.key,
        valueType: baselineValueType ?? ValidConfigEntryValueType.String,
      },
      variants: variants.map((variant) => {
        // For in-experinece, a variant can only have exactly one config entry
        const { entryValue } = variant.configEntry;
        return {
          label: variant.label,
          weight: variant.weight,
          isBaseline: variant.isBaseline,
          value: configEntryToExperimentFormValue(entryValue ?? undefined) ?? '',
        };
      }),
    };
  }, []);

  const value = useMemo(() => {
    return {
      getConfigs,
      transformVariantsFormDataToValidVariants,
      transformValidVariantsToFormData,
    };
  }, [getConfigs, transformVariantsFormDataToValidVariants, transformValidVariantsToFormData]);

  return (
    <VariantsConfigurationForInExperienceContext.Provider value={value}>
      {children}
    </VariantsConfigurationForInExperienceContext.Provider>
  );
};
