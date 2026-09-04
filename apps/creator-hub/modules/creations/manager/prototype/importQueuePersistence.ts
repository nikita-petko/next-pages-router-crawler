import type {
  ImportFile,
  ImportFileError,
  ImportFileStatus,
  ImportableFileType,
  InventoryScope,
} from './importStore';

const STORAGE_PREFIX = 'creator-hub.bulk-import.v1';
const IMPORT_FILE_TYPES = new Set<string>(['image', 'audio', 'video', 'unknown']);
const IMPORT_FILE_STATUSES = new Set<string>([
  'queued',
  'invalid',
  'ready',
  'importing',
  'processing',
  'uploaded',
  'moderation_pending',
  'approved',
  'failed',
]);
const IMPORT_FILE_ERRORS = new Set<string>([
  'missing_creator_scope',
  'unsupported_asset_type',
  'missing_asset_id',
  'unsupported_file_type',
  'file_too_large',
  'empty_file',
  'upload_failed',
]);

export type PersistedImportFile = {
  id: string;
  fileName: string;
  displayName: string;
  fileSize: number;
  fileType: ImportableFileType;
  extension: string;
  status: ImportFileStatus;
  errorType?: ImportFileError;
  assetId?: number;
  operationId?: string;
  multipartAbortable?: boolean;
  processingStartedAt?: number;
  pendingDescription?: string;
  targetCreator?: InventoryScope;
};

export type ImportQueuePersistenceOwner = Pick<InventoryScope, 'ownerId' | 'ownerType'>;

function storageKey(userId: number, owner?: ImportQueuePersistenceOwner): string {
  if (owner == null || (owner.ownerType === 'users' && owner.ownerId === userId)) {
    return `${STORAGE_PREFIX}.${userId}`;
  }
  return `${STORAGE_PREFIX}.${userId}.${owner.ownerType}.${owner.ownerId}`;
}

function isInventoryScope(value: unknown): value is InventoryScope {
  return (
    typeof value === 'object' &&
    value != null &&
    'ownerId' in value &&
    typeof value.ownerId === 'number' &&
    'ownerName' in value &&
    typeof value.ownerName === 'string' &&
    'ownerType' in value &&
    (value.ownerType === 'users' || value.ownerType === 'groups') &&
    (!('groupId' in value) || value.groupId === undefined || typeof value.groupId === 'number')
  );
}

export function shouldPersistImportFile(file: ImportFile): boolean {
  return (
    file.operationId != null ||
    file.status === 'processing' ||
    file.status === 'uploaded' ||
    file.status === 'moderation_pending' ||
    file.status === 'approved'
  );
}

function toPersistedImportFile(file: ImportFile): PersistedImportFile {
  const awaitingMultipartRecovery =
    file.restoredFromPersistence === true &&
    file.operationId != null &&
    file.multipartAbortable === true;
  return {
    id: file.id,
    fileName: file.fileName,
    displayName: file.displayName,
    fileSize: file.fileSize,
    fileType: file.fileType,
    extension: file.extension,
    status: awaitingMultipartRecovery ? 'importing' : file.status,
    errorType: awaitingMultipartRecovery ? undefined : file.errorType,
    assetId: file.assetId,
    operationId: file.operationId,
    multipartAbortable: file.multipartAbortable,
    processingStartedAt: file.processingStartedAt,
    pendingDescription: file.pendingDescription,
    targetCreator: file.targetCreator,
  };
}

export function createRestoredImportFile(record: PersistedImportFile): ImportFile {
  const placeholderFile = new File([], record.fileName);
  if (record.status === 'importing' && record.multipartAbortable === true) {
    return {
      ...record,
      file: placeholderFile,
      status: 'failed',
      errorType: 'upload_failed',
      progress: undefined,
      restoredFromPersistence: true,
    };
  }
  if (record.status === 'importing') {
    return {
      ...record,
      file: placeholderFile,
      status: 'processing',
      multipartAbortable: false,
      processingStartedAt: record.processingStartedAt ?? Date.now(),
      progress: 100,
      restoredFromPersistence: true,
    };
  }
  return {
    ...record,
    file: placeholderFile,
    ...(record.status === 'processing' &&
      record.processingStartedAt == null && { processingStartedAt: Date.now() }),
    restoredFromPersistence: true,
  };
}

function isPersistedImportFile(value: unknown): value is PersistedImportFile {
  if (typeof value !== 'object' || value == null) {
    return false;
  }
  if (
    !('id' in value) ||
    !('fileName' in value) ||
    !('displayName' in value) ||
    !('fileSize' in value) ||
    !('fileType' in value) ||
    !('extension' in value) ||
    !('status' in value)
  ) {
    return false;
  }
  return (
    typeof value.id === 'string' &&
    typeof value.fileName === 'string' &&
    typeof value.displayName === 'string' &&
    typeof value.fileSize === 'number' &&
    typeof value.fileType === 'string' &&
    IMPORT_FILE_TYPES.has(value.fileType) &&
    typeof value.extension === 'string' &&
    typeof value.status === 'string' &&
    IMPORT_FILE_STATUSES.has(value.status) &&
    (!('errorType' in value) ||
      value.errorType === undefined ||
      (typeof value.errorType === 'string' && IMPORT_FILE_ERRORS.has(value.errorType))) &&
    (!('assetId' in value) || value.assetId === undefined || typeof value.assetId === 'number') &&
    (!('operationId' in value) ||
      value.operationId === undefined ||
      typeof value.operationId === 'string') &&
    (!('multipartAbortable' in value) ||
      value.multipartAbortable === undefined ||
      typeof value.multipartAbortable === 'boolean') &&
    (!('processingStartedAt' in value) ||
      value.processingStartedAt === undefined ||
      (typeof value.processingStartedAt === 'number' &&
        Number.isFinite(value.processingStartedAt) &&
        value.processingStartedAt >= 0)) &&
    (!('pendingDescription' in value) ||
      value.pendingDescription === undefined ||
      typeof value.pendingDescription === 'string') &&
    (!('targetCreator' in value) ||
      value.targetCreator === undefined ||
      isInventoryScope(value.targetCreator))
  );
}

function readPersistedImportFiles(
  userId: number,
  owner?: ImportQueuePersistenceOwner,
): PersistedImportFile[] {
  try {
    if (userId === 0 || typeof localStorage === 'undefined') {
      return [];
    }
    const raw = localStorage.getItem(storageKey(userId, owner));
    if (raw == null || raw === '') {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed == null || !('files' in parsed)) {
      return [];
    }
    const { files } = parsed;
    if (!Array.isArray(files)) {
      return [];
    }
    return files.filter(isPersistedImportFile);
  } catch {
    return [];
  }
}

export function persistImportQueue(
  userId: number,
  files: ImportFile[],
  owner?: ImportQueuePersistenceOwner,
): void {
  try {
    if (userId === 0 || typeof localStorage === 'undefined') {
      return;
    }
    const records = files.filter(shouldPersistImportFile).map(toPersistedImportFile);
    const key = storageKey(userId, owner);
    if (records.length === 0) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify({ files: records }));
  } catch {
    // Uploads must continue when browser storage is unavailable or full.
  }
}

export function loadPersistedImportQueue(
  userId: number,
  owner?: ImportQueuePersistenceOwner,
): ImportFile[] {
  return readPersistedImportFiles(userId, owner).map(createRestoredImportFile);
}

export function findPersistedImportFile(
  userId: number,
  fileId: string,
  owner?: ImportQueuePersistenceOwner,
): PersistedImportFile | undefined {
  return readPersistedImportFiles(userId, owner).find((file) => file.id === fileId);
}

export function clearPersistedImportQueue(
  userId: number,
  owner?: ImportQueuePersistenceOwner,
): void {
  try {
    if (userId === 0 || typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(storageKey(userId, owner));
  } catch {
    // Clearing the in-memory queue must still work when storage is unavailable.
  }
}
