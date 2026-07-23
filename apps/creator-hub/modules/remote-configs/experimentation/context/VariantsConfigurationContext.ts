import { useContext } from 'react';
import { ExperimentProductType } from '../../api/universeExperimentationClientEnums';
import type { VariantsConfigurationContextType } from './types';
import { VariantsConfigurationForInExperienceContext } from './VariantsConfigurationForInExperienceProvider';
import { VariantsConfigurationForMatchmakingContext } from './VariantsConfigurationForMatchMakingProvider';

// Function overloads for better type safety
function useVariantsConfigurationProvider(
  productType: ExperimentProductType.Configs,
): VariantsConfigurationContextType<ExperimentProductType.Configs>;
function useVariantsConfigurationProvider(
  productType: ExperimentProductType.Matchmaking,
): VariantsConfigurationContextType<ExperimentProductType.Matchmaking>;
function useVariantsConfigurationProvider(
  productType: ExperimentProductType,
):
  | VariantsConfigurationContextType<ExperimentProductType.Configs>
  | VariantsConfigurationContextType<ExperimentProductType.Matchmaking>;
function useVariantsConfigurationProvider(
  productType: ExperimentProductType,
):
  | VariantsConfigurationContextType<ExperimentProductType.Configs>
  | VariantsConfigurationContextType<ExperimentProductType.Matchmaking> {
  const inExperienceContext = useContext(VariantsConfigurationForInExperienceContext);
  const matchmakingContext = useContext(VariantsConfigurationForMatchmakingContext);

  switch (productType) {
    case ExperimentProductType.Configs:
      return inExperienceContext;
    case ExperimentProductType.Matchmaking:
      return matchmakingContext;
    default: {
      const exhaustiveCheck: never = productType;
      throw new Error(`Unknown product type: ${exhaustiveCheck}`);
    }
  }
}

export default useVariantsConfigurationProvider;
