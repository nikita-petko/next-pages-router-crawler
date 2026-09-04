import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { AssetType } from '@rbx/client-assets-upload-api/v1';
import type { Asset as AssetUploadRequest, Creator } from '@rbx/client-assets-upload-api/v1';
import { V1ItemsUploadFeeGetAssetTypeEnum } from '@rbx/client-itemconfiguration/v1';
import { maxFileSizeMB } from '@modules/asset-creation/constants/AssetTypeConstants';
import { useAuthentication } from '@modules/authentication/providers';
import assetsUploadApiClient from '@modules/clients/assetsupload';
import { pollForCompletedOperation } from '@modules/clients/assetsUploadPolling';
import economyClient from '@modules/clients/economy';
import itemconfigurationClient from '@modules/clients/itemconfiguration';
import Asset from '@modules/miscellaneous/common/enums/Asset';
import {
  clearPersistedImportQueue,
  createRestoredImportFile,
  findPersistedImportFile,
  loadPersistedImportQueue,
  persistImportQueue,
  type ImportQueuePersistenceOwner,
} from './importQueuePersistence';

// --- File type definitions ---

export type OwnerType = 'users' | 'groups';

export interface InventoryScope {
  ownerType: OwnerType;
  ownerId: number;
  ownerName: string;
  groupId?: number;
}

export type ImportableFileType = 'image' | 'audio' | 'video' | 'unknown';

export type ImportFileError =
  | 'missing_creator_scope'
  | 'unsupported_asset_type'
  | 'missing_asset_id'
  | 'unsupported_file_type'
  | 'file_too_large'
  | 'empty_file'
  | 'upload_failed';

export interface ImportFileErrorParameters {
  extension?: string;
  fileSizeMB?: number;
  maxFileSizeMB?: number;
}

export type ImportFileStatus =
  | 'queued'
  | 'invalid'
  | 'ready'
  | 'importing'
  | 'processing'
  | 'uploaded'
  | 'moderation_pending'
  | 'approved'
  | 'failed';

export type ImportBatchStatus =
  | 'empty'
  | 'has_invalid'
  | 'ready'
  | 'importing'
  | 'complete_success'
  | 'complete_partial'
  | 'complete_failed';

export interface ImportFile {
  id: string;
  file: File;
  fileName: string;
  displayName: string;
  fileSize: number;
  fileType: ImportableFileType;
  extension: string;
  status: ImportFileStatus;
  errorType?: ImportFileError;
  errorParameters?: ImportFileErrorParameters;
  progress?: number;
  targetCreator?: InventoryScope;
  settings?: ImportFileSettings;
  assetId?: number;
  operationId?: string;
  multipartAbortable?: boolean;
  processingStartedAt?: number;
  pendingDescription?: string;
  restoredFromPersistence?: boolean;
}

export interface ImportFileSettings {
  costConfirmed?: boolean;
}

export interface ImportValidationResult {
  valid: boolean;
  errorType?: ImportFileError;
  errorParameters?: ImportFileErrorParameters;
}

export interface UploadFeeInfo {
  price: number;
  isAvailable: boolean;
  canAfford: boolean | null;
}

export interface LastImportStats {
  completed: number;
  failed: number;
}

export interface ImportProgress {
  completed: number;
  total: number;
}

// --- Constants ---

export const SUPPORTED_EXTENSIONS: Record<ImportableFileType, string[]> = {
  image: ['.png', '.jpg', '.jpeg', '.tga', '.bmp'],
  audio: ['.ogg', '.mp3', '.flac', '.wav'],
  video: ['.mp4', '.mov'],
  unknown: [],
};

const FILE_TYPE_TO_ASSET_TYPE: Record<ImportableFileType, AssetType | null> = {
  image: AssetType.Decal,
  audio: AssetType.Audio,
  video: AssetType.Video,
  unknown: null,
};

// Audio uploads carry no Robux fee: audio is absent from purchasableAssetTypes and the
// marketplace upload-fee endpoint rejects it (400 for assetType=3).
const ASSET_TYPE_FOR_FEE: Record<ImportableFileType, string | null> = {
  audio: null,
  video: 'Video',
  image: null,
  unknown: null,
};

const MAX_BATCH_SIZE = 50;
// Assets Upload API display names accept at most 50 characters.
const MAX_ASSET_NAME_LENGTH = 50;
// Content platform multipart uploads use 5 MB chunks.
const MULTIPART_UPLOAD_THRESHOLD_BYTES = 5 * 1024 * 1024;
const VIDEO_UPLOAD_FEE_FALLBACK = 2000;
const PERSIST_QUEUE_DEBOUNCE_MS = 250;
const PROCESSING_POLL_INITIAL_DELAY_MS = 1000;
const PROCESSING_POLL_MAX_DELAY_MS = 30_000;
const PROCESSING_POLL_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const IMPORT_FILE_OWNERSHIP_LOCK_PREFIX = 'creator-hub.bulk-import.ownership';

export const IMPORT_LIMITS = {
  maxBatchSize: MAX_BATCH_SIZE,
};

// --- Utilities ---

function getFileExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  return idx >= 0 ? fileName.slice(idx).toLowerCase() : '';
}

function classifyFileType(extension: string): ImportableFileType {
  const fileTypes: ImportableFileType[] = ['image', 'audio', 'video'];
  for (const type of fileTypes) {
    if (SUPPORTED_EXTENSIONS[type].includes(extension)) {
      return type;
    }
  }
  return 'unknown';
}

function getMaxFileSizeMB(fileType: Exclude<ImportableFileType, 'unknown'>): number {
  switch (fileType) {
    case 'image':
      return maxFileSizeMB(Asset.Decal);
    case 'audio':
      return maxFileSizeMB(Asset.Audio);
    case 'video':
      return maxFileSizeMB(Asset.Video);
  }
  return 0;
}

function validateFile(
  file: File,
  extension: string,
  fileType: ImportableFileType,
): ImportValidationResult {
  if (fileType === 'unknown') {
    return {
      valid: false,
      errorType: 'unsupported_file_type',
      errorParameters: { extension: extension === '' ? '—' : extension },
    };
  }
  const sizeMB = file.size / (1024 * 1024);
  const fileSizeLimitMB = getMaxFileSizeMB(fileType);
  if (sizeMB > fileSizeLimitMB) {
    return {
      valid: false,
      errorType: 'file_too_large',
      errorParameters: { fileSizeMB: sizeMB, maxFileSizeMB: fileSizeLimitMB },
    };
  }
  if (file.size === 0) {
    return { valid: false, errorType: 'empty_file' };
  }
  return { valid: true };
}

let nextFileId = 1;
function generateFileId(): string {
  return `import-file-${nextFileId++}-${Date.now()}`;
}

function getDisplayNameFromFile(fileName: string): string {
  const dotIdx = fileName.lastIndexOf('.');
  const name = dotIdx > 0 ? fileName.slice(0, dotIdx) : fileName;
  return name.slice(0, MAX_ASSET_NAME_LENGTH);
}

function isAlreadyImported(status: ImportFileStatus): boolean {
  return (
    status === 'processing' ||
    status === 'uploaded' ||
    status === 'moderation_pending' ||
    status === 'approved'
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function getImportFileOwnershipLockName(
  userId: number,
  owner: ImportQueuePersistenceOwner | undefined,
  fileId: string,
): string {
  const ownerType = owner?.ownerType ?? 'users';
  const ownerId = owner?.ownerId ?? userId;
  return `${IMPORT_FILE_OWNERSHIP_LOCK_PREFIX}.${userId}.${ownerType}.${ownerId}.${fileId}`;
}

async function withImportFileOwnership<T>(
  userId: number,
  owner: ImportQueuePersistenceOwner | undefined,
  fileId: string,
  task: () => Promise<T>,
): Promise<T> {
  if (typeof navigator === 'undefined' || navigator.locks == null) {
    return task();
  }
  let taskStarted = false;
  try {
    return await navigator.locks.request(
      getImportFileOwnershipLockName(userId, owner, fileId),
      () => {
        taskStarted = true;
        return task();
      },
    );
  } catch (error) {
    if (!taskStarted) {
      return task();
    }
    throw error;
  }
}

function waitForProcessingPoll(signal: AbortSignal, delayMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
      return;
    }
    const onAbort = () => {
      window.clearTimeout(timeoutId);
      reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
    };
    const timeoutId = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, delayMs);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function requeueImportingFile(file: ImportFile): ImportFile {
  if (file.status !== 'importing') {
    return file;
  }
  return {
    ...file,
    status: 'ready',
    errorType: undefined,
    errorParameters: undefined,
    progress: undefined,
  };
}

function isUnpaidFeeFile(file: ImportFile): boolean {
  return (
    isImportCandidate(file) && file.operationId == null && ASSET_TYPE_FOR_FEE[file.fileType] != null
  );
}

type UploadChargeSession = {
  operationId: string;
  canAbortMultipart: boolean;
  abortPromise?: Promise<boolean>;
};

function settleCanceledImportFile(
  file: ImportFile,
  session: UploadChargeSession | undefined,
  abortSucceeded: boolean,
): ImportFile {
  if (file.status !== 'importing') {
    return file;
  }

  const operationId = session?.operationId ?? file.operationId;
  const canAbortMultipart = session?.canAbortMultipart ?? file.multipartAbortable === true;

  if (operationId == null) {
    return requeueImportingFile(file);
  }

  if (canAbortMultipart) {
    if (abortSucceeded) {
      return {
        ...file,
        status: 'ready',
        operationId: undefined,
        multipartAbortable: undefined,
        processingStartedAt: undefined,
        errorType: undefined,
        errorParameters: undefined,
        progress: undefined,
      };
    }
    return {
      ...file,
      status: 'failed',
      operationId,
      multipartAbortable: true,
      errorType: 'upload_failed',
      progress: undefined,
    };
  }

  return {
    ...file,
    status: 'processing',
    operationId,
    multipartAbortable: false,
    processingStartedAt: Date.now(),
    errorType: undefined,
    errorParameters: undefined,
    progress: 100,
  };
}

function isRetryableFailedImportFile(file: ImportFile): boolean {
  if (file.status !== 'failed') {
    return false;
  }
  const hasFileBytes = file.file.size > 0;
  const hasPollableOperation = file.operationId != null && file.multipartAbortable !== true;
  return hasFileBytes || hasPollableOperation;
}

function isImportCandidate(file: ImportFile): boolean {
  return file.status === 'ready' || isRetryableFailedImportFile(file);
}

function isIgnoredOperatingSystemFile(fileName: string): boolean {
  const normalizedName = fileName.toLowerCase();
  return (
    normalizedName === '.ds_store' ||
    normalizedName === 'thumbs.db' ||
    normalizedName === 'desktop.ini' ||
    normalizedName.startsWith('._')
  );
}

// Recursively read all files from a dropped directory using File System Access API
async function readDirectoryEntries(
  entry: FileSystemDirectoryEntry,
  maxFiles: number,
): Promise<File[]> {
  const files: File[] = [];
  const reader = entry.createReader();

  const readBatch = (): Promise<FileSystemEntry[]> =>
    new Promise((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });

  let batch = await readBatch();
  while (batch.length > 0 && files.length < maxFiles) {
    for (const child of batch) {
      if (files.length >= maxFiles) {
        break;
      }
      if (isFileSystemFileEntry(child)) {
        const file = await new Promise<File>((resolve, reject) => {
          child.file(resolve, reject);
        });
        files.push(file);
      } else if (isFileSystemDirectoryEntry(child)) {
        const subFiles = await readDirectoryEntries(child, maxFiles - files.length);
        files.push(...subFiles);
      }
    }
    if (files.length < maxFiles) {
      batch = await readBatch();
    }
  }
  return files;
}

function isFileSystemFileEntry(entry: FileSystemEntry): entry is FileSystemFileEntry {
  return entry.isFile;
}

function isFileSystemDirectoryEntry(entry: FileSystemEntry): entry is FileSystemDirectoryEntry {
  return entry.isDirectory;
}

export async function resolveDroppedItems(
  dataTransfer: DataTransfer,
  maxFiles = MAX_BATCH_SIZE,
): Promise<File[]> {
  const files: File[] = [];
  const items = Array.from(dataTransfer.items).map((item, index) => ({
    entry: item.webkitGetAsEntry?.() ?? null,
    fallbackFile: item.getAsFile() ?? dataTransfer.files.item(index),
  }));

  for (const { entry, fallbackFile } of items) {
    if (files.length >= maxFiles) {
      break;
    }
    if (entry != null && isFileSystemDirectoryEntry(entry)) {
      const dirFiles = await readDirectoryEntries(entry, maxFiles - files.length);
      files.push(...dirFiles);
    } else if (entry != null && isFileSystemFileEntry(entry)) {
      const file = await new Promise<File>((resolve, reject) => {
        entry.file(resolve, reject);
      });
      files.push(file);
    } else if (fallbackFile != null) {
      files.push(fallbackFile);
    }
  }
  return items.length === 0 ? Array.from(dataTransfer.files).slice(0, maxFiles) : files;
}

// --- Hook ---

export function useImportStore(persistenceOwner?: ImportQueuePersistenceOwner) {
  const { user } = useAuthentication();
  const authenticatedUserId = user?.id ?? 0;
  const queuePersistenceOwner = persistenceOwner;

  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<ImportFile[]>(() =>
    loadPersistedImportQueue(authenticatedUserId, queuePersistenceOwner),
  );
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<ImportableFileType | 'all'>('all');
  const [defaultCreator, setDefaultCreator] = useState<InventoryScope | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [importInProgress, setImportInProgress] = useState(false);
  const [stoppingImport, setStoppingImport] = useState(false);
  const [uploadFees, setUploadFees] = useState<Record<string, UploadFeeInfo>>({});
  const [feePricesLoading, setFeePricesLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [availableRobux, setAvailableRobux] = useState<number | null>(null);
  const [lastImportStats, setLastImportStats] = useState<LastImportStats | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress>({ completed: 0, total: 0 });
  const [statusAlertDismissed, setStatusAlertDismissed] = useState(false);
  const [refreshCanceledUploadCount, setRefreshCanceledUploadCount] = useState(0);
  const [hydratedUserId, setHydratedUserId] = useState(authenticatedUserId);

  // Refs to avoid stale closures in async startImport
  const authenticatedUserIdRef = useRef(authenticatedUserId);
  const defaultCreatorRef = useRef(defaultCreator);
  const filesRef = useRef(files);
  const onImportCompleteRef = useRef<(() => void) | null>(null);
  const uploadFeesRef = useRef(uploadFees);
  const importAbortControllerRef = useRef<AbortController | null>(null);
  const uploadChargeSessionsRef = useRef(new Map<string, UploadChargeSession>());
  const processingPollControllersRef = useRef(new Map<string, AbortController>());
  const balanceRequestIdRef = useRef(0);
  const feesLoading = feePricesLoading || balanceLoading;

  const startProcessingPoll = useCallback(
    (fileId: string, operationId: string, processingStartedAt: number) => {
      if (processingPollControllersRef.current.has(operationId)) {
        return;
      }
      const controller = new AbortController();
      processingPollControllersRef.current.set(operationId, controller);

      void (async () => {
        let nextPollDelayMs = PROCESSING_POLL_INITIAL_DELAY_MS;
        try {
          while (!controller.signal.aborted) {
            const assetId = await pollForCompletedOperation(operationId, 0, controller.signal, {
              returnNullWhenPending: true,
            });
            if (assetId == null) {
              if (Date.now() - processingStartedAt >= PROCESSING_POLL_MAX_AGE_MS) {
                throw new Error('Asset upload operation remained pending beyond the polling limit');
              }
              await waitForProcessingPoll(controller.signal, nextPollDelayMs);
              nextPollDelayMs = Math.min(nextPollDelayMs * 2, PROCESSING_POLL_MAX_DELAY_MS);
              continue;
            }
            uploadChargeSessionsRef.current.delete(fileId);
            setFiles((prev) => {
              const next = prev.map((file) =>
                file.id === fileId && file.operationId === operationId
                  ? {
                      ...file,
                      status: 'uploaded' as const,
                      progress: 100,
                      assetId,
                      multipartAbortable: false,
                      processingStartedAt: undefined,
                      errorType: undefined,
                      errorParameters: undefined,
                    }
                  : file,
              );
              filesRef.current = next;
              persistImportQueue(authenticatedUserIdRef.current, next, queuePersistenceOwner);
              return next;
            });
            onImportCompleteRef.current?.();
            return;
          }
        } catch (error) {
          if (!isAbortError(error)) {
            setFiles((prev) => {
              const next = prev.map((file) =>
                file.id === fileId && file.operationId === operationId
                  ? {
                      ...file,
                      status: 'failed' as const,
                      progress: undefined,
                      errorType: 'upload_failed' as const,
                      errorParameters: undefined,
                    }
                  : file,
              );
              filesRef.current = next;
              persistImportQueue(authenticatedUserIdRef.current, next, queuePersistenceOwner);
              return next;
            });
          }
        } finally {
          processingPollControllersRef.current.delete(operationId);
        }
      })();
    },
    [queuePersistenceOwner],
  );

  useEffect(() => {
    authenticatedUserIdRef.current = authenticatedUserId;
  }, [authenticatedUserId]);
  useEffect(() => {
    defaultCreatorRef.current = defaultCreator;
  }, [defaultCreator]);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  useEffect(() => {
    uploadFeesRef.current = uploadFees;
  }, [uploadFees]);

  const abortedOnRestoreRef = useRef(new Set<string>());

  useEffect(() => {
    if (hydratedUserId === authenticatedUserId) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => {
      if (authenticatedUserId === 0) {
        filesRef.current = [];
        setFiles([]);
        setHydratedUserId(0);
        return;
      }

      const restored = loadPersistedImportQueue(authenticatedUserId, queuePersistenceOwner);
      abortedOnRestoreRef.current.clear();
      filesRef.current = restored;
      setFiles(restored);
      setHydratedUserId(authenticatedUserId);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [authenticatedUserId, hydratedUserId, queuePersistenceOwner]);

  useEffect(() => {
    if (authenticatedUserId === 0 || hydratedUserId !== authenticatedUserId) {
      return;
    }
    for (const file of files) {
      if (
        file.status !== 'failed' ||
        file.multipartAbortable !== true ||
        file.operationId == null ||
        file.restoredFromPersistence !== true ||
        abortedOnRestoreRef.current.has(file.id)
      ) {
        continue;
      }
      const operationId = file.operationId;
      abortedOnRestoreRef.current.add(file.id);
      void withImportFileOwnership(
        authenticatedUserId,
        queuePersistenceOwner,
        file.id,
        async () => {
          const persistedFile = findPersistedImportFile(
            authenticatedUserId,
            file.id,
            queuePersistenceOwner,
          );
          if (
            persistedFile == null ||
            persistedFile.operationId !== operationId ||
            persistedFile.status !== 'importing' ||
            persistedFile.multipartAbortable !== true
          ) {
            uploadChargeSessionsRef.current.delete(file.id);
            setFiles((prev) => {
              const current = prev.find((candidate) => candidate.id === file.id);
              if (
                current?.restoredFromPersistence !== true ||
                current.operationId !== operationId
              ) {
                return prev;
              }
              const next =
                persistedFile == null
                  ? prev.filter((candidate) => candidate.id !== file.id)
                  : prev.map((candidate) =>
                      candidate.id === file.id
                        ? createRestoredImportFile(persistedFile)
                        : candidate,
                    );
              filesRef.current = next;
              return next;
            });
            return;
          }

          uploadChargeSessionsRef.current.set(file.id, {
            operationId,
            canAbortMultipart: true,
          });
          try {
            await assetsUploadApiClient.abortMultipartUpload(operationId);
          } catch {
            return;
          }
          uploadChargeSessionsRef.current.delete(file.id);
          setFiles((prev) => {
            const next = prev.filter((current) => current.id !== file.id);
            filesRef.current = next;
            persistImportQueue(authenticatedUserId, next, queuePersistenceOwner);
            return next;
          });
          setRefreshCanceledUploadCount((count) => count + 1);
        },
      ).catch(() => undefined);
    }
  }, [authenticatedUserId, files, hydratedUserId, queuePersistenceOwner]);

  useEffect(() => {
    const activeProcessingOperationIds = new Set<string>();
    for (const file of files) {
      if (file.status !== 'processing' || file.operationId == null) {
        continue;
      }
      activeProcessingOperationIds.add(file.operationId);
      startProcessingPoll(file.id, file.operationId, file.processingStartedAt ?? Date.now());
    }
    for (const [operationId, controller] of processingPollControllersRef.current) {
      if (!activeProcessingOperationIds.has(operationId)) {
        controller.abort();
        processingPollControllersRef.current.delete(operationId);
      }
    }
  }, [files, startProcessingPoll]);

  useEffect(() => {
    if (authenticatedUserId === 0 || hydratedUserId !== authenticatedUserId) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => {
      persistImportQueue(authenticatedUserId, files, queuePersistenceOwner);
    }, PERSIST_QUEUE_DEBOUNCE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [authenticatedUserId, files, hydratedUserId, queuePersistenceOwner]);

  useEffect(() => {
    const persistOnHide = () => {
      persistImportQueue(authenticatedUserIdRef.current, filesRef.current, queuePersistenceOwner);
    };
    window.addEventListener('pagehide', persistOnHide);
    return () => {
      window.removeEventListener('pagehide', persistOnHide);
    };
  }, [queuePersistenceOwner]);

  const abortInFlightMultipartPurchases = useCallback(() => {
    for (const session of uploadChargeSessionsRef.current.values()) {
      if (session.canAbortMultipart) {
        void assetsUploadApiClient.abortMultipartUpload(session.operationId);
      }
    }
    uploadChargeSessionsRef.current.clear();
  }, []);

  useEffect(
    () => () => {
      importAbortControllerRef.current?.abort();
      for (const controller of processingPollControllersRef.current.values()) {
        controller.abort();
      }
      processingPollControllersRef.current.clear();
    },
    [],
  );

  // --- Computed state ---

  const filteredFiles = useMemo(() => {
    let result = files;
    if (typeFilter !== 'all') {
      result = result.filter((f) => f.fileType === typeFilter);
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      result = result.filter((f) => f.displayName.toLowerCase().includes(q));
    }
    return [...result].sort(
      (left, right) => Number(left.status === 'invalid') - Number(right.status === 'invalid'),
    );
  }, [files, typeFilter, searchFilter]);

  const batchStats = useMemo(() => {
    const total = files.length;
    const ready = files.filter((f) => f.status === 'ready').length;
    const invalid = files.filter((f) => f.status === 'invalid').length;
    const importing = files.filter((f) => f.status === 'importing').length;
    const processing = files.filter((f) => f.status === 'processing').length;
    const uploaded = files.filter((f) => f.status === 'uploaded').length;
    const moderationPending = files.filter((f) => f.status === 'moderation_pending').length;
    const approved = files.filter((f) => f.status === 'approved').length;
    const failed = files.filter((f) => f.status === 'failed').length;
    const retryableFailed = files.filter(isRetryableFailedImportFile).length;
    const importCandidates = files.filter(isImportCandidate);
    const importable = importCandidates.length;
    const completed = processing + uploaded + moderationPending + approved;
    const paidFiles = files.filter(isUnpaidFeeFile);
    const chargeableVideo = paidFiles.filter((file) => file.fileType === 'video').length;
    const totalCost = paidFiles.reduce((sum, f) => {
      const feeKey = ASSET_TYPE_FOR_FEE[f.fileType];
      if (!feeKey) {
        return sum;
      }
      const fee = uploadFees[feeKey];
      if (fee) {
        return sum + fee.price;
      }
      if (f.fileType === 'video') {
        return sum + VIDEO_UPLOAD_FEE_FALLBACK;
      }
      return sum;
    }, 0);

    const feesAvailable = paidFiles.every((file) => {
      const feeKey = ASSET_TYPE_FOR_FEE[file.fileType];
      const fee = feeKey == null ? undefined : uploadFees[feeKey];
      return fee?.isAvailable ?? false;
    });
    const feeReportsInsufficientFunds = paidFiles.some((file) => {
      const feeKey = ASSET_TYPE_FOR_FEE[file.fileType];
      return feeKey != null && uploadFees[feeKey]?.canAfford === false;
    });
    const costsUnavailable = paidFiles.length > 0 && !feesAvailable;
    const balanceUnavailable =
      paidFiles.length > 0 &&
      feesAvailable &&
      !feeReportsInsufficientFunds &&
      totalCost > 0 &&
      availableRobux == null;
    const canAfford =
      paidFiles.length === 0 ||
      (feesAvailable &&
        !feeReportsInsufficientFunds &&
        (totalCost === 0 || availableRobux == null || availableRobux >= totalCost));

    return {
      total,
      ready,
      invalid,
      importing,
      processing,
      uploaded,
      moderationPending,
      approved,
      failed,
      retryableFailed,
      importable,
      chargeableVideo,
      completed,
      totalCost,
      costsUnavailable,
      balanceUnavailable,
      canAfford,
    };
  }, [availableRobux, files, uploadFees]);

  const batchStatus: ImportBatchStatus = useMemo(() => {
    if (files.length === 0) {
      return 'empty';
    }
    if (importInProgress) {
      return 'importing';
    }
    const allDone = files.every(
      (f) =>
        f.status === 'processing' ||
        f.status === 'uploaded' ||
        f.status === 'moderation_pending' ||
        f.status === 'approved' ||
        f.status === 'failed' ||
        f.status === 'invalid',
    );
    if (allDone && files.some((f) => f.status !== 'invalid')) {
      const completedCount =
        lastImportStats?.completed ?? files.filter((f) => isAlreadyImported(f.status)).length;
      const failedCount =
        lastImportStats?.failed ?? files.filter((f) => f.status === 'failed').length;
      if (completedCount > 0 && failedCount > 0) {
        return 'complete_partial';
      }
      if (failedCount > 0 && completedCount === 0) {
        return 'complete_failed';
      }
      return 'complete_success';
    }
    if (files.some((f) => f.status === 'invalid')) {
      return 'has_invalid';
    }
    return 'ready';
  }, [files, importInProgress, lastImportStats]);

  // --- Fetch upload fees from the real API ---

  const fetchUploadFees = useCallback(
    async (fileTypes: Set<ImportableFileType>) => {
      setFeePricesLoading(true);
      const feesToFetch: string[] = [];
      for (const ft of fileTypes) {
        const feeKey = ASSET_TYPE_FOR_FEE[ft];
        if (feeKey && !uploadFees[feeKey]?.isAvailable) {
          feesToFetch.push(feeKey);
        }
      }

      for (const assetType of feesToFetch) {
        try {
          if (assetType === 'Video') {
            // Video fee is hardcoded per asset-creation pattern
            setUploadFees((prev) => ({
              ...prev,
              Video: {
                price: VIDEO_UPLOAD_FEE_FALLBACK,
                isAvailable: true,
                canAfford: null,
              },
            }));
          } else {
            const response = await itemconfigurationClient.getItemUploadFee(
              V1ItemsUploadFeeGetAssetTypeEnum.NUMBER_3,
              undefined,
            );
            const { price } = response;
            if (price == null) {
              throw new Error('Upload fee response did not include a price');
            }
            setUploadFees((prev) => ({
              ...prev,
              [assetType]: {
                price,
                isAvailable: true,
                canAfford: response.canAfford ?? null,
              },
            }));
          }
        } catch {
          setUploadFees((prev) => ({
            ...prev,
            [assetType]: { price: 0, isAvailable: false, canAfford: null },
          }));
        }
      }
      setFeePricesLoading(false);
    },
    [uploadFees],
  );

  const fetchCreatorBalance = useCallback(async (scope: InventoryScope | null) => {
    const requestId = ++balanceRequestIdRef.current;
    const ownerId = scope?.ownerId ?? authenticatedUserIdRef.current;
    setBalanceLoading(true);
    setAvailableRobux(null);

    try {
      const response =
        scope?.ownerType === 'groups'
          ? await economyClient.getGroupCurrency(scope.groupId ?? ownerId)
          : await economyClient.getUserCurrency(ownerId);
      if (balanceRequestIdRef.current === requestId) {
        setAvailableRobux(response.robux ?? null);
      }
    } catch {
      if (balanceRequestIdRef.current === requestId) {
        setAvailableRobux(null);
      }
    } finally {
      if (balanceRequestIdRef.current === requestId) {
        setBalanceLoading(false);
      }
    }
  }, []);

  // --- Actions ---

  const openImporter = useCallback((scope?: InventoryScope, refreshCallback?: () => void) => {
    if (scope) {
      setDefaultCreator(scope);
    }
    if (refreshCallback) {
      onImportCompleteRef.current = refreshCallback;
    }
    setIsOpen(true);
  }, []);

  const closeImporter = useCallback(() => {
    setIsOpen(false);
  }, []);

  const resetImporter = useCallback(() => {
    importAbortControllerRef.current?.abort();
    importAbortControllerRef.current = null;
    abortInFlightMultipartPurchases();
    setFiles([]);
    setSearchFilter('');
    setTypeFilter('all');
    setDefaultCreator(null);
    setShowConfirmation(false);
    setImportInProgress(false);
    setStoppingImport(false);
    setUploadFees({});
    setFeePricesLoading(false);
    setBalanceLoading(false);
    setAvailableRobux(null);
    balanceRequestIdRef.current += 1;
    setLastImportStats(null);
    setImportProgress({ completed: 0, total: 0 });
    setStatusAlertDismissed(false);
    setRefreshCanceledUploadCount(0);
    onImportCompleteRef.current = null;
    clearPersistedImportQueue(authenticatedUserIdRef.current, queuePersistenceOwner);
  }, [abortInFlightMultipartPurchases, queuePersistenceOwner]);

  const addFiles = useCallback(
    (newFiles: File[]): { added: number; rejected: number; overLimit: boolean } => {
      const filesToConsider = newFiles.filter((file) => !isIgnoredOperatingSystemFile(file.name));
      const currentCount = filesRef.current.filter(
        (file) => !isAlreadyImported(file.status),
      ).length;
      const availableSlots = MAX_BATCH_SIZE - currentCount;

      if (availableSlots <= 0) {
        return {
          added: 0,
          rejected: filesToConsider.length,
          overLimit: filesToConsider.length > 0,
        };
      }

      const filesToAdd = filesToConsider.slice(0, availableSlots);
      const rejected = filesToConsider.length - filesToAdd.length;

      const typesInBatch = new Set<ImportableFileType>();

      const importFiles: ImportFile[] = filesToAdd.map((file) => {
        const extension = getFileExtension(file.name);
        const fileType = classifyFileType(extension);
        const validation = validateFile(file, extension, fileType);

        if (validation.valid) {
          typesInBatch.add(fileType);
        }

        return {
          id: generateFileId(),
          file,
          fileName: file.name,
          displayName: getDisplayNameFromFile(file.name),
          fileSize: file.size,
          fileType,
          extension,
          status: validation.valid ? 'ready' : 'invalid',
          errorType: validation.errorType,
          errorParameters: validation.errorParameters,
          targetCreator: defaultCreator ?? undefined,
          pendingDescription: '',
        };
      });

      setFiles((prev) => {
        const next = [...prev, ...importFiles];
        filesRef.current = next;
        return next;
      });

      // Fetch fees for any new asset types that require payment
      if ([...typesInBatch].some((fileType) => ASSET_TYPE_FOR_FEE[fileType] != null)) {
        void fetchCreatorBalance(defaultCreator);
        void fetchUploadFees(typesInBatch);
      }

      return { added: filesToAdd.length, rejected, overLimit: rejected > 0 };
    },
    [defaultCreator, fetchCreatorBalance, fetchUploadFees],
  );

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setLastImportStats(null);
  }, []);

  const clearQueue = useCallback(() => {
    if (importInProgress) {
      return;
    }
    setFiles([]);
    setLastImportStats(null);
    setStatusAlertDismissed(false);
  }, [importInProgress]);

  const retryCostCheck = useCallback(() => {
    const paidFileTypes = new Set(
      filesRef.current.filter(isUnpaidFeeFile).map((file) => file.fileType),
    );
    if (paidFileTypes.size === 0) {
      return;
    }
    void fetchCreatorBalance(defaultCreatorRef.current);
    void fetchUploadFees(paidFileTypes);
  }, [fetchCreatorBalance, fetchUploadFees]);

  const confirmCosts = useCallback(() => {
    const confirmedFiles = filesRef.current.map((f) => {
      if ((f.fileType === 'audio' || f.fileType === 'video') && isImportCandidate(f)) {
        return { ...f, settings: { ...f.settings, costConfirmed: true } };
      }
      return f;
    });
    filesRef.current = confirmedFiles;
    setFiles(confirmedFiles);
    setShowConfirmation(false);
  }, []);

  // Real import using Assets Upload API.
  const startImport = useCallback(async () => {
    if (importInProgress) {
      return;
    }

    // Read latest state from refs to avoid stale closures
    const currentFiles = filesRef.current;
    const currentCreator = defaultCreatorRef.current;
    const currentUploadFees = uploadFeesRef.current;

    const paidFiles = currentFiles.filter(isUnpaidFeeFile);
    const paidFilesCost = paidFiles.reduce((total, file) => {
      const feeKey = ASSET_TYPE_FOR_FEE[file.fileType];
      return total + (feeKey == null ? 0 : (currentUploadFees[feeKey]?.price ?? 0));
    }, 0);
    const paidFeesAvailable = paidFiles.every((file) => {
      const feeKey = ASSET_TYPE_FOR_FEE[file.fileType];
      return feeKey != null && (currentUploadFees[feeKey]?.isAvailable ?? false);
    });
    const feeReportsInsufficientFunds = paidFiles.some((file) => {
      const feeKey = ASSET_TYPE_FOR_FEE[file.fileType];
      return feeKey != null && currentUploadFees[feeKey]?.canAfford === false;
    });
    const canAffordPaidFiles =
      paidFilesCost === 0 || availableRobux == null || availableRobux >= paidFilesCost;

    if (
      paidFiles.length > 0 &&
      (feePricesLoading ||
        balanceLoading ||
        !paidFeesAvailable ||
        feeReportsInsufficientFunds ||
        !canAffordPaidFiles)
    ) {
      return;
    }

    // Check if audio/video needs confirmation
    const hasUnconfirmedPaidAssets = paidFiles.some((file) => !file.settings?.costConfirmed);
    const hasPaidCost = paidFiles.some((f) => {
      const feeKey = ASSET_TYPE_FOR_FEE[f.fileType];
      return feeKey != null && (currentUploadFees[feeKey]?.price ?? 0) > 0;
    });

    if (hasUnconfirmedPaidAssets && hasPaidCost) {
      setShowConfirmation(true);
      return;
    }

    const abortController = new AbortController();
    importAbortControllerRef.current = abortController;
    const { signal } = abortController;

    setImportInProgress(true);
    setStatusAlertDismissed(false);

    const filesToImport = currentFiles.filter(isImportCandidate);

    if (filesToImport.length === 0) {
      importAbortControllerRef.current = null;
      setImportInProgress(false);
      return;
    }
    setImportProgress({ completed: 0, total: filesToImport.length });

    // Stage new files and retryable failures together.
    setFiles((prev) =>
      prev.map((f) =>
        isImportCandidate(f) ? { ...f, status: 'importing' as const, progress: 0 } : f,
      ),
    );

    // Upload all files to the selected creator's root inventory. Local folder paths are ignored.
    const scope = currentCreator;
    const latestUserId = authenticatedUserIdRef.current;
    const ownerId = scope?.ownerId ?? latestUserId;

    if (!ownerId) {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'importing'
            ? {
                ...f,
                status: 'failed' as const,
                errorType: 'missing_creator_scope' as const,
              }
            : f,
        ),
      );
      setLastImportStats({ completed: 0, failed: filesToImport.length });
      if (importAbortControllerRef.current === abortController) {
        importAbortControllerRef.current = null;
      }
      setImportInProgress(false);
      return;
    }

    const applyFileUpdate = (fileId: string, updater: (file: ImportFile) => ImportFile) => {
      setFiles((prev) => {
        if (signal.aborted) {
          return prev;
        }
        const next = prev.map((file) => (file.id === fileId ? updater(file) : file));
        filesRef.current = next;
        return next;
      });
    };

    const persistChargedOperation = (
      fileId: string,
      operationId: string,
      canAbortMultipart: boolean,
    ) => {
      if (signal.aborted) {
        return;
      }
      uploadChargeSessionsRef.current.set(fileId, { operationId, canAbortMultipart });
      setFiles((prev) => {
        const next = prev.map((file) =>
          file.id === fileId
            ? { ...file, operationId, multipartAbortable: canAbortMultipart }
            : file,
        );
        filesRef.current = next;
        persistImportQueue(authenticatedUserIdRef.current, next, queuePersistenceOwner);
        return next;
      });
    };

    const markMultipartNoLongerAbortable = (fileId: string) => {
      const session = uploadChargeSessionsRef.current.get(fileId);
      if (session != null) {
        session.canAbortMultipart = false;
      }
      if (signal.aborted) {
        return;
      }
      setFiles((prev) => {
        const next = prev.map((file) =>
          file.id === fileId ? { ...file, multipartAbortable: false } : file,
        );
        filesRef.current = next;
        persistImportQueue(authenticatedUserIdRef.current, next, queuePersistenceOwner);
        return next;
      });
    };

    const markMultipartAborted = (fileId: string, operationId: string) => {
      const session = uploadChargeSessionsRef.current.get(fileId);
      if (session?.operationId === operationId) {
        uploadChargeSessionsRef.current.delete(fileId);
      }
      setFiles((prev) => {
        const next = prev.map((file) =>
          file.id === fileId && file.operationId === operationId
            ? {
                ...file,
                operationId: undefined,
                multipartAbortable: undefined,
                processingStartedAt: undefined,
              }
            : file,
        );
        filesRef.current = next;
        persistImportQueue(authenticatedUserIdRef.current, next, queuePersistenceOwner);
        return next;
      });
    };

    // Upload files in parallel (max 4 concurrent).
    const uploadFile = async (
      currentFile: ImportFile,
    ): Promise<'success' | 'failed' | 'canceled'> => {
      if (signal.aborted) {
        return 'canceled';
      }
      const fileScope = currentFile.targetCreator ?? scope;
      const fileScopeOwnerId = fileScope?.ownerId ?? latestUserId;
      if (!fileScopeOwnerId) {
        applyFileUpdate(currentFile.id, (file) => ({
          ...file,
          status: 'failed',
          errorType: 'missing_creator_scope',
          progress: undefined,
        }));
        return 'failed';
      }
      const creator: Creator =
        fileScope?.ownerType === 'groups' && fileScope.groupId != null
          ? { groupId: fileScope.groupId }
          : { userId: fileScopeOwnerId };

      const assetType = FILE_TYPE_TO_ASSET_TYPE[currentFile.fileType];
      if (!assetType) {
        applyFileUpdate(currentFile.id, (file) => ({
          ...file,
          status: 'failed',
          errorType: 'unsupported_asset_type',
          progress: undefined,
        }));
        return 'failed';
      }

      // Determine expected price for audio/video
      const feeKey = ASSET_TYPE_FOR_FEE[currentFile.fileType];
      const expectedPrice = feeKey
        ? (currentUploadFees[feeKey]?.price ??
          (currentFile.fileType === 'video' ? VIDEO_UPLOAD_FEE_FALLBACK : 0))
        : undefined;

      const requestInfo: AssetUploadRequest = {
        assetType,
        displayName: currentFile.displayName,
        description: currentFile.pendingDescription?.trim() ?? '',
        creationContext: {
          creator,
          ...(expectedPrice != null && expectedPrice > 0 && { expectedPrice }),
        },
      };

      try {
        let operationId = currentFile.operationId;
        const useMultipart = currentFile.fileSize > MULTIPART_UPLOAD_THRESHOLD_BYTES;
        const hasLocalFileBytes = currentFile.file.size > 0;

        if (operationId == null && !hasLocalFileBytes) {
          applyFileUpdate(currentFile.id, (file) => ({
            ...file,
            status: 'failed',
            errorType: 'upload_failed',
            progress: undefined,
          }));
          return 'failed';
        }

        if (operationId != null && currentFile.multipartAbortable === true) {
          try {
            await assetsUploadApiClient.abortMultipartUpload(operationId);
          } catch {
            applyFileUpdate(currentFile.id, (file) => ({
              ...file,
              status: 'failed',
              operationId,
              multipartAbortable: true,
              progress: undefined,
              errorType: 'upload_failed',
            }));
            return 'failed';
          }
          uploadChargeSessionsRef.current.delete(currentFile.id);
          operationId = undefined;
          applyFileUpdate(currentFile.id, (file) => ({
            ...file,
            operationId: undefined,
            multipartAbortable: undefined,
          }));
          if (!hasLocalFileBytes) {
            applyFileUpdate(currentFile.id, (file) => ({
              ...file,
              status: 'failed',
              errorType: 'upload_failed',
              progress: undefined,
            }));
            return 'failed';
          }
        }

        if (operationId == null && useMultipart) {
          operationId = await withImportFileOwnership(
            latestUserId,
            queuePersistenceOwner,
            currentFile.id,
            async () => {
              try {
                return await assetsUploadApiClient.createAssetAndGetOperationIdWithMultipart(
                  requestInfo,
                  currentFile.file,
                  false,
                  (progress) => {
                    applyFileUpdate(currentFile.id, (file) => ({ ...file, progress }));
                  },
                  signal,
                  (startedOperationId) => {
                    persistChargedOperation(currentFile.id, startedOperationId, true);
                  },
                  () => {
                    markMultipartNoLongerAbortable(currentFile.id);
                  },
                  (abortedOperationId) => {
                    markMultipartAborted(currentFile.id, abortedOperationId);
                  },
                );
              } catch (error) {
                if (signal.aborted) {
                  await uploadChargeSessionsRef.current.get(currentFile.id)?.abortPromise;
                }
                throw error;
              }
            },
          );
        } else {
          operationId ??= await assetsUploadApiClient.createAssetAndGetOperationId(
            requestInfo,
            currentFile.file,
            false,
            signal,
          );
        }

        if (signal.aborted) {
          return 'canceled';
        }

        const processingStartedAt = Date.now();
        persistChargedOperation(currentFile.id, operationId, false);
        applyFileUpdate(currentFile.id, (file) => ({
          ...file,
          status: 'processing',
          progress: 100,
          processingStartedAt,
        }));

        uploadChargeSessionsRef.current.delete(currentFile.id);
        startProcessingPoll(currentFile.id, operationId, processingStartedAt);
        if (!signal.aborted) {
          setImportProgress((prev) => ({ ...prev, completed: prev.completed + 1 }));
        }
        return 'success';
      } catch (e) {
        if (signal.aborted || isAbortError(e)) {
          return 'canceled';
        }
        applyFileUpdate(currentFile.id, (file) => ({
          ...file,
          status: 'failed',
          progress: undefined,
          errorType: 'upload_failed',
          errorParameters: undefined,
          operationId:
            uploadChargeSessionsRef.current.get(currentFile.id)?.operationId ?? file.operationId,
        }));
        return 'failed';
      }
    };

    // Run uploads with bounded concurrency (4 at a time)
    const CONCURRENCY = 4;
    let lastCompleted = 0;
    let lastFailed = 0;
    for (let i = 0; i < filesToImport.length; i += CONCURRENCY) {
      if (signal.aborted) {
        break;
      }
      const chunkResults = await Promise.allSettled(
        filesToImport.slice(i, i + CONCURRENCY).map(uploadFile),
      );
      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          if (result.value === 'success') {
            lastCompleted += 1;
          } else if (result.value === 'failed') {
            lastFailed += 1;
          }
        } else {
          lastFailed += 1;
        }
      }
    }

    if (importAbortControllerRef.current !== abortController) {
      return;
    }
    importAbortControllerRef.current = null;

    if (signal.aborted) {
      setFiles((prev) => {
        const next = prev.map((file) =>
          settleCanceledImportFile(
            file,
            uploadChargeSessionsRef.current.get(file.id),
            file.multipartAbortable !== true,
          ),
        );
        filesRef.current = next;
        return next;
      });
      setImportInProgress(false);
      return;
    }

    setLastImportStats({ completed: lastCompleted, failed: lastFailed });
    setImportInProgress(false);
  }, [
    availableRobux,
    balanceLoading,
    feePricesLoading,
    importInProgress,
    queuePersistenceOwner,
    startProcessingPoll,
  ]);

  const stopImport = useCallback(() => {
    const controller = importAbortControllerRef.current;
    if (controller == null || controller.signal.aborted) {
      return;
    }
    setStoppingImport(true);
    controller.abort();
    importAbortControllerRef.current = null;

    const sessions = uploadChargeSessionsRef.current;
    const abortEntries = [...sessions.entries()].filter(([, session]) => session.canAbortMultipart);
    for (const [fileId, session] of sessions) {
      if (!session.canAbortMultipart) {
        const file = filesRef.current.find((current) => current.id === fileId);
        startProcessingPoll(fileId, session.operationId, file?.processingStartedAt ?? Date.now());
      }
    }

    const applyCanceledState = (successfulAbortIds: Set<string>) => {
      setFiles((prev) => {
        const next = prev.map((file) => {
          if (file.status !== 'importing') {
            return file;
          }
          const session = sessions.get(file.id);
          const abortSucceeded =
            session?.canAbortMultipart !== true || successfulAbortIds.has(file.id);
          const settled = settleCanceledImportFile(file, session, abortSucceeded);
          if (session?.canAbortMultipart === true && abortSucceeded) {
            sessions.delete(file.id);
          }
          return settled;
        });
        filesRef.current = next;
        return next;
      });
      setLastImportStats(null);
      setImportProgress({ completed: 0, total: 0 });
      setImportInProgress(false);
      setStoppingImport(false);
    };

    if (abortEntries.length === 0) {
      applyCanceledState(new Set());
      return;
    }

    const abortResults = abortEntries.map(([fileId, session]) => {
      const abortPromise = assetsUploadApiClient.abortMultipartUpload(session.operationId).then(
        () => true,
        () => false,
      );
      session.abortPromise = abortPromise;
      return abortPromise.then((succeeded) => ({ fileId, succeeded }));
    });
    void Promise.all(abortResults).then((results) => {
      const successfulAbortIds = new Set(
        results.filter((result) => result.succeeded).map((result) => result.fileId),
      );
      applyCanceledState(successfulAbortIds);
    });
  }, [startProcessingPoll]);

  const retryFailed = useCallback(() => {
    setStatusAlertDismissed(false);
    setFiles((prev) =>
      prev.map((f) => {
        if (!isRetryableFailedImportFile(f)) {
          return f;
        }
        return {
          ...f,
          status: 'ready' as const,
          errorType: undefined,
          errorParameters: undefined,
          progress: undefined,
        };
      }),
    );
  }, []);

  const dismissStatusAlert = useCallback(() => {
    setStatusAlertDismissed(true);
  }, []);

  const clearRefreshCanceledUploads = useCallback(() => {
    setRefreshCanceledUploadCount(0);
  }, []);

  return useMemo(
    () => ({
      isOpen,
      files,
      filteredFiles,
      searchFilter,
      typeFilter,
      defaultCreator,
      showConfirmation,
      importInProgress,
      stoppingImport,
      feesLoading,
      lastImportStats,
      importProgress,
      statusAlertDismissed,
      refreshCanceledUploadCount,
      batchStats,
      batchStatus,
      openImporter,
      closeImporter,
      resetImporter,
      addFiles,
      removeFile,
      clearQueue,
      confirmCosts,
      startImport,
      stopImport,
      retryFailed,
      retryCostCheck,
      dismissStatusAlert,
      clearRefreshCanceledUploads,
      setSearchFilter,
      setTypeFilter,
      setShowConfirmation,
    }),
    [
      addFiles,
      batchStats,
      batchStatus,
      clearQueue,
      clearRefreshCanceledUploads,
      closeImporter,
      confirmCosts,
      defaultCreator,
      dismissStatusAlert,
      feesLoading,
      files,
      filteredFiles,
      importInProgress,
      importProgress,
      isOpen,
      lastImportStats,
      openImporter,
      refreshCanceledUploadCount,
      removeFile,
      resetImporter,
      retryFailed,
      retryCostCheck,
      searchFilter,
      showConfirmation,
      startImport,
      statusAlertDismissed,
      stopImport,
      stoppingImport,
      typeFilter,
    ],
  );
}

export type ImportStore = ReturnType<typeof useImportStore>;
