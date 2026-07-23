import { ValidExperimentConfigurationForCreation } from '../../api/validExperimentationTypes';

export enum CheckingShouldUpdateVariantsError {
  NO_TARGETING_CONFIG_FOUND = 'NO_TARGETING_CONFIG_FOUND',
}

export type ShouldUpdateVariantsBeforeStarting = () => Promise<
  | { shouldUpdateVariants: false; error?: CheckingShouldUpdateVariantsError }
  | ({ shouldUpdateVariants: true } & ValidExperimentConfigurationForCreation)
>;
