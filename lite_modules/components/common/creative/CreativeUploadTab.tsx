import {
  Button,
  Divider,
  Icon,
  IconButton,
  ProgressCircle,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import {
  type ChangeEvent,
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { v4 as uuidv4 } from 'uuid';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import styles from '@components/common/creative/CreativeUploadTab.module.css';
import { FOUNDATION_TOOLTIP_BODY_SMALL_CLASS } from '@components/common/creative/tooltipStyles';
import { IMAGE_ACCEPT_FORMATS, MAX_IMAGE_SIZE } from '@constants/fileUpload';
import { TranslationNamespace } from '@constants/localization';
import { useAuthenticatedUser } from '@hooks/useAuthenticatedUser';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import {
  type AdCreativeAssetSource,
  batchRegisterAdCreativeAssets,
} from '@services/ads/adCreativeAssetService';
import { useThumbnailStore } from '@stores/thumbnailStoreProvider';
import type { AspectRatioValidation } from '@type/fileUpload';
import { OnFileUpload } from '@utils/fileUpload';

// Row lifecycle: staged (file picked, no network) → uploading (OnFileUpload
// in flight) → failed (asset-registry or batch-register error, retry available)
// or complete (asset-registry + batchRegisterAdCreativeAssets both succeeded).
type CreativeUploadEntryStatus = 'staged' | 'uploading' | 'failed' | 'complete';

export interface CreativeUploadPersistedEntry {
  assetId?: number;
  file: File;
  id: string;
  status: CreativeUploadEntryStatus;
}

interface UploadEntry {
  assetId?: number;
  /**
   * Per-row failure reason from `OnFileUploadError`, surfaced inline
   * under the filename. Populated only for `status === 'failed'` and
   * cleared on retry.
   */
  errorMessage?: string;
  file: File;
  id: string;
  previewUrl: string;
  status: CreativeUploadEntryStatus;
}

const STATUS_LABEL_KEY: Record<CreativeUploadEntryStatus, string> = {
  complete: 'Description.UploadComplete',
  failed: 'Description.UploadFailed',
  staged: 'Description.FileReadyToUpload',
  uploading: 'Description.UploadInProgress',
};

const toPersistedEntry = ({
  assetId,
  file,
  id,
  status,
}: UploadEntry): CreativeUploadPersistedEntry => ({
  assetId,
  file,
  id,
  status,
});

const toUploadEntry = ({
  assetId,
  file,
  id,
  status,
}: CreativeUploadPersistedEntry): UploadEntry => ({
  assetId,
  file,
  id,
  previewUrl: URL.createObjectURL(file),
  status,
});

// Defensive cap so raw filesystem names don't exceed the Assets Registry
// displayName bound (server is length-limited + text-moderated).
const MAX_ASSET_DISPLAY_NAME_LENGTH = 50;

// JPEG/PNG only — what the underlying OnFileUpload utility supports. Browsers
// map `.jpg` to `image/jpeg`, so the non-standard `image/jpg` MIME isn't worth
// accepting. TODO(ADS-10744): add video when OnFileUpload supports it.
const isSupportedUploadFile = (file: File): boolean =>
  file.type === 'image/png' || file.type === 'image/jpeg';

// Only image assets are supported today (see isSupportedUploadFile);
// shared by every batchRegisterAdCreativeAssets call below.
const UPLOAD_ASSET_TYPE = 'AD_ASSET_TYPE_IMAGE' as const;

const deriveAssetDisplayName = (file: File): string | undefined => {
  const dotIndex = file.name.lastIndexOf('.');
  const withoutExtension = dotIndex > 0 ? file.name.substring(0, dotIndex) : file.name;
  const trimmed = withoutExtension.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  return trimmed.slice(0, MAX_ASSET_DISPLAY_NAME_LENGTH);
};

interface RegisteredAsset {
  assetId: number;
  file: File;
}

export interface CreativeUploadFooterActions {
  canUpload: boolean;
  isRegistering: boolean;
  isSelectMediaAtCap: boolean;
  onSelectMedia: () => void;
  onUpload: () => void;
  primaryActionLabelKey: 'Action.AddAssets' | 'Action.AddCreatives' | 'Action.Upload';
  shouldDisableSelectMedia: boolean;
}

interface SelectMediaButtonProps {
  isAtCap: boolean;
  isDisabled: boolean;
  onClick: () => void;
  size?: 'Medium' | 'Small';
}

const SelectMediaButton: FC<SelectMediaButtonProps> = ({
  isAtCap,
  isDisabled,
  onClick,
  size = 'Medium',
}) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.CreativeLibrary);
  const button = (
    <Button
      className={
        size === 'Medium' ? 'min-width-[176px] padding-x-large padding-y-medium' : undefined
      }
      isDisabled={isDisabled}
      onClick={onClick}
      size={size}
      variant='Standard'>
      {translate('Action.SelectMedia')}
    </Button>
  );
  if (isAtCap) {
    return (
      <Tooltip
        contentClassName={FOUNDATION_TOOLTIP_BODY_SMALL_CLASS}
        position='top-center'
        title={translate('Description.CreativeLimitReachedTooltip')}>
        <TooltipTrigger asChild>
          <span className='flex'>{button}</span>
        </TooltipTrigger>
      </Tooltip>
    );
  }
  return button;
};

export const CreativeUploadFooterActionsContent: FC<{
  actions: CreativeUploadFooterActions;
}> = ({ actions }) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.CreativeLibrary);
  return (
    <Button
      isDisabled={!actions.canUpload}
      isLoading={actions.isRegistering}
      onClick={actions.onUpload}
      size='Medium'
      variant='Emphasis'>
      {translate(actions.primaryActionLabelKey)}
    </Button>
  );
};

interface CreativeUploadTabProps {
  /**
   * Optional aspect-ratio gate. When provided, every staged file's
   * dimensions are checked against the allowed ratios on Upload click
   * (logos: 1:1 / 3:1). Failing rows flip to `failed` with the
   * validator's error message inline beneath the filename, so the user
   * can correct the file before retrying. Thumbnails leave this
   * undefined since the placement crops with `object-fit: cover`.
   */
  aspectRatioValidation?: AspectRatioValidation;
  /** `AD_CREATIVE_ASSET_SOURCE_UPLOAD` for Library page, `_CAMPAIGN` for builder. */
  assetSource: AdCreativeAssetSource;
  /** When true, selecting files immediately uploads/registers them. */
  autoUploadOnSelect?: boolean;
  /** Optional banner above the table (e.g. campaign-builder FeedbackBanner). */
  banner?: ReactNode;
  /** Footer add-action label for deferred registration flows. */
  deferredAddActionLabelKey?: 'Action.AddAssets' | 'Action.AddCreatives';
  /**
   * When true (campaign upload tab), successful upload/register rows stay
   * pending until the user confirms via Add creatives. `registerOnAdd`
   * forces this on, so the Library page doesn't set it directly.
   */
  deferRegisteredUntilAdd?: boolean;
  /**
   * Count of selections outside this tab (committed form selections +
   * sibling-tab pending toggles). Folded into the "(X / max)" header and
   * picker cap so both the import tab and this tab share a single total.
   * Defaults to 0 for the standalone Library page (which has no sibling
   * tab to coordinate with).
   */
  externalCommittedCount?: number;
  /** Optional Game dropdown above the table (Library page only). */
  gameDropdown?: ReactNode;
  /** Group workspace id for creative-library registrations. Omit for user account scope. */
  groupId?: number;
  /** When true, emits campaign creative source analytics for uploads. */
  isCampaignCreativeSource?: boolean;
  /** External disable for Select media (e.g. parent's max-selected reached). */
  isSelectMediaDisabled?: boolean;
  /** Picker silently truncates extras past this. Omit for no cap. */
  maxFiles?: number;
  /** Fires true on Upload click, false after every row settles. */
  onBatchInProgressChange?: (inProgress: boolean) => void;
  /**
   * Optional footer action bridge for sheet wrappers that render Upload /
   * Select media in a sticky footer instead of in-tab headers.
   */
  onFooterActionsChange?: (actions: CreativeUploadFooterActions | null) => void;
  /**
   * Row-state updates for parent persistence. Fires on every entry change
   * and on unmount; keep cheap or memoize.
   */
  onPersistedEntriesChange?: (entries: CreativeUploadPersistedEntry[]) => void;
  /** Called after library registration succeeds. */
  onRegistered: (registered: RegisteredAsset[]) => void;
  /** Called when a trashed row had a registered asset id. */
  onRemoveUploadedAsset?: (assetId: number) => void;
  /** Parent-managed row persistence across remounts. */
  persistedEntries?: CreativeUploadPersistedEntry[];
  /**
   * When true (Library page), the asset-registry upload still runs on
   * select, but the library registration (`batchRegisterAdCreativeAssets`)
   * is deferred until the user clicks Add assets. This prevents assets from
   * landing in the library when the user picks files and then closes the
   * drawer without confirming. This is a strict superset of
   * `deferRegisteredUntilAdd` (which it forces on), so callers set only one
   * of the two — never both.
   */
  registerOnAdd?: boolean;
  /** Universe to tag every registration with (campaign-builder only). */
  universeId?: number;
}

// Shared Upload-tab body for the Add Creatives drawer. Implements Figma's
// "Media table" pattern: header with Select media + Upload buttons, body
// with empty state or staged file rows.
const CreativeUploadTab: FC<CreativeUploadTabProps> = ({
  aspectRatioValidation,
  assetSource,
  autoUploadOnSelect = false,
  banner,
  deferredAddActionLabelKey = 'Action.AddCreatives',
  deferRegisteredUntilAdd: deferRegisteredUntilAddProp = false,
  externalCommittedCount = 0,
  gameDropdown,
  groupId,
  isCampaignCreativeSource = false,
  isSelectMediaDisabled = false,
  maxFiles,
  onBatchInProgressChange,
  onFooterActionsChange,
  onPersistedEntriesChange,
  onRegistered,
  onRemoveUploadedAsset,
  persistedEntries = [],
  registerOnAdd = false,
  universeId,
}) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.CreativeLibrary);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const authenticatedUser = useAuthenticatedUser();
  const setBlobByAssetId = useThumbnailStore((state) => state.setBlobByAssetId);

  // `registerOnAdd` is a strict superset of `deferRegisteredUntilAdd`: it
  // additionally withholds the library registration call until Add. Derive
  // the deferral here so the two can never be misconfigured independently
  // (e.g. registerOnAdd without the deferral that hides the footer button).
  const deferRegisteredUntilAdd = deferRegisteredUntilAddProp || registerOnAdd;

  const [entries, setEntries] = useState<UploadEntry[]>(() => persistedEntries.map(toUploadEntry));
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registerError, setRegisterError] = useState<string>('');
  const [pickerError, setPickerError] = useState<string>('');
  const [committedCompleteEntryIds, setCommittedCompleteEntryIds] = useState<Set<string>>(
    () => new Set(),
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Per-entry cancel callbacks from OnFileUpload, used by the unmount cleanup.
  const cancelByEntryIdRef = useRef<Record<string, () => void>>({});
  // Mirror of `entries` so the unmount cleanup can revoke object URLs without
  // re-running on every state change.
  const entriesRef = useRef<UploadEntry[]>([]);
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);
  useEffect(() => {
    onPersistedEntriesChange?.(entries.map(toPersistedEntry));
  }, [entries, onPersistedEntriesChange]);

  const updateEntry = useCallback((id: string, patch: Partial<UploadEntry>) => {
    setEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }, []);

  // Single asset-registry upload that resolves on success OR failure so
  // runUploadBatch can Promise.all a batch and only batch-register the
  // successful rows.
  const startUpload = useCallback(
    (entryId: string, file: File): Promise<{ assetId: number; ok: true } | { ok: false }> =>
      new Promise((resolve) => {
        OnFileUpload({
          aspectRatioValidation,
          authenticatedUser,
          displayName: deriveAssetDisplayName(file),
          id: entryId,
          image: file,
          OnFileUploadError: (id, errorMessage) => {
            delete cancelByEntryIdRef.current[id];
            updateEntry(id, { errorMessage, status: 'failed' });
            resolve({ ok: false });
          },
          setCancelImageUpload: (id, cancel) => {
            // Cancel only stops polling — it never invokes OnFileUploadError,
            // so resolve here too or runUploadBatch's Promise.all (and the
            // finally that releases the publish-blocking flag) never settles.
            cancelByEntryIdRef.current[id] = () => {
              delete cancelByEntryIdRef.current[id];
              cancel();
              resolve({ ok: false });
            };
          },
          // No-op: runUploadBatch flips rows to 'uploading' before startUpload runs.
          setImageUploading: () => {},
          setUploadedImage: ({ assetId, blob }) => {
            delete cancelByEntryIdRef.current[entryId];
            // Seed the thumbnail store so library grids / campaign previews
            // can show the new asset without a follow-up fetch.
            setBlobByAssetId(assetId, blob);
            updateEntry(entryId, { assetId });
            resolve({ assetId, ok: true });
          },
        });
      }),
    [aspectRatioValidation, authenticatedUser, setBlobByAssetId, updateEntry],
  );

  const enqueueFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) {
        return;
      }
      const supportedFiles = files.filter(isSupportedUploadFile);
      const rejectedCount = files.length - supportedFiles.length;
      // Per-tab cap measured against the shared "selected/max" total:
      // committed form selections + sibling-tab pendings + this tab's
      // non-complete rows. Complete rows are already counted in
      // `externalCommittedCount` (added to the form via `onRegistered`),
      // so counting them here too would double-bill and starve the
      // remaining slots. `entriesRef` is one render stale on rapid picks;
      // worst case is one extra row past the cap, re-enforced on the
      // next pick.
      let acceptedFiles = supportedFiles;
      let truncatedAtCap = false;
      if (maxFiles != null) {
        const nonCompleteCount = entriesRef.current.filter(
          (entry) => entry.status !== 'complete',
        ).length;
        const remaining = Math.max(0, maxFiles - externalCommittedCount - nonCompleteCount);
        if (supportedFiles.length > remaining) {
          truncatedAtCap = true;
          acceptedFiles = supportedFiles.slice(0, remaining);
        }
      }
      // Prefer the unsupported-type message when both apply; once the user
      // fixes the file types the cap message will resurface on the next pick.
      if (rejectedCount > 0) {
        // Format list (.jpg / .png) lives in the localized string itself;
        // see Message.UnsupportedFileType in the CSV for why.
        setPickerError(translate('Message.UnsupportedFileType'));
      } else if (truncatedAtCap && maxFiles != null) {
        setPickerError(translate('Message.MaxFilesReached', { max: String(maxFiles) }));
      } else {
        setPickerError('');
      }
      if (acceptedFiles.length === 0) {
        return;
      }
      // Picking only stages — Upload click triggers the asset-registry call.
      const newEntries: UploadEntry[] = acceptedFiles.map((file) => ({
        file,
        id: uuidv4(),
        previewUrl: URL.createObjectURL(file),
        status: 'staged' as const,
      }));
      // Surface freshly-picked files at the top so the newest upload intent is
      // immediately visible without scrolling.
      setEntries((prev) => [...newEntries, ...prev]);
    },
    [externalCommittedCount, maxFiles, translate],
  );

  const handleSelectMedia = useCallback(() => {
    const hasReachedFileCap =
      maxFiles != null &&
      externalCommittedCount +
        entriesRef.current.filter((entry) => entry.status !== 'complete').length >=
        maxFiles;
    if (isSelectMediaDisabled || hasReachedFileCap) {
      return;
    }
    fileInputRef.current?.click();
  }, [externalCommittedCount, isSelectMediaDisabled, maxFiles]);

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    enqueueFiles(files);
    if (fileInputRef.current) {
      // Reset so picking the same file twice in a row still fires onChange.
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveEntry = (id: string) => {
    setEntries((prev) => {
      const removed = prev.find((entry) => entry.id === id);
      // `assetId` is only set after registry success, so the parent form
      // already knows about this row — no race against a still-in-flight add.
      if (removed?.assetId != null) {
        onRemoveUploadedAsset?.(removed.assetId);
      }
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((entry) => entry.id !== id);
    });
    setCommittedCompleteEntryIds((prev) => {
      if (!prev.has(id)) {
        return prev;
      }
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Cancels in-flight uploads and revokes preview URLs on unmount. Demotes
  // `uploading` rows to `staged` (the cancel aborts the upload) so they're
  // retryable after the drawer reopens.
  useEffect(
    () => () => {
      onPersistedEntriesChange?.(
        entriesRef.current.map((entry) => ({
          ...toPersistedEntry(entry),
          status: entry.status === 'uploading' ? 'staged' : entry.status,
        })),
      );
      Object.values(cancelByEntryIdRef.current).forEach((cancel) => cancel());
      cancelByEntryIdRef.current = {};
      entriesRef.current.forEach((entry) => {
        if (entry.previewUrl) {
          URL.revokeObjectURL(entry.previewUrl);
        }
      });
      entriesRef.current = [];
    },
    [onPersistedEntriesChange],
  );

  const counts = useMemo(() => {
    let uploading = 0;
    let staged = 0;
    entries.forEach((entry) => {
      if (entry.status === 'uploading') {
        uploading += 1;
      } else if (entry.status === 'staged') {
        staged += 1;
      }
    });
    return { staged, uploading };
  }, [entries]);

  // Upload requires staged rows and nothing in flight, so a second click
  // can't race the in-progress batch.
  const canUpload = counts.staged > 0 && counts.uploading === 0 && !isRegistering;
  // Non-complete entries count toward the shared "selected/max" total
  // (complete entries are already included in externalCommittedCount via
  // the form, so counting them here would double-bill).
  const nonCompleteEntriesCount = entries.filter((entry) => entry.status !== 'complete').length;
  const unifiedSelectedCount = externalCommittedCount + nonCompleteEntriesCount;
  const isSelectMediaAtCap = maxFiles != null && unifiedSelectedCount >= maxFiles;
  // Lock the picker while any row is uploading or registering so the user
  // can't enqueue more files mid-batch (which would race the in-flight
  // upload/register pipeline and the shared selected/max count).
  const isUploadInProgress = counts.uploading > 0 || isRegistering;
  const shouldDisableSelectMedia =
    isSelectMediaDisabled || isSelectMediaAtCap || isUploadInProgress;
  const shouldRenderInFooter = onFooterActionsChange != null;
  const hasEntries = entries.length > 0;

  // Uploads a set of staged rows in parallel then batch-registers the
  // successful ones. Used by both the Upload button and per-row retry.
  const runUploadBatch = async (rowsToUpload: UploadEntry[]) => {
    if (rowsToUpload.length === 0) {
      return;
    }
    setRegisterError('');
    onBatchInProgressChange?.(true);
    try {
      // Flip to 'uploading' synchronously so spinners appear before any
      // network traffic and a second click can't re-pick the same rows.
      // Clearing errorMessage on the flip hides the stale reason during
      // retry.
      const targetIds = new Set(rowsToUpload.map((entry) => entry.id));
      setEntries((prev) =>
        prev.map((entry) =>
          targetIds.has(entry.id)
            ? {
                ...entry,
                assetId: undefined,
                errorMessage: undefined,
                status: 'uploading' as const,
              }
            : entry,
        ),
      );
      // Parallel uploads. Each promise resolves regardless of outcome
      // (failures already flipped their row to 'failed' inside startUpload).
      const uploadResults = await Promise.all(
        rowsToUpload.map(async (entry) => ({
          entry,
          result: await startUpload(entry.id, entry.file),
        })),
      );
      const succeeded = uploadResults
        .filter(
          (item): item is { entry: UploadEntry; result: { assetId: number; ok: true } } =>
            item.result.ok,
        )
        .map(({ entry, result }) => ({ ...entry, assetId: result.assetId }));
      if (succeeded.length === 0) {
        return;
      }
      // Library page: defer the library registration until the user clicks
      // Add assets. The registry upload is done, so mark the rows complete
      // (ready to add) but don't persist them to the library yet — closing
      // the drawer here must NOT leave the asset in the library.
      if (registerOnAdd) {
        const uploadedIds = new Set(succeeded.map((entry) => entry.id));
        setEntries((prev) =>
          prev.map((entry) =>
            uploadedIds.has(entry.id) ? { ...entry, status: 'complete' as const } : entry,
          ),
        );
        return;
      }
      // Only register rows whose asset upload succeeded; failed rows can
      // be retried individually from their row affordance.
      setIsRegistering(true);
      try {
        const assetsToRegister = succeeded.map((entry) => ({
          assetId: entry.assetId,
          assetType: UPLOAD_ASSET_TYPE,
          file: entry.file,
          source: assetSource,
          // `0` is the "no experience selected" sentinel — drop it so
          // the request goes out untagged instead of being rejected
          // upstream as `UNIVERSE_NOT_FOUND: universe 0 not found`.
          ...(universeId != null && universeId > 0 && { universeId }),
        }));
        await (groupId === undefined
          ? batchRegisterAdCreativeAssets(assetsToRegister)
          : batchRegisterAdCreativeAssets(assetsToRegister, { groupId }));
        const completedIds = new Set(succeeded.map((entry) => entry.id));
        setEntries((prev) =>
          prev.map((entry) =>
            completedIds.has(entry.id) ? { ...entry, status: 'complete' as const } : entry,
          ),
        );
        if (!deferRegisteredUntilAdd) {
          onRegistered(succeeded.map((entry) => ({ assetId: entry.assetId, file: entry.file })));
        }
      } catch {
        // Registry upload succeeded, batch-register rejected — flip to
        // 'failed' so the per-row retry button lights up. Retry re-runs
        // the full pipeline (registry dedupes server-side).
        const failedIds = new Set(succeeded.map((entry) => entry.id));
        setEntries((prev) =>
          prev.map((entry) =>
            failedIds.has(entry.id) ? { ...entry, status: 'failed' as const } : entry,
          ),
        );
        // TODO(ADS-XXXXX): surface per-asset failure reason once backend
        // exposes it (duplicate name, moderation hold, etc.).
        setRegisterError(translateMisc('Message.GenericError'));
      } finally {
        setIsRegistering(false);
      }
    } finally {
      onBatchInProgressChange?.(false);
    }
  };

  const runUploadBatchRef = useRef(runUploadBatch);
  runUploadBatchRef.current = runUploadBatch;

  // Upload-flow variant: selecting media immediately executes the upload +
  // library-registration pipeline (no separate Add click required).
  useEffect(() => {
    if (!autoUploadOnSelect || isUploadInProgress) {
      return;
    }
    const stagedEntries = entries.filter((entry) => entry.status === 'staged');
    if (stagedEntries.length === 0) {
      return;
    }
    runUploadBatchRef.current(stagedEntries);
  }, [autoUploadOnSelect, entries, isUploadInProgress]);

  const handleUpload = useCallback(() => {
    const stagedEntries = entriesRef.current.filter((entry) => entry.status === 'staged');
    if (isCampaignCreativeSource && stagedEntries.length > 0) {
      logNativeClickEvent(EventName.CampaignCreativeSourceSelected, {
        source: 'upload',
      });
    }
    runUploadBatchRef.current(stagedEntries);
  }, [isCampaignCreativeSource]);

  useEffect(() => {
    if (!onFooterActionsChange) {
      return;
    }
    if (autoUploadOnSelect && !deferRegisteredUntilAdd) {
      onFooterActionsChange(null);
      return;
    }
    const uncommittedCompleteEntries = entries.filter(
      (entry) =>
        entry.status === 'complete' &&
        entry.assetId != null &&
        !committedCompleteEntryIds.has(entry.id),
    );
    const canAddCreatives =
      uncommittedCompleteEntries.length > 0 && !isRegistering && counts.uploading === 0;
    const commitAddedEntries = () => {
      setCommittedCompleteEntryIds((prev) => {
        const next = new Set(prev);
        uncommittedCompleteEntries.forEach((entry) => next.add(entry.id));
        return next;
      });
    };
    const handleAddCreatives = async () => {
      if (uncommittedCompleteEntries.length === 0) {
        return;
      }
      if (isCampaignCreativeSource) {
        logNativeClickEvent(EventName.CampaignCreativeSourceSelected, {
          source: 'upload',
        });
      }
      // Library page: the registry upload already ran on select, but the
      // library registration was deferred to this click so picking files
      // and closing the drawer never persists an asset. Register now, then
      // hand off to onRegistered (cache invalidation + close).
      if (registerOnAdd) {
        setRegisterError('');
        setIsRegistering(true);
        try {
          const assetsToRegister = uncommittedCompleteEntries.map((entry) => ({
            assetId: entry.assetId as number,
            assetType: UPLOAD_ASSET_TYPE,
            file: entry.file,
            source: assetSource,
            ...(universeId != null && universeId > 0 && { universeId }),
          }));
          await (groupId === undefined
            ? batchRegisterAdCreativeAssets(assetsToRegister)
            : batchRegisterAdCreativeAssets(assetsToRegister, { groupId }));
        } catch {
          setRegisterError(translateMisc('Message.GenericError'));
          return;
        } finally {
          setIsRegistering(false);
        }
      }
      onRegistered(
        uncommittedCompleteEntries.map((entry) => ({
          assetId: entry.assetId as number,
          file: entry.file,
        })),
      );
      commitAddedEntries();
    };
    onFooterActionsChange({
      canUpload: autoUploadOnSelect ? canAddCreatives : canUpload,
      isRegistering,
      isSelectMediaAtCap,
      onSelectMedia: handleSelectMedia,
      onUpload: autoUploadOnSelect ? handleAddCreatives : handleUpload,
      primaryActionLabelKey:
        autoUploadOnSelect || deferRegisteredUntilAdd ? deferredAddActionLabelKey : 'Action.Upload',
      shouldDisableSelectMedia,
    });
  }, [
    entries,
    committedCompleteEntryIds,
    counts.uploading,
    canUpload,
    handleSelectMedia,
    handleUpload,
    autoUploadOnSelect,
    deferredAddActionLabelKey,
    deferRegisteredUntilAdd,
    registerOnAdd,
    assetSource,
    universeId,
    groupId,
    translateMisc,
    isCampaignCreativeSource,
    isRegistering,
    isSelectMediaAtCap,
    onRegistered,
    onFooterActionsChange,
    shouldDisableSelectMedia,
  ]);

  useEffect(
    () => () => {
      onFooterActionsChange?.(null);
    },
    [onFooterActionsChange],
  );

  const handleRetry = (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry) {
      return;
    }
    // Reuse runUploadBatch so retry runs the full pipeline (including
    // batch-register), preventing orphaned uploaded-but-unregistered assets.
    runUploadBatch([entry]);
  };

  // Per Figma 17433:52130: failed row gets [retry, trash], all others get
  // [trash]. The in-flight spinner sits in the same trailing column so the
  // trash slot stays locked while the upload runs and the row layout doesn't
  // jump between states. Status indicators (red X / green check) live inline
  // below the filename, not in this column.
  const renderRowActions = (entry: UploadEntry) => {
    const trash = (
      <IconButton
        ariaLabel={translate('Label.RemoveFile')}
        icon='icon-regular-trash-can'
        isCircular
        isDisabled={entry.status === 'uploading'}
        onClick={() => handleRemoveEntry(entry.id)}
        size='Medium'
        variant='Utility'
      />
    );
    if (entry.status === 'uploading') {
      return (
        <div className='flex items-center gap-medium'>
          <ProgressCircle
            ariaLabel={translate('Description.UploadInProgress')}
            size='Small'
            variant='Indeterminate'
          />
          {trash}
        </div>
      );
    }
    if (entry.status === 'failed') {
      return (
        <div className='flex items-center gap-medium'>
          <IconButton
            ariaLabel={translate('Label.RetryUpload')}
            icon='icon-regular-arrow-spin-counter-clockwise'
            isCircular
            onClick={() => handleRetry(entry.id)}
            size='Medium'
            variant='Utility'
          />
          {trash}
        </div>
      );
    }
    return trash;
  };

  const renderStatusLine = (entry: UploadEntry) => {
    const label = translate(STATUS_LABEL_KEY[entry.status]);
    if (entry.status === 'uploading') {
      // The spinner lives in the trailing action column; only the label
      // appears here so the status row stays single-line and aligned with
      // the failed/complete states.
      return <p className='text-body-small content-default margin-[0px]'>{label}</p>;
    }
    if (entry.status === 'failed') {
      // Prefer the per-row reason; fall back to the generic label for
      // failure paths that didn't pass one through.
      return (
        <div className='flex items-center gap-xsmall'>
          <Icon className='content-system-alert' name='icon-regular-circle-x' size='Small' />
          <p className='text-body-small content-default margin-[0px]'>
            {entry.errorMessage ?? label}
          </p>
        </div>
      );
    }
    if (entry.status === 'complete') {
      return (
        <div className='flex items-center gap-xsmall'>
          <Icon className='content-system-success' name='icon-regular-circle-check' size='Small' />
          <p className='text-body-small content-default margin-[0px]'>{label}</p>
        </div>
      );
    }
    return <p className='text-body-small content-default margin-[0px]'>{label}</p>;
  };

  const renderRowThumbnail = (entry: UploadEntry) => {
    if (entry.previewUrl) {
      // Foundation's <Media> aspect-ratio collapses to 0px height inside
      // a flex row, so use a fixed-size <img>.
      return (
        <img
          alt={translate('Label.UploadFilePreview')}
          className={`${styles.rowThumbnail} radius-small shrink-0`}
          height={40}
          src={entry.previewUrl}
          width={72}
        />
      );
    }
    return (
      <div
        aria-label={translate('Label.UploadFilePreview')}
        className='width-[72px] height-[40px] radius-small bg-surface-200 flex items-center justify-center shrink-0'
        role='img'>
        <Icon name='icon-regular-arrow-up-from-line' size='Small' />
      </div>
    );
  };

  const renderEntryRow = (entry: UploadEntry) => (
    <div className='flex items-center gap-medium padding-y-large width-full'>
      {renderRowThumbnail(entry)}
      {/* min-width-[0px] lets the truncating filename actually shrink. */}
      <div className='flex flex-col flex-1 min-width-[0px] gap-xsmall'>
        <p className='text-body-large content-default text-truncate-end margin-[0px]'>
          {entry.file.name}
        </p>
        {renderStatusLine(entry)}
      </div>
      <div className='shrink-0 margin-left-auto'>{renderRowActions(entry)}</div>
    </div>
  );

  const renderTableBody = () => {
    if (entries.length === 0) {
      return (
        <div
          className='flex flex-col items-center justify-center gap-large padding-y-xxlarge width-full min-height-[240px]'
          data-testid='creative-upload-empty-state'>
          {/* Tilted square outline behind a books icon, mirrors CreativeLibrary's
              empty state. Icon overridden past Foundation's XLarge cap to ~72px. */}
          <div className='relative flex items-center justify-center width-[122px] height-[122px]'>
            <div
              aria-hidden
              className={`${styles.emptyStateTiltFrame} absolute width-[100px] height-[100px] radius-medium stroke-muted stroke-standard`}
            />
            <Icon className='!size-[72px]' name='icon-regular-square-books' size='XLarge' />
          </div>
          <div className='flex flex-col items-center gap-xsmall'>
            <p className='text-heading-medium content-default text-align-x-center margin-[0px]'>
              {translate('Heading.AddMedia')}
            </p>
            <div className='padding-y-medium'>
              <SelectMediaButton
                isAtCap={isSelectMediaAtCap}
                isDisabled={shouldDisableSelectMedia}
                onClick={handleSelectMedia}
              />
            </div>
            <p className='text-body-medium content-muted text-align-x-center margin-[0px]'>
              {translate('Description.SupportedImageFormats')}
            </p>
            <p className='text-body-medium content-muted text-align-x-center margin-[0px]'>
              {translate('Description.MaxFileSizeImage', {
                maxMb: String(Math.floor(MAX_IMAGE_SIZE / (1024 * 1024))),
              })}
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className='flex flex-col'>
        {entries.map((entry) => (
          <div key={entry.id}>
            {renderEntryRow(entry)}
            <Divider />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className='flex flex-col gap-large'>
      {banner}
      {gameDropdown}
      <div className='flex flex-col width-full'>
        <div className='flex items-center justify-between padding-y-medium gap-medium width-full'>
          <p className='text-label-medium content-emphasis margin-[0px]'>
            {maxFiles != null
              ? translate('Label.MediaWithCount', {
                  max: String(maxFiles),
                  selected: String(unifiedSelectedCount),
                })
              : translate('Label.Media')}
          </p>
          <div className='flex items-center gap-small'>
            {hasEntries ? (
              <SelectMediaButton
                isAtCap={isSelectMediaAtCap}
                isDisabled={shouldDisableSelectMedia}
                onClick={handleSelectMedia}
                size='Small'
              />
            ) : null}
            {!shouldRenderInFooter && !autoUploadOnSelect && hasEntries ? (
              <Button
                isDisabled={!canUpload}
                isLoading={isRegistering}
                onClick={handleUpload}
                size='Small'
                variant='Emphasis'>
                {translate('Action.AddCreatives')}
              </Button>
            ) : null}
          </div>
        </div>
        <Divider />
        {renderTableBody()}
        <input
          accept={IMAGE_ACCEPT_FORMATS}
          aria-hidden
          className='hidden'
          data-testid='creative-upload-file-input'
          multiple={maxFiles == null || maxFiles > 1}
          onChange={handleFileInputChange}
          ref={fileInputRef}
          tabIndex={-1}
          type='file'
        />
      </div>
      {pickerError ? (
        <p className='text-body-medium content-system-alert margin-[0px]' role='alert'>
          {pickerError}
        </p>
      ) : null}
      {registerError ? (
        <p className='text-body-medium content-system-alert margin-[0px]' role='alert'>
          {registerError}
        </p>
      ) : null}
    </div>
  );
};

export default CreativeUploadTab;
