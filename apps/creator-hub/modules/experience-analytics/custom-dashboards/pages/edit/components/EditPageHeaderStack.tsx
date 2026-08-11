import { type FC, type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Button, IconButton } from '@rbx/foundation-ui';
import useTextFilterValidation from '@modules/experience-analytics-shared/text-filter/useTextFilterValidation';
import {
  CustomDashboardNotAvailableError,
  CustomDashboardPermissionDeniedError,
  CustomDashboardQuotaExceededError,
  CustomDashboardUnauthenticatedError,
  CustomDashboardValidationError,
  CustomDashboardVersionConflictError,
} from '../../../errors';
import { MAX_DASHBOARD_NAME_LENGTH } from '../../../types';
import useEditPageTranslations from '../useEditPageTranslations';

/**
 * Editor header chrome: name + pencil on the left, Preview / Cancel /
 * Publish-as-save on the right.
 * Header stays invariant across render states so the chrome doesn't jitter.
 */
type EditPageHeaderStackProps = {
  readonly dashboardName: string | null;
  readonly createdByUsername: string | null;
  readonly hasUnsavedChanges: boolean;
  readonly isSaving: boolean;
  readonly saveError: unknown;
  /** When false, hides the rename pencil (read-only / blocked edit modes). */
  readonly canRename?: boolean;
  readonly onCancel: () => void;
  readonly onPreview: () => void;
  readonly onPublish: (titleOverride?: string) => void;
  readonly primaryActionLabel: string;
  readonly onRenameDashboard: (nextName: string) => void;
};

function getSaveErrorLabel(
  error: unknown,
  t: ReturnType<typeof useEditPageTranslations>,
): string | null {
  if (error == null) {
    return null;
  }
  if (error instanceof CustomDashboardPermissionDeniedError) {
    return t.publicationPermissionDeniedErrorLabel;
  }
  if (error instanceof CustomDashboardUnauthenticatedError) {
    return t.publicationUnauthenticatedErrorLabel;
  }
  if (error instanceof CustomDashboardNotAvailableError) {
    return t.publicationUnavailableErrorLabel;
  }
  if (error instanceof CustomDashboardQuotaExceededError) {
    return t.publicationQuotaExceededErrorLabel;
  }
  if (error instanceof CustomDashboardValidationError) {
    return t.publicationValidationErrorLabel;
  }
  if (error instanceof CustomDashboardVersionConflictError) {
    return t.publicationConflictErrorLabel;
  }
  return t.publicationErrorLabel;
}

const EditPageHeaderStack: FC<EditPageHeaderStackProps> = ({
  dashboardName,
  createdByUsername,
  hasUnsavedChanges,
  isSaving,
  saveError,
  canRename = true,
  onCancel,
  onPreview,
  onPublish,
  primaryActionLabel,
  onRenameDashboard,
}) => {
  const t = useEditPageTranslations();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isFinishingEditRef = useRef(false);
  const pendingTitleCommitRef = useRef(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(dashboardName ?? '');
  const [pendingPublishTitle, setPendingPublishTitle] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isEditingTitle) {
      return undefined;
    }
    const id = window.setTimeout(() => {
      const input = inputRef.current;
      if (!input) {
        return;
      }
      input.focus();
      const caretPosition = input.value.length;
      input.setSelectionRange(caretPosition, caretPosition);
    }, 0);
    return () => window.clearTimeout(id);
  }, [isEditingTitle]);

  const subtitle = createdByUsername !== null ? t.createdBySubtitle(createdByUsername) : null;
  const isDashboardLoaded = dashboardName !== null;
  const {
    confirmedValue: confirmedDraftTitle,
    status: titleFilterStatus,
    isBlocked: isTitleBlocked,
  } = useTextFilterValidation(draftTitle, {
    initialConfirmedValue: dashboardName ?? '',
  });
  const isTitleFilterPending = isEditingTitle && titleFilterStatus === 'pending';
  const titleError = isEditingTitle && isTitleBlocked ? t.tileTitleBlockedError : null;
  const saveErrorLabel = getSaveErrorLabel(saveError, t);
  const trimmedDraftTitle = confirmedDraftTitle.trim();
  const hasValidTitleChange =
    isEditingTitle &&
    titleFilterStatus === 'ok' &&
    trimmedDraftTitle.length > 0 &&
    trimmedDraftTitle !== (dashboardName?.trim() ?? '');
  const hasPendingTitleChange = pendingPublishTitle !== undefined;

  useEffect(() => {
    if (!pendingTitleCommitRef.current || titleFilterStatus === 'pending') {
      return;
    }
    pendingTitleCommitRef.current = false;

    const nextName = confirmedDraftTitle.trim();
    const currentName = dashboardName?.trim() ?? '';
    if (titleFilterStatus === 'ok' && nextName.length > 0 && nextName !== currentName) {
      onRenameDashboard(nextName);
    }
  }, [confirmedDraftTitle, dashboardName, onRenameDashboard, titleFilterStatus]);

  const finishTitleEdit = useCallback(
    ({
      shouldCommit,
      shouldCloseOnPendingOrBlocked = false,
      shouldKeepOpenWhenBlocked = false,
    }: {
      shouldCommit: boolean;
      shouldCloseOnPendingOrBlocked?: boolean;
      shouldKeepOpenWhenBlocked?: boolean;
    }) => {
      if (isFinishingEditRef.current) {
        return;
      }
      const nextName = draftTitle.trim();
      const currentName = dashboardName?.trim() ?? '';
      if (shouldCommit && (isTitleFilterPending || isTitleBlocked)) {
        if (shouldCloseOnPendingOrBlocked) {
          if (isTitleFilterPending) {
            pendingTitleCommitRef.current = true;
          } else if (shouldKeepOpenWhenBlocked) {
            return;
          } else {
            setDraftTitle(dashboardName ?? '');
          }
          setIsEditingTitle(false);
        }
        return;
      }
      isFinishingEditRef.current = true;
      if (shouldCommit && nextName.length > 0 && nextName !== currentName) {
        const confirmedNextName = confirmedDraftTitle.trim();
        setPendingPublishTitle(confirmedNextName);
        onRenameDashboard(confirmedNextName);
      } else {
        setPendingPublishTitle(undefined);
        setDraftTitle(dashboardName ?? '');
      }
      setIsEditingTitle(false);
      window.setTimeout(() => {
        isFinishingEditRef.current = false;
      }, 0);
    },
    [
      confirmedDraftTitle,
      dashboardName,
      draftTitle,
      isTitleBlocked,
      isTitleFilterPending,
      onRenameDashboard,
    ],
  );

  const startTitleEdit = useCallback(() => {
    isFinishingEditRef.current = false;
    pendingTitleCommitRef.current = false;
    setPendingPublishTitle(undefined);
    setDraftTitle(dashboardName ?? '');
    setIsEditingTitle(true);
  }, [dashboardName]);

  const handlePublish = useCallback(() => {
    setPendingPublishTitle(undefined);
    onPublish(pendingPublishTitle);
  }, [onPublish, pendingPublishTitle]);

  const handleTitleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        finishTitleEdit({ shouldCommit: true });
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        finishTitleEdit({ shouldCommit: false });
      }
    },
    [finishTitleEdit],
  );

  return (
    <header className='grid [grid-template-columns:auto_minmax(0,1fr)] gap-small small:[grid-template-columns:auto_minmax(0,1fr)_auto] small:gap-medium'>
      <div className='[grid-column:1] [grid-row:2] small:[grid-row:1]'>
        <IconButton
          icon='icon-regular-chevron-large-left'
          variant='Utility'
          size='Small'
          ariaLabel={t.notFoundCtaLabel}
          onClick={onCancel}
        />
      </div>

      <div className='flex flex-col gap-xxsmall min-width-0 [grid-column:1/-1] [grid-row:1] small:[grid-column:2]'>
        <div className='flex items-center gap-small min-width-0'>
          {isEditingTitle ? (
            <input
              ref={inputRef}
              type='text'
              aria-label={t.renameDashboardLabel}
              className='text-heading-large content-emphasis margin-none padding-none max-width-full bg-none stroke-none outline-none'
              // Auto-size the field to its content so the pencil stays next to
              // the text (matching the static title) instead of the input
              // stretching to fill the row. `ch`-based sizing is approximate
              // for proportional fonts but tracks closely enough; max-width
              // keeps long titles from overflowing.
              size={Math.max(draftTitle.length, 1)}
              value={draftTitle}
              maxLength={MAX_DASHBOARD_NAME_LENGTH}
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={handleTitleKeyDown}
              onBlur={() =>
                finishTitleEdit({ shouldCommit: true, shouldCloseOnPendingOrBlocked: true })
              }
            />
          ) : (
            <h1 className='text-heading-large content-emphasis margin-none text-truncate-end'>
              {dashboardName ?? '\u00A0'}
            </h1>
          )}
          {dashboardName !== null && canRename ? (
            <IconButton
              variant='Utility'
              size='Small'
              icon='icon-regular-pencil'
              ariaLabel={t.renameDashboardLabel}
              className='content-emphasis'
              isDisabled={isEditingTitle}
              onClick={startTitleEdit}
            />
          ) : null}
        </div>
        {subtitle !== null ? (
          <span className='text-body-medium content-muted text-truncate-end'>{subtitle}</span>
        ) : null}
        {dashboardName !== null && hasUnsavedChanges ? (
          <span className='text-label-small content-muted' aria-live='polite'>
            {t.unsavedChangesLabel}
          </span>
        ) : null}
        {titleError ? (
          <p role='alert' className='text-body-small content-system-alert margin-none'>
            {titleError}
          </p>
        ) : null}
      </div>

      <div className='flex flex-col items-start small:items-end gap-xxsmall min-width-0 [grid-column:2] [grid-row:2] small:[grid-column:3] small:[grid-row:1]'>
        <div className='flex wrap items-center gap-small'>
          <Button
            variant='Standard'
            size='Medium'
            isDisabled={!isDashboardLoaded}
            onClick={onPreview}>
            {t.previewButtonLabel}
          </Button>
          <Button
            variant='Standard'
            size='Medium'
            isDisabled={!isDashboardLoaded || isSaving}
            onClick={onCancel}>
            {t.cancelButtonLabel}
          </Button>
          <Button
            variant='Emphasis'
            size='Medium'
            // Nothing to persist when there are no unsaved changes; also
            // blocks a second submit while a save is in flight.
            isDisabled={
              !isDashboardLoaded ||
              isSaving ||
              (!hasUnsavedChanges && !hasValidTitleChange && !hasPendingTitleChange) ||
              isTitleFilterPending ||
              isTitleBlocked
            }
            onClick={handlePublish}>
            {primaryActionLabel}
          </Button>
        </div>
        {saveErrorLabel ? (
          <p role='alert' className='text-body-small content-system-alert margin-none'>
            {saveErrorLabel}
          </p>
        ) : null}
      </div>
    </header>
  );
};

export default EditPageHeaderStack;
