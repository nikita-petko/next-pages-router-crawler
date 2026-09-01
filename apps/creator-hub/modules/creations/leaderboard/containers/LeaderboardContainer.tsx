import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StatusCodes } from '@rbx/core';
import { OpenCloudError } from '@rbx/google-gax';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import { CreatorConfigsPublicApiHttpError } from '@modules/clients/creatorConfigsPublicApi';
import { EmptyGrid } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useUniversePermissions } from '@modules/react-query/organizations';
import LeaderboardConfigsView from '../components/LeaderboardConfigsView/LeaderboardConfigsView';
import LeaderboardEmptyState from '../components/LeaderboardEmptyState/LeaderboardEmptyState';
import LeaderboardFormSheet from '../components/LeaderboardFormSheet/LeaderboardFormSheet';
import { fetchLeaderboardConfig, getLeaderboardConfigQueryKey } from '../leaderboardConfigApi';
import { useDeleteLeaderboardConfig } from '../queries/useDeleteLeaderboardConfig';
import { useSaveLeaderboardConfig } from '../queries/useSaveLeaderboardConfig';
import { useSetActiveLeaderboards } from '../queries/useSetActiveLeaderboards';
import {
  classifyLeaderboardFailure,
  logLeaderboardDeleteResult,
  logLeaderboardEditResult,
  logLeaderboardPageLoaded,
} from '../telemetry';
import type { LeaderboardConfigEntry } from '../types';

const PERMISSION_DENIED_ERROR_CODE = 16;

const isForbiddenError = (error: unknown): boolean => {
  if (error instanceof OpenCloudError && Number(error.code) === PERMISSION_DENIED_ERROR_CODE) {
    return true;
  }
  if (error instanceof CreatorConfigsPublicApiHttpError && error.status === 403) {
    return true;
  }
  return false;
};

const LeaderboardContainer: FunctionComponent = () => {
  const { translate } = useTranslation();
  const { canConfigure, gameDetails, isLoadingGame, refreshGameDetails } = useCurrentGame();
  const universeId = gameDetails?.id;
  const {
    data: permissions,
    isLoading: isLoadingPermissions,
    isError: isPermissionsError,
    refetch: refetchPermissions,
  } = useUniversePermissions(universeId);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: getLeaderboardConfigQueryKey(universeId),
    enabled: universeId != null,
    queryFn: () => fetchLeaderboardConfig(String(universeId)),
    retry: (_failureCount, err) => !isForbiddenError(err),
  });

  const isDataReady = data != null;
  useEffect(() => {
    if (!data || canConfigure == null || universeId == null) {
      return;
    }
    logLeaderboardPageLoaded({
      universeId,
      isEditable: canConfigure,
      count: data.leaderboards.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once when data first becomes available; refetches keep isDataReady stable
  }, [isDataReady]);

  const showErrorToast = useCallback(() => {
    toast({ title: translate('Response.SomethingWentWrong') });
  }, [translate]);

  const { mutate: setActive, isPending: isSettingActive } = useSetActiveLeaderboards(universeId, {
    onError: showErrorToast,
  });
  const { mutate: deleteLeaderboard, isPending: isDeletingLeaderboard } =
    useDeleteLeaderboardConfig(universeId, { onError: showErrorToast });
  const { mutateAsync: saveLeaderboardAsync, isPending: isSavingLeaderboard } =
    useSaveLeaderboardConfig(universeId);
  const isUpdating = isSettingActive || isDeletingLeaderboard || isSavingLeaderboard;

  // Stable identity so React.memo on <LeaderboardRow> can short-circuit re-renders.
  // Backend caps `active_leaderboards` at 1 entry, so the per-row Toggle acts as a radio group.
  const handleToggleActive = useCallback(
    (key: string, nextIsActive: boolean) => {
      const currentActive = data?.activeLeaderboardKeys ?? [];
      const nextActive = nextIsActive ? [key] : [];
      if (
        nextActive.length === currentActive.length &&
        nextActive.every((k, i) => k === currentActive[i])
      ) {
        return;
      }
      setActive({ activeKeys: nextActive });
    },
    [data?.activeLeaderboardKeys, setActive],
  );

  const handleDelete = useCallback(
    (key: string) => {
      deleteLeaderboard(
        { key },
        {
          onSuccess: () => {
            logLeaderboardDeleteResult({ universeId, success: true });
            toast({
              title: translate('Label.LeaderboardDeleted'),
              icon: 'icon-filled-circle-check',
            });
          },
          onError: (err) => {
            logLeaderboardDeleteResult({
              universeId,
              success: false,
              failureReason: classifyLeaderboardFailure(err),
            });
          },
        },
      );
    },
    [deleteLeaderboard, translate, universeId],
  );

  const [editKey, setEditKey] = useState<string | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

  const editItem = useMemo(
    () => (editKey != null ? data?.leaderboards.find((entry) => entry.key === editKey) : undefined),
    [data?.leaderboards, editKey],
  );

  const handleEdit = useCallback((key: string) => {
    setEditKey(key);
    setIsEditSheetOpen(true);
  }, []);

  const handleSaveEdit = useCallback(
    async (entry: LeaderboardConfigEntry, isActive: boolean) => {
      if (editKey == null) {
        throw new Error('FormSheet open without an edit key');
      }
      try {
        await saveLeaderboardAsync({ key: editKey, entry, isActive });
        logLeaderboardEditResult({ universeId, success: true });
      } catch (err) {
        logLeaderboardEditResult({
          universeId,
          success: false,
          failureReason: classifyLeaderboardFailure(err),
        });
        throw err;
      }
    },
    [editKey, saveLeaderboardAsync, universeId],
  );

  const handleSaveSuccess = useCallback(() => {
    setIsEditSheetOpen(false);
  }, []);

  const handleRetry = async () => {
    await refreshGameDetails();
    await Promise.all([refetch(), refetchPermissions()]);
  };

  if (isLoadingGame || (universeId != null && (isLoading || isLoadingPermissions))) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  if ((isError && isForbiddenError(error)) || (permissions != null && !permissions.publish)) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (!universeId || isError || isPermissionsError) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={handleRetry}
      />
    );
  }

  if (!data || data.leaderboards.length === 0) {
    return <LeaderboardEmptyState />;
  }

  return (
    <>
      <LeaderboardConfigsView
        config={data}
        isUpdating={isUpdating}
        onToggleActive={handleToggleActive}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      {isEditSheetOpen && (
        <LeaderboardFormSheet
          mode='edit'
          onClose={() => setIsEditSheetOpen(false)}
          editItem={editItem}
          config={data}
          save={handleSaveEdit}
          onSuccess={handleSaveSuccess}
          isPending={isSavingLeaderboard}
        />
      )}
    </>
  );
};

export default withTranslation(LeaderboardContainer, [
  TranslationNamespace.CommonUIMessages,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.Leaderboards,
]);
