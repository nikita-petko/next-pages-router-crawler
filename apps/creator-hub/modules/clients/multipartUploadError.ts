export enum MultipartUploadStage {
  MD5_CALCULATION = 'MD5_CALCULATION',
  MULTIPART_START = 'MULTIPART_START',
  CHUNK_UPLOAD = 'CHUNK_UPLOAD',
  CHUNK_COMPLETE = 'CHUNK_COMPLETE',
  MULTIPART_COMPLETE = 'MULTIPART_COMPLETE',
  CHUNK_UPLOAD_ABORT = 'CHUNK_UPLOAD_ABORT',
  CHUNK_COMPLETE_ABORT = 'CHUNK_COMPLETE_ABORT',
}

export class MultipartUploadError extends Error {
  public stage: MultipartUploadStage;

  public operationId?: string;

  public chunkIndex?: number;

  public httpStatus?: number;

  public errorCode?: string;

  public retryAttempt?: number;

  constructor(
    message: string,
    stage: MultipartUploadStage,
    operationId?: string,
    chunkIndex?: number,
    httpStatus?: number,
    errorCode?: string,
    retryAttempt?: number,
  ) {
    super(message);
    this.name = 'MultipartUploadError';
    this.stage = stage;
    this.operationId = operationId;
    this.chunkIndex = chunkIndex;
    this.httpStatus = httpStatus;
    this.errorCode = errorCode;
    this.retryAttempt = retryAttempt;
  }
}
