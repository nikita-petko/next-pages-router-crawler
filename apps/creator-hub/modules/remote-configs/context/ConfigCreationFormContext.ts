import { createContext, useContext } from 'react';
import type { ValidConfigEntry, ValidConditionRule } from '../api/validTypes';
import type { ConfigFormData } from '../types/FormData';

export type TransformedConfigForMutation = {
  entry: ValidConfigEntry;
  conditionalRules: Array<ValidConditionRule>;
  conditionNames: Array<string>;
};

export type ConfigCreationFormContextType = {
  /**
   * Converts the current form data into the API payload format used by the
   * V2 create/update config mutations.
   */
  transformConfigFormDataToValidConfig: (formData: ConfigFormData) => TransformedConfigForMutation;

  /**
   * Converts an existing ValidConfigEntry (and its associated rules) into
   * ConfigFormData suitable for populating the form when editing.
   */
  transformValidConfigToFormData: (
    entry: ValidConfigEntry,
    rules?: Map<string, ValidConditionRule>,
  ) => ConfigFormData;

  /** Whether the form is in edit mode (an existing config is being modified). */
  isEditing: boolean;

  /** Names of all condition rules that already exist in the universe. */
  allConditionRuleNames: ReadonlyArray<string>;
};

export const ConfigCreationFormContext = createContext<ConfigCreationFormContextType>({
  transformConfigFormDataToValidConfig: () => {
    throw new Error('ConfigCreationFormContext not initialised');
  },
  transformValidConfigToFormData: () => {
    throw new Error('ConfigCreationFormContext not initialised');
  },
  isEditing: false,
  allConditionRuleNames: [],
});

const useConfigCreationFormContext = (): ConfigCreationFormContextType =>
  useContext(ConfigCreationFormContext);

export default useConfigCreationFormContext;
