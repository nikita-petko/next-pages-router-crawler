import { MomentCreationStatus } from '../types/MomentCreation';

export const MOMENT_STATUS_DOT_CLASS: Record<MomentCreationStatus, string> = {
  [MomentCreationStatus.ACTIVE]: 'bg-system-success',
  [MomentCreationStatus.PENDING]: 'bg-system-warning',
  [MomentCreationStatus.DRAFT]: 'bg-surface-300',
  [MomentCreationStatus.MODERATED]: 'bg-system-alert',
};
