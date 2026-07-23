import { PUNISHMENT_TYPE } from './constants';

export default function canReactivate(
  punishmentTypeDescription: string | undefined,
  endDate: Date | undefined,
): boolean {
  const isPastEndDate: boolean = endDate !== undefined && endDate < new Date();

  if (
    punishmentTypeDescription &&
    (punishmentTypeDescription === PUNISHMENT_TYPE.Warn ||
      (punishmentTypeDescription !== PUNISHMENT_TYPE.Delete && isPastEndDate))
  ) {
    return true;
  }
  return false;
}
