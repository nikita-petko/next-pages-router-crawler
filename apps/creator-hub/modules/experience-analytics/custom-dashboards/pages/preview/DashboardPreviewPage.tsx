import { type FC, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { openDiscardChangesDialog } from '@modules/monetization-shared/discard-dialog/DiscardChangesDialog';
import CustomDashboardBreadcrumbRegistration from '../../components/CustomDashboardBreadcrumbRegistration';
import ReadOnlyDashboardSurface from '../../components/ReadOnlyDashboardSurface';
import {
  CustomDashboardNotAvailableError,
  CustomDashboardPermissionDeniedError,
  CustomDashboardQuotaExceededError,
  CustomDashboardUnauthenticatedError,
  CustomDashboardValidationError,
  CustomDashboardVersionConflictError,
} from '../../errors';
import { customDashboardQueryKeys } from '../../hooks/customDashboardsQueryConfig';
import {
  useCanMutateCustomDashboards,
  useCustomDashboardService,
} from '../../service/CustomDashboardServiceProvider';
import useDashboardSynthesis from '../../synthesis/useDashboardSynthesis';
import { EMPTY_DASHBOARD_CONFIG } from '../../types';
import {
  attachDashboardIdToWorkingCopy,
  deleteEditorWorkingCopy,
  getEditorWorkingCopy,
} from '../../workingCopy/editorWorkingCopy';
import { persistExistingDashboardUpdate } from '../edit/persistExistingDashboardUpdate';

type DashboardPreviewPageProps = {
  readonly draftId: string | undefined;
  readonly onBackToEditor: () => void;
};

function usePreviewTranslations() {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  return {
    editLabel: tPendingTranslation(
      'Edit',
      'Action label that opens the dashboard editor.',
      translationKey('Action.Edit', TranslationNamespace.Analytics),
    ),
    cancelLabel: tPendingTranslation(
      'Cancel',
      'Button label for canceling the current action.',
      translationKey('Action.Cancel', TranslationNamespace.Analytics),
    ),
    saveLabel: tPendingTranslation(
      'Save',
      'Primary action in the editor header that persists unsaved dashboard edits.',
      translationKey('Action.CustomDashboards.Editor.SaveChanges', TranslationNamespace.Analytics),
    ),
    publishLabel: tPendingTranslation(
      'Publish',
      'Primary action in the editor header that promotes the working copy to a published dashboard.',
      translationKey('Action.Publish', TranslationNamespace.Analytics),
    ),
    saveErrorLabel: tPendingTranslation(
      "Couldn't save this dashboard. Try again.",
      'Inline error shown in the editor header when saving a custom dashboard fails.',
      translationKey('Error.CustomDashboards.SaveFailed', TranslationNamespace.Analytics),
    ),
    savePermissionDeniedErrorLabel: tPendingTranslation(
      "You don't have permission to save this dashboard.",
      'Inline error shown in the editor header when saving fails because the current user lacks permission.',
      translationKey('Error.CustomDashboards.SavePermissionDenied', TranslationNamespace.Analytics),
    ),
    saveUnauthenticatedErrorLabel: tPendingTranslation(
      'Sign in again to save this dashboard.',
      'Inline error shown in the editor header when saving fails because the current session is unauthenticated.',
      translationKey('Error.CustomDashboards.SaveUnauthenticated', TranslationNamespace.Analytics),
    ),
    saveUnavailableErrorLabel: tPendingTranslation(
      "Custom dashboards can't be saved right now. Try again later.",
      'Inline error shown in the editor header when the selected custom-dashboards backend is unavailable.',
      translationKey('Error.CustomDashboards.SaveUnavailable', TranslationNamespace.Analytics),
    ),
    saveQuotaExceededErrorLabel: tPendingTranslation(
      "You've reached the custom dashboard limit. Delete a dashboard and try again.",
      'Inline error shown in the editor header when saving a dashboard would exceed the custom dashboard quota.',
      translationKey('Error.CustomDashboards.SaveQuotaExceeded', TranslationNamespace.Analytics),
    ),
    saveValidationErrorLabel: tPendingTranslation(
      "That dashboard couldn't be saved. Check the fields and try again.",
      'Inline error shown in the editor header when the backend rejects dashboard validation.',
      translationKey('Error.CustomDashboards.SaveValidationFailed', TranslationNamespace.Analytics),
    ),
    saveConflictErrorLabel: tPendingTranslation(
      'This dashboard was updated elsewhere. Review the latest version and try again.',
      'Inline error shown in the editor header when a save loses an optimistic-concurrency race outside the main conflict dialog.',
      translationKey('Error.CustomDashboards.SaveConflict', TranslationNamespace.Analytics),
    ),
    notAvailableTitle: tPendingTranslation(
      "There's nothing to preview.",
      'Headline shown on the custom dashboard preview page when there is no in-memory draft session to preview (for example, a stale or direct preview link).',
      translationKey(
        'Message.CustomDashboards.Preview.NotAvailable',
        TranslationNamespace.Analytics,
      ),
    ),
    notAvailableDescription: tPendingTranslation(
      'Open a dashboard in the editor and select Preview to see your working copy here.',
      'Body copy shown beneath the custom dashboard preview not-available headline, directing the user to start a preview from the editor.',
      translationKey(
        'Description.CustomDashboards.Preview.NotAvailable',
        TranslationNamespace.Analytics,
      ),
    ),
  };
}

function getSaveErrorLabel(
  error: unknown,
  t: ReturnType<typeof usePreviewTranslations>,
): string | null {
  if (error == null) {
    return null;
  }
  if (error instanceof CustomDashboardPermissionDeniedError) {
    return t.savePermissionDeniedErrorLabel;
  }
  if (error instanceof CustomDashboardUnauthenticatedError) {
    return t.saveUnauthenticatedErrorLabel;
  }
  if (error instanceof CustomDashboardNotAvailableError) {
    return t.saveUnavailableErrorLabel;
  }
  if (error instanceof CustomDashboardQuotaExceededError) {
    return t.saveQuotaExceededErrorLabel;
  }
  if (error instanceof CustomDashboardValidationError) {
    return t.saveValidationErrorLabel;
  }
  if (error instanceof CustomDashboardVersionConflictError) {
    return t.saveConflictErrorLabel;
  }
  return t.saveErrorLabel;
}

const DashboardPreviewPage: FC<DashboardPreviewPageProps> = ({ draftId, onBackToEditor }) => {
  const t = usePreviewTranslations();
  const router = useRouter();
  const service = useCustomDashboardService();
  const canMutateDashboards = useCanMutateCustomDashboards();
  const queryClient = useQueryClient();
  const publishInFlightRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<unknown>(null);
  // The preview always reflects the in-memory working copy resolved from the
  // `draftId` query param. We deliberately do not fall back to the persisted /
  // published document: doing so renders the published config under the
  // "Draft preview" banner for stale or direct preview links, which is
  // misleading. Without a valid draft session there is nothing to preview.
  const workingCopy = getEditorWorkingCopy(draftId);
  const config = workingCopy?.config ?? EMPTY_DASHBOARD_CONFIG;
  const universeId = workingCopy?.universeId;
  const synthesis = useDashboardSynthesis(config);

  const handleCancel = useCallback(() => {
    if (!workingCopy) {
      return;
    }
    openDiscardChangesDialog({
      onConfirm: () => {
        deleteEditorWorkingCopy(workingCopy.draftId);
        void router.push(
          `/dashboard/creations/experiences/${workingCopy.universeId}/analytics/dashboards`,
        );
      },
    });
  }, [router, workingCopy]);

  const handlePublish = useCallback(() => {
    if (
      !workingCopy ||
      universeId === undefined ||
      !canMutateDashboards ||
      isSaving ||
      publishInFlightRef.current
    ) {
      return;
    }
    publishInFlightRef.current = true;
    setIsSaving(true);
    setSaveError(null);
    void (async () => {
      try {
        let savedDashboardId: string;
        if (workingCopy.dashboardId === null) {
          const saved = await service.createAndPublish({
            universeId,
            name: workingCopy.name,
            config: workingCopy.config,
            createdByUserId: workingCopy.createdByUserId,
            createdByUsername: workingCopy.createdByUsername,
          });
          savedDashboardId = saved.id;
          attachDashboardIdToWorkingCopy(workingCopy.draftId, savedDashboardId);
          await queryClient.invalidateQueries({
            queryKey: customDashboardQueryKeys.list(universeId),
          });
        } else {
          const saved = await persistExistingDashboardUpdate(service, {
            universeId,
            dashboardId: workingCopy.dashboardId,
            name: workingCopy.name,
            config: workingCopy.config,
            options: {
              actor: {
                userId: workingCopy.createdByUserId,
                username: workingCopy.createdByUsername,
              },
            },
          });
          if (saved.status !== 'published') {
            await service.publish(universeId, saved.id);
          }
          savedDashboardId = saved.id;
          await queryClient.invalidateQueries({
            queryKey: customDashboardQueryKeys.detail(universeId, saved.id),
          });
          await queryClient.invalidateQueries({
            queryKey: customDashboardQueryKeys.list(universeId),
          });
        }
        deleteEditorWorkingCopy(workingCopy.draftId);
        void router.push(
          `/dashboard/creations/experiences/${universeId}/analytics/dashboards/${savedDashboardId}`,
        );
      } catch (error) {
        if (error instanceof CustomDashboardVersionConflictError) {
          onBackToEditor();
          return;
        }
        setSaveError(error);
      } finally {
        publishInFlightRef.current = false;
        setIsSaving(false);
      }
    })();
  }, [
    canMutateDashboards,
    isSaving,
    onBackToEditor,
    queryClient,
    router,
    service,
    universeId,
    workingCopy,
  ]);
  const saveErrorLabel = getSaveErrorLabel(saveError, t);

  if (!workingCopy) {
    return (
      <output className='flex flex-col gap-small'>
        <p className='text-heading-small content-emphasis margin-none'>{t.notAvailableTitle}</p>
        <p className='text-body-medium content-muted margin-none'>{t.notAvailableDescription}</p>
        <div className='flex flex-row'>
          <Button variant='Standard' size='Medium' onClick={onBackToEditor}>
            {t.editLabel}
          </Button>
        </div>
      </output>
    );
  }

  return (
    <ReadOnlyDashboardSurface
      config={config}
      synthesis={synthesis}
      header={
        <header className='flex flex-col gap-small width-full'>
          <CustomDashboardBreadcrumbRegistration dashboardName={workingCopy.name} />
          <div className='flex flex-col gap-small width-full'>
            <div className='flex flex-col gap-xsmall min-width-0'>
              <h1 className='text-heading-large content-emphasis margin-none text-truncate-end'>
                {workingCopy.name}
              </h1>
              <span className='text-body-medium content-muted text-truncate-end'>
                {workingCopy.createdByUsername}
              </span>
            </div>
            <div className='flex wrap items-center gap-small'>
              <Button variant='Standard' size='Medium' onClick={onBackToEditor}>
                {t.editLabel}
              </Button>
              <Button variant='Standard' size='Medium' onClick={handleCancel}>
                {t.cancelLabel}
              </Button>
              <Button
                variant='Emphasis'
                size='Medium'
                isDisabled={universeId === undefined || !canMutateDashboards || isSaving}
                onClick={handlePublish}>
                {workingCopy.dashboardId === null ? t.publishLabel : t.saveLabel}
              </Button>
            </div>
            {saveErrorLabel ? (
              <p role='alert' className='text-body-small content-system-alert margin-none'>
                {saveErrorLabel}
              </p>
            ) : null}
          </div>
        </header>
      }
    />
  );
};

export default DashboardPreviewPage;
