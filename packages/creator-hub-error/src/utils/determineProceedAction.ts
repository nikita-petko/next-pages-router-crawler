import { BehaviorInterventionResponse } from '../clients/behaviorIntervention';
import canReactivate from './canReactivate';
import { PUNISHMENT_TYPE, ProceedAction } from './constants';

function determineProceedAction(
  punishmentData: BehaviorInterventionResponse | null,
): ProceedAction | null {
  if (!punishmentData) {
    return null;
  }

  const { punishmentTypeDescription, endDate, verificationCategory } = punishmentData;

  if (verificationCategory) {
    return ProceedAction.RobloxRedirect;
  }
  if (punishmentTypeDescription === PUNISHMENT_TYPE.Delete) {
    return ProceedAction.RequestAppeal;
  }
  if (canReactivate(punishmentTypeDescription, endDate)) {
    return ProceedAction.Reactivate;
  }
  return null;
}

export default determineProceedAction;
