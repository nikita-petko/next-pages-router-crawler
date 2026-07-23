import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CreatorEligibilityEnum } from '@rbx/client-core-content-api/v1';
import { useTranslation } from '@rbx/intl';
import { LinearProgress } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import { useCreatorEligibility } from '@modules/publishing-permissions/hooks/useCreatorEligibility';
import {
  useMomentsDelete,
  useMomentsPublish,
} from '@modules/react-query/momentsCreations/momentsCreationsQueries';
import { useClearMomentsLocalDataOnAuthChange } from '../hooks/useClearMomentsLocalDataOnAuthChange';
import { useMomentsCreationsList } from '../hooks/useMomentsCreationsList';
import { useMomentsLocalMoments } from '../hooks/useMomentsLocalMoments';
import { useMomentsStatusFilter } from '../hooks/useMomentsStatusFilter';
import {
  logMomentsCreationsError,
  MomentsCreationsErrorOperation,
} from '../logging/momentsCreationsErrorLogging';
import {
  logMomentsCreationsAttempt,
  logMomentsCreationsSuccess,
  MomentsCreationsOperation,
} from '../logging/momentsCreationsEventLogging';
import type { MomentCreation } from '../types/MomentCreation';
import { MomentCreationStatus } from '../types/MomentCreation';
import { applyMomentMetadataOverrides, mergeMoments } from '../utils/momentsCreationsMergeUtils';
import type { MomentMetadataUpdate } from '../utils/momentsLocalDraftStorage';
import { getMomentExperienceId } from '../utils/momentToExperienceStub';
import { openCreateMomentsDialog } from './CreateMomentsDialog';
import EditMomentDrawer from './EditMomentDrawer';
import MomentsCreationsEmptyState from './MomentsCreationsEmptyState';
import MomentsCreationsTable from './MomentsCreationsTable';
import MomentsCreatorEligibilityErrorBanner from './MomentsCreatorEligibilityErrorBanner';
import MomentsIdVerificationBanner from './MomentsIdVerificationBanner';

const MomentsCreationsPanel = () => {
  useClearMomentsLocalDataOnAuthChange();

  const { translate } = useTranslation();
  const { user } = useAuthentication();
  const userId = user?.id;
  const {
    data: creatorEligibility,
    isLoading: isCreatorEligibilityLoading,
    isError: isCreatorEligibilityError,
    refetch: refetchCreatorEligibility,
  } = useCreatorEligibility();
  const isIdVerified =
    creatorEligibility?.creatorEligibility.includes(CreatorEligibilityEnum.IdVerified) ?? false;
  const isPublishDisabled =
    isCreatorEligibilityLoading || isCreatorEligibilityError || !isIdVerified;
  const showIdVerificationBanner =
    !isCreatorEligibilityLoading && !isCreatorEligibilityError && !isIdVerified;
  const handleRefetchCreatorEligibility = useCallback(() => {
    void refetchCreatorEligibility();
  }, [refetchCreatorEligibility]);
  const [isEditMomentDrawerOpen, setIsEditMomentDrawerOpen] = useState(false);
  const [editingMoment, setEditingMoment] = useState<MomentCreation | null>(null);
  const [serverMomentOverrides, setServerMomentOverrides] = useState<
    Record<string, Partial<MomentCreation>>
  >({});
  const {
    moments: localMoments,
    updateMoment,
    removeMoment,
    syncWithServerMoments,
  } = useMomentsLocalMoments();
  const { publishMoment, publishingMomentId, isPublishing } = useMomentsPublish();
  const publishLockRef = useRef(false);
  const { deleteMoment, deletingMomentId } = useMomentsDelete();
  const { statusTab } = useMomentsStatusFilter();
  const {
    serverMoments,
    isAllServerMomentsLoaded,
    hasNextPage,
    fetchNextPage,
    error,
    isPending,
    isFetchingNextPage,
    isFetchNextPageError,
    errorUpdatedAt,
    loadedPageCount,
    refetch,
    serverPageSize,
  } = useMomentsCreationsList();
  const isDraftTab = statusTab === MomentCreationStatus.DRAFT;

  const supersededLocalMomentIdsKey = useMemo(() => {
    if (serverMoments.length === 0) {
      return '';
    }

    return serverMoments
      .map((moment) => moment.id)
      .filter((momentId) => localMoments.some((localMoment) => localMoment.id === momentId))
      .sort()
      .join(',');
  }, [localMoments, serverMoments]);

  useEffect(() => {
    if (supersededLocalMomentIdsKey.length === 0) {
      return;
    }

    syncWithServerMoments(serverMoments);
  }, [serverMoments, supersededLocalMomentIdsKey, syncWithServerMoments]);

  const moments = useMemo(() => {
    const mergedMoments = mergeMoments(serverMoments, localMoments);
    return applyMomentMetadataOverrides(mergedMoments, serverMomentOverrides);
  }, [localMoments, serverMomentOverrides, serverMoments]);

  const tableMoments = useMemo(
    () => moments.filter((moment) => moment.status !== MomentCreationStatus.MODERATED),
    [moments],
  );
  const hasMoments = tableMoments.length > 0;

  const lastLoggedListErrorUpdatedAtRef = useRef(0);
  useEffect(() => {
    if (!error || isPending || isFetchNextPageError) {
      return;
    }

    if (errorUpdatedAt <= lastLoggedListErrorUpdatedAtRef.current) {
      return;
    }

    lastLoggedListErrorUpdatedAtRef.current = errorUpdatedAt;
    logMomentsCreationsError(MomentsCreationsErrorOperation.ListMoments, error, {
      userId,
      pageCount: loadedPageCount,
    });
  }, [error, errorUpdatedAt, isFetchNextPageError, isPending, loadedPageCount, userId]);

  const fetchNextPageErrorLoggedRef = useRef(false);
  useEffect(() => {
    if (!isFetchNextPageError || isFetchingNextPage) {
      fetchNextPageErrorLoggedRef.current = false;
      return;
    }

    if (!error || fetchNextPageErrorLoggedRef.current) {
      return;
    }

    fetchNextPageErrorLoggedRef.current = true;
    logMomentsCreationsError(MomentsCreationsErrorOperation.FetchNextPage, error, {
      userId,
      pageCount: loadedPageCount,
    });
  }, [error, isFetchNextPageError, isFetchingNextPage, loadedPageCount, userId]);

  const editingMomentForDrawer = useMemo(() => {
    if (!editingMoment) {
      return null;
    }

    return moments.find((moment) => moment.id === editingMoment.id) ?? editingMoment;
  }, [editingMoment, moments]);

  const handleEditMoment = useCallback((moment: MomentCreation) => {
    setEditingMoment(moment);
    setIsEditMomentDrawerOpen(true);
  }, []);

  const handleEditMomentDrawerOpenChange = useCallback((open: boolean) => {
    setIsEditMomentDrawerOpen(open);
    if (!open) {
      setEditingMoment(null);
    }
  }, []);

  const handleReload = useCallback(() => {
    void refetch();
  }, [refetch]);

  const isLocalMoment = useCallback(
    (momentId: string) => localMoments.some((moment) => moment.id === momentId),
    [localMoments],
  );

  const showPublishError = useCallback(() => {
    toast({
      title: translate('Message.MomentPublishedError' /* TranslationNamespace.Creations */),
    });
  }, [translate]);

  const showDeleteError = useCallback(() => {
    toast({
      title: translate('Message.MomentDeletedError' /* TranslationNamespace.Creations */),
    });
  }, [translate]);

  const showPublishSuccess = useCallback(() => {
    toast({
      title: translate('Message.MomentUploadStarted' /* TranslationNamespace.Creations */),
      icon: 'icon-filled-circle-check',
    });
  }, [translate]);

  const handleDeleteMoment = useCallback(
    async (moment: MomentCreation) => {
      const deleteContext = {
        momentId: moment.id,
        experienceId: getMomentExperienceId(moment),
        isLocalMoment: isLocalMoment(moment.id),
        userId,
      };

      logMomentsCreationsAttempt(MomentsCreationsOperation.DeleteMoment, deleteContext);

      try {
        if (isLocalMoment(moment.id)) {
          removeMoment(moment.id);
        } else {
          await deleteMoment(moment.id);
        }

        setServerMomentOverrides((previousOverrides) => {
          if (!(moment.id in previousOverrides)) {
            return previousOverrides;
          }

          const { [moment.id]: _removed, ...rest } = previousOverrides;
          return rest;
        });
        setIsEditMomentDrawerOpen(false);
        setEditingMoment(null);
        logMomentsCreationsSuccess(MomentsCreationsOperation.DeleteMoment, deleteContext);
      } catch (deleteError) {
        logMomentsCreationsError(
          MomentsCreationsErrorOperation.DeleteMoment,
          deleteError,
          deleteContext,
        );
        showDeleteError();
      }
    },
    [deleteMoment, isLocalMoment, removeMoment, showDeleteError, userId],
  );

  const handleMomentMetadataChange = useCallback(
    (momentId: string, updates: MomentMetadataUpdate) => {
      const modifiedAt = new Date().toISOString();

      if (isLocalMoment(momentId)) {
        updateMoment(momentId, updates);
        return;
      }

      setServerMomentOverrides((previousOverrides) => ({
        ...previousOverrides,
        [momentId]: {
          ...previousOverrides[momentId],
          ...updates,
          modifiedAt,
        },
      }));
    },
    [isLocalMoment, updateMoment],
  );

  const handlePublishMoment = useCallback(
    async (momentId: string) => {
      if (publishLockRef.current || isPublishing || isPublishDisabled) {
        return;
      }

      const moment = localMoments.find((entry) => entry.id === momentId);
      if (!moment) {
        return;
      }

      publishLockRef.current = true;

      const publishContext = {
        momentId,
        experienceId: getMomentExperienceId(moment),
        isLocalMoment: true,
        userId,
      };

      logMomentsCreationsAttempt(MomentsCreationsOperation.PublishMoment, publishContext);

      try {
        await publishMoment(moment);
        removeMoment(momentId);
        setIsEditMomentDrawerOpen(false);
        setEditingMoment(null);
        logMomentsCreationsSuccess(MomentsCreationsOperation.PublishMoment, publishContext);
        showPublishSuccess();
      } catch (publishError) {
        logMomentsCreationsError(
          MomentsCreationsErrorOperation.PublishMoment,
          publishError,
          publishContext,
        );
        showPublishError();
      } finally {
        publishLockRef.current = false;
      }
    },
    [
      isPublishDisabled,
      isPublishing,
      localMoments,
      publishMoment,
      removeMoment,
      showPublishError,
      showPublishSuccess,
      userId,
    ],
  );

  const handlePublishMomentFromDrawer = useCallback(
    (moment: MomentCreation) => {
      void handlePublishMoment(moment.id);
    },
    [handlePublishMoment],
  );

  if (error && !isDraftTab && !hasMoments) {
    return <LoadError onReload={handleReload} />;
  }

  if (isPending && !hasMoments) {
    return (
      <div className='flex grow-1 flex-col items-center justify-center self-stretch width-full'>
        <LinearProgress className='width-[50%]' title={translate('Label.Loading')} />
      </div>
    );
  }

  if (!isAllServerMomentsLoaded && !hasMoments) {
    return (
      <div className='flex grow-1 flex-col items-center justify-center self-stretch width-full'>
        <LinearProgress className='width-[50%]' title={translate('Label.Loading')} />
      </div>
    );
  }

  return (
    <div className='flex grow-1 flex-col gap-medium self-stretch width-full'>
      {isCreatorEligibilityError ? (
        <MomentsCreatorEligibilityErrorBanner onRetry={handleRefetchCreatorEligibility} />
      ) : null}
      {showIdVerificationBanner ? <MomentsIdVerificationBanner /> : null}
      {hasMoments ? (
        <MomentsCreationsTable
          moments={tableMoments}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          serverPageSize={serverPageSize}
          onEditMoment={handleEditMoment}
          onMomentMetadataChange={handleMomentMetadataChange}
          onPublishMoment={handlePublishMoment}
          publishingMomentId={publishingMomentId}
          isPublishDisabled={isPublishDisabled}
        />
      ) : (
        <div className='flex grow-1 flex-col items-center justify-center self-stretch width-full'>
          <MomentsCreationsEmptyState onCreateClick={openCreateMomentsDialog} />
        </div>
      )}
      <EditMomentDrawer
        key={editingMomentForDrawer?.id}
        moment={editingMomentForDrawer}
        open={isEditMomentDrawerOpen}
        onOpenChange={handleEditMomentDrawerOpenChange}
        onMomentMetadataChange={handleMomentMetadataChange}
        onDelete={editingMomentForDrawer ? handleDeleteMoment : undefined}
        onPublish={
          editingMomentForDrawer?.status === MomentCreationStatus.DRAFT
            ? handlePublishMomentFromDrawer
            : undefined
        }
        publishingMomentId={publishingMomentId}
        deletingMomentId={deletingMomentId}
        isPublishDisabled={isPublishDisabled}
      />
    </div>
  );
};

export default MomentsCreationsPanel;
