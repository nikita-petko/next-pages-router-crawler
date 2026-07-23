export interface SimplifiedUploadedCreative {
  asset_type: string;
  asset_url?: string; // download URL
  creative_id: string;
  filename: string;
  platform_specific_status?: CreativePlatformStatus[];
  platform_status: string;
  thumbnail?: string; // base64-encoded bytes
}

export enum CreativeUploadStatus {
  FAILED = 'CREATIVE_UPLOAD_STATUS_FAILED',
  SKIPPED = 'CREATIVE_UPLOAD_STATUS_SKIPPED',
  UPLOADED = 'CREATIVE_UPLOAD_STATUS_UPLOADED',
}

// eslint-disable-next-line import/no-unused-modules
export interface CreativePlatformStatus {
  platform: string;
  status: string;
}
