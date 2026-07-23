import React, { FC, useCallback, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { FormMode } from '@modules/miscellaneous/common';
import { ValidConfigEntryValueType } from '../api/universeConfigsClientEnums';
import type { ValidConditionRule, ValidConfigEntry } from '../api/validTypes';
import type { ConfigFormData } from '../types/FormData';
import {
  transformConfigFormDataToValidConfig as transformToValid,
  transformValidConfigToFormData as transformToForm,
} from '../utils/configFormDataTransforms';
import {
  ConfigCreationFormContext,
  type TransformedConfigForMutation,
} from './ConfigCreationFormContext';

// ---------------------------------------------------------------------------
// Provider component
// ---------------------------------------------------------------------------

type ConfigCreationFormProviderProps = {
  /** Existing config entry when editing; omit for creation mode. */
  existingConfig?: ValidConfigEntry;
  /** Condition rules associated with the existing config (edit mode). */
  existingRules?: Map<string, ValidConditionRule>;
  /** All condition rules in the universe (used to populate the existing-condition dropdown). */
  allRules?: Map<string, ValidConditionRule>;
  /** Optional partial default values that override the empty defaults (e.g. from query params). */
  defaultOverrides?: Partial<ConfigFormData>;
  children: React.ReactNode;
};

const ConfigCreationFormProvider: FC<ConfigCreationFormProviderProps> = ({
  existingConfig,
  existingRules,
  allRules,
  defaultOverrides,
  children,
}) => {
  // Edit mode when a full config object is provided, or when a configKey
  // arrives via URL query-param overrides (legacy edit flow).
  const isEditing = !!existingConfig || !!defaultOverrides?.configKey;

  // -- Transform: FormData -> API payload ----------------------------------

  const transformConfigFormDataToValidConfig = useCallback(
    (formData: ConfigFormData): TransformedConfigForMutation => transformToValid(formData),
    [],
  );

  // -- Transform: API payload -> FormData ----------------------------------

  const transformValidConfigToFormData = useCallback(
    (entry: ValidConfigEntry, rules?: Map<string, ValidConditionRule>): ConfigFormData =>
      transformToForm(entry, rules),
    [],
  );

  // -- Compute default form values -----------------------------------------

  const defaultFormValues = useMemo<ConfigFormData>(() => {
    if (existingConfig) {
      return transformValidConfigToFormData(existingConfig, existingRules);
    }

    return {
      configKey: '',
      overrideType: ValidConfigEntryValueType.String,
      stringValue: '',
      boolValue: 'true',
      description: '',
      conditions: [],
      ...defaultOverrides,
    };
  }, [existingConfig, existingRules, defaultOverrides, transformValidConfigToFormData]);

  // -- React-Hook-Form setup -----------------------------------------------

  const methods = useForm<ConfigFormData>({
    defaultValues: defaultFormValues,
    mode: FormMode.All,
  });

  // -- Context value -------------------------------------------------------

  const allConditionRuleNames = useMemo(
    () => Array.from(allRules?.keys() ?? []).sort(),
    [allRules],
  );

  const contextValue = useMemo(
    () => ({
      transformConfigFormDataToValidConfig,
      transformValidConfigToFormData,
      isEditing,
      allConditionRuleNames,
    }),
    [
      transformConfigFormDataToValidConfig,
      transformValidConfigToFormData,
      isEditing,
      allConditionRuleNames,
    ],
  );

  return (
    <ConfigCreationFormContext.Provider value={contextValue}>
      <FormProvider {...methods}>{children}</FormProvider>
    </ConfigCreationFormContext.Provider>
  );
};

export default ConfigCreationFormProvider;
