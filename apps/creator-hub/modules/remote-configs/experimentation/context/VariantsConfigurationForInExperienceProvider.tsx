import React, { createContext, FunctionComponent, useCallback, useMemo } from 'react';
import { ExperimentProductType } from '../../api/universeExperimentationClientEnums';
import { ValidConfigEntryValueType } from '../../api/universeConfigsClientEnums';
import { ValidConfigsExperimentConfigurationForCreation } from '../../api/validExperimentationTypes';
import { ValidConfigEntryValue } from '../../api/validTypes';
import { ConfigurationStepFormDataInExperience } from '../types/FormData';
import { VariantsConfigurationContextType } from './VariantsConfigurationContext';
import configEntryToExperimentFormValue from '../utils/configEntryToExperimentFormValue';

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

export const VariantsConfigurationForInExperienceProvider: FunctionComponent<
  React.PropsWithChildren
> = ({ children }) => {
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
        let entryValue: ValidConfigEntryValue;
        switch (chosenConfig.valueType) {
          case ValidConfigEntryValueType.String:
            entryValue = {
              valueType: ValidConfigEntryValueType.String,
              stringValue: variant.value,
            };
            break;
          case ValidConfigEntryValueType.Number:
            entryValue = {
              valueType: ValidConfigEntryValueType.Number,
              numberValue: Number(variant.value),
            };
            break;
          case ValidConfigEntryValueType.Boolean:
            entryValue = {
              valueType: ValidConfigEntryValueType.Boolean,
              boolValue: variant.value === 'true',
            };
            break;
          case ValidConfigEntryValueType.Json:
            entryValue = {
              valueType: ValidConfigEntryValueType.Json,
              jsonValue: variant.value,
            };
            break;

          default: {
            const exhaustiveCheck: never = chosenConfig.valueType;
            throw new Error(`Unknown ConfigEntryValueType: ${exhaustiveCheck}`);
          }
        }

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
    [],
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

    return {
      chosenConfig: {
        key: configEntry.key,
        valueType: configEntry.entryValue.valueType,
      },
      variants: variants.map((variant) => {
        // For in-experinece, a variant can only have exactly one config entry
        const { entryValue } = variant.configEntry;
        return {
          label: variant.label,
          weight: variant.weight,
          isBaseline: variant.isBaseline,
          value: configEntryToExperimentFormValue(entryValue) || '',
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
