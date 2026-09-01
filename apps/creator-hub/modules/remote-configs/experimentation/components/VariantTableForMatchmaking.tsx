import React, { useMemo } from 'react';
import { ExperimentProductType } from '../../api/universeExperimentationClientEnums';
import type { ValidMatchmakingExperimentVariant } from '../../api/validExperimentationTypes';
import useVariantsConfigurationProvider from '../context/VariantsConfigurationContext';
import MatchmakingVariantsTable from '../matchmaking-experiments/MatchmakingVariantsTable';

const VariantTableForMatchmaking = ({
  validVariants,
}: {
  validVariants: ValidMatchmakingExperimentVariant[];
}) => {
  const { transformValidVariantsToFormData } = useVariantsConfigurationProvider(
    ExperimentProductType.Matchmaking,
  );

  const matchmakingVariants = useMemo(() => {
    return transformValidVariantsToFormData(validVariants).matchmakingVariants;
  }, [validVariants, transformValidVariantsToFormData]);

  return <MatchmakingVariantsTable matchmakingVariants={matchmakingVariants} />;
};

export default VariantTableForMatchmaking;
