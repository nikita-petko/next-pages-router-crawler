import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CreatorEligibilityEnum } from '@rbx/client-core-content-api/v1';
import { ProgressCircle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
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
import type { MomentMetadataOverride } from '../utils/momentsCreationsMergeUtils';
import { applyMomentMetadataOverrides } from '../utils/momentsCreationsMergeUtils';
import { getMomentRowKey } from '../utils/momentsIdentityUtils';
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
    Record<string, MomentMetadataOverride>
  >({});
  const { moments: localMoments, updateMoment, removeMoment } = useMomentsLocalMoments();
  const { publishMoment, publishingDraftId, isPublishing } = useMomentsPublish();
  const publishLockRef = useRef(false);
  const { deleteMoment, deletingMomentKey } = useMomentsDelete();
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

  const moments = useMemo(() => {
    const mergedMoments: MomentCreation[] = [...serverMoments, ...localMoments];
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

    const editingMomentKey = getMomentRowKey(editingMoment);
    return moments.find((moment) => getMomentRowKey(moment) === editingMomentKey) ?? editingMoment;
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
      const isDraft = moment.status === MomentCreationStatus.DRAFT;
      const momentKey = getMomentRowKey(moment);
      const deleteContext = {
        ...(isDraft
          ? { draftId: moment.draftId }
          : { momentId: moment.momentId, feedItemId: moment.feedItemId }),
        experienceId: getMomentExperienceId(moment),
        isLocalMoment: isDraft,
        userId,
      };

      logMomentsCreationsAttempt(MomentsCreationsOperation.DeleteMoment, deleteContext);

      try {
        if (moment.status === MomentCreationStatus.DRAFT) {
          removeMoment(moment.draftId);
        } else {
          await deleteMoment(moment);
        }

        setServerMomentOverrides((previousOverrides) => {
          if (!(momentKey in previousOverrides)) {
            return previousOverrides;
          }

          const { [momentKey]: _removed, ...rest } = previousOverrides;
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
    [deleteMoment, removeMoment, showDeleteError, userId],
  );

  const handleMomentMetadataChange = useCallback(
    (moment: MomentCreation, updates: MomentMetadataUpdate) => {
      if (moment.status === MomentCreationStatus.DRAFT) {
        updateMoment(moment.draftId, updates);
        return;
      }

      const momentKey = getMomentRowKey(moment);
      const modifiedAt = new Date().toISOString();

      // Only base-applicable keys: `experienceId`/`rootPlaceId` are draft-only, and the edit drawer
      // already gates those edits behind `isEditable = isDraft`.
      setServerMomentOverrides((previousOverrides) => ({
        ...previousOverrides,
        [momentKey]: {
          ...previousOverrides[momentKey],
          ...(updates.description != null ? { description: updates.description } : {}),
          ...(updates.experienceName != null ? { experienceName: updates.experienceName } : {}),
          ...(updates.locale != null ? { locale: updates.locale } : {}),
          modifiedAt,
        },
      }));
    },
    [updateMoment],
  );

  const handlePublishMoment = useCallback(
    async (draftId: string) => {
      if (publishLockRef.current || isPublishing || isPublishDisabled) {
        return;
      }

      const moment = localMoments.find((entry) => entry.draftId === draftId);
      if (!moment) {
        return;
      }

      publishLockRef.current = true;

      const publishContext = {
        draftId,
        experienceId: getMomentExperienceId(moment),
        isLocalMoment: true,
        userId,
      };

      logMomentsCreationsAttempt(MomentsCreationsOperation.PublishMoment, publishContext);

      try {
        await publishMoment(moment);
        removeMoment(draftId);
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
      if (moment.status !== MomentCreationStatus.DRAFT) {
        return;
      }

      void handlePublishMoment(moment.draftId);
    },
    [handlePublishMoment],
  );

  if (error && !isDraftTab && !hasMoments) {
    return <LoadError onReload={handleReload} />;
  }

  if (isPending && !hasMoments) {
    return (
      <div className='flex grow-1 flex-col items-center justify-center self-stretch width-full'>
        <ProgressCircle
          ariaLabel={translate('Label.Loading')}
          size='Large'
          variant='Indeterminate'
        />
      </div>
    );
  }

  if (!isAllServerMomentsLoaded && !hasMoments) {
    return (
      <div className='flex grow-1 flex-col items-center justify-center self-stretch width-full'>
        <ProgressCircle
          ariaLabel={translate('Label.Loading')}
          size='Large'
          variant='Indeterminate'
        />
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
          publishingDraftId={publishingDraftId}
          isPublishDisabled={isPublishDisabled}
        />
      ) : (
        <div className='flex grow-1 flex-col items-center justify-center self-stretch width-full'>
          <MomentsCreationsEmptyState onCreateClick={openCreateMomentsDialog} />
        </div>
      )}
      <EditMomentDrawer
        key={editingMomentForDrawer ? getMomentRowKey(editingMomentForDrawer) : undefined}
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
        publishingDraftId={publishingDraftId}
        deletingMomentKey={deletingMomentKey}
        isPublishDisabled={isPublishDisabled}
      />
    </div>
  );
};

export default MomentsCreationsPanel;
