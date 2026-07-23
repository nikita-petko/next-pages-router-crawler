import { useMutation, type UseMutateFunction } from '@tanstack/react-query';
import { useAnalyticsAlertClient } from '../components/AnalyticsAlertClientProvider';
import type { AnalyticsAlertConfigState } from '../constants/types';

export default function useAnalyticsAlertResourceMutations(universeId: number | undefined): {
  patchConfigState: (params: { alertId: string; configState: AnalyticsAlertConfigState }) => void;
  removeAlert: UseMutateFunction<unknown, Error, string>;
  isRemoveAlertPending: boolean;
} {
  const alertClient = useAnalyticsAlertClient();

  const { mutate: patchConfigState } = useMutation({
    mutationFn: async (params: { alertId: string; configState: AnalyticsAlertConfigState }) => {
      if (universeId == null || !Number.isFinite(universeId)) {
        throw new Error('Missing universe id');
      }
      return alertClient.patchAlertConfigState({
        universeId,
        alertId: params.alertId,
        configState: params.configState,
      });
    },
  });

  const { mutate: removeAlert, isPending: isRemoveAlertPending } = useMutation({
    mutationFn: async (alertId: string) => {
      if (universeId == null || !Number.isFinite(universeId) || universeId <= 0) {
        throw new Error('Missing universe id');
      }
      return alertClient.deleteAlert(universeId, alertId);
    },
  });

  return { patchConfigState, removeAlert, isRemoveAlertPending };
}
