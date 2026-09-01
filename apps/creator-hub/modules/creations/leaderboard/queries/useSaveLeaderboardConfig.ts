import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { cloudListOrderedDataStoreEntries } from '@modules/clients/openCloudV2';
import { getResponseFromError } from '@modules/clients/utils';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import { getLeaderboardConfigQueryKey, saveLeaderboardConfig } from '../leaderboardConfigApi';
import type { LeaderboardConfig, LeaderboardConfigEntry } from '../types';

type Variables = {
  key: string;
  entry: LeaderboardConfigEntry;
  isActive: boolean;
};

type SaveResult = {
  dataStoreName: string;
  isOdsEmpty: boolean;
};

type Options = Omit<UseMutationOptions<SaveResult, Error, Variables>, 'mutationFn'>;

// One entry is enough to confirm the ODS is non-empty.
const EXISTENCE_CHECK_PAGE_SIZE = 1;
const ODS_CHECK_TIMEOUT_MS = 1500;

async function checkOdsIsEmpty(params: {
  universeId: string;
  orderedDataStoreId: string;
  scopeId: string;
}): Promise<boolean> {
  let isEmpty: boolean;
  try {
    const response = await cloudListOrderedDataStoreEntries({
      universeId: params.universeId,
      orderedDataStoreId: params.orderedDataStoreId,
      scopeId: params.scopeId,
      maxPageSize: EXISTENCE_CHECK_PAGE_SIZE,
    });
    const entries = response?.orderedDataStoreEntries;
    isEmpty = !entries || entries.length === 0;
  } catch (error) {
    isEmpty = getResponseFromError(error)?.status === 404;
  }
  return isEmpty;
}

function raceWithTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), timeoutMs);
    }),
  ]);
}

export function useSaveLeaderboardConfig(
  universeId: string | number | undefined,
  options: Options = {},
) {
  const intl = useTranslation();
  const { translate } = useTranslationWrapper(intl);
  const queryClient = useQueryClient();
  const queryKey = getLeaderboardConfigQueryKey(universeId);

  return useMutation<SaveResult, Error, Variables>({
    mutationFn: async ({ key, entry, isActive }) => {
      const data = queryClient.getQueryData<LeaderboardConfig>(queryKey);
      const currentActiveKeys = data?.activeLeaderboardKeys ?? [];
      const dataStoreName = entry.ordered_data_store.name;

      const odsCheckPromise: Promise<boolean> =
        universeId != null
          ? checkOdsIsEmpty({
              universeId: String(universeId),
              orderedDataStoreId: dataStoreName,
              scopeId: entry.scope ?? 'global',
            })
          : Promise.resolve(false);

      await saveLeaderboardConfig({
        universeId: String(universeId),
        key,
        entry,
        isActive,
        currentActiveKeys,
      });

      const isOdsEmpty = await raceWithTimeout(odsCheckPromise, ODS_CHECK_TIMEOUT_MS, false);
      return { dataStoreName, isOdsEmpty };
    },
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      // Save lives behind a modal, so just invalidate on success — no optimistic write needed.
      void context.client.invalidateQueries({ queryKey });
      toast({
        title: data.isOdsEmpty
          ? translate(
              translationKey(
                'Description.NoDataFoundInDataStoreError',
                TranslationNamespace.Leaderboards,
              ),
              { dataStoreName: data.dataStoreName },
            )
          : intl.translate('Label.LeaderboardSaved'),
        icon: data.isOdsEmpty ? 'icon-filled-triangle-exclamation' : 'icon-filled-circle-check',
      });
      options.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
