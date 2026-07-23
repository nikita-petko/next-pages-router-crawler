import { useCallback, useState } from 'react';
import type { BehaviorInterventionResponse } from '../clients/behaviorIntervention';
import type BehaviorInterventionClient from '../clients/behaviorIntervention';

const useNotApprovedInfo = () => {
  const [punishmentData, setPunishmentData] = useState<BehaviorInterventionResponse | null>(null);

  const getNotApprovedInfo = useCallback(
    async (
      behaviorInterventionClient: BehaviorInterventionClient,
      setShowGenericError: (showGenericError: boolean) => void,
    ) => {
      try {
        const result = await behaviorInterventionClient.getNotApproved();
        if (result) {
          setPunishmentData(result);
        } else {
          setPunishmentData(null);
        }
      } catch {
        setShowGenericError(true);
      }
    },
    [],
  );

  const reactivateAccount = useCallback(
    async (behaviorInterventionClient: BehaviorInterventionClient) => {
      await behaviorInterventionClient.reactivateUser();
    },
    [],
  );

  return {
    punishmentData,
    reactivateAccount,
    getNotApprovedInfo,
  };
};

export default useNotApprovedInfo;
