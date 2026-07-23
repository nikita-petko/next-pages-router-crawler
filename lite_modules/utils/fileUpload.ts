import { md5 } from 'js-md5';

import assetsUploadApiClient, { AssetCreationRequest, AssetType } from '@clients/assetsUpload';
import {
  ContextName,
  EventName,
  logNativeClickEvent,
  logNativeImpressionEvent,
  unifiedLogger,
} from '@clients/unifiedLogger';
import {
  FALLBACK_ASPECT_RATIO,
  IMAGE_UPLOAD_INTERVAL,
  MAX_CHUNKING_SIZE,
  MAX_IMAGE_SIZE,
  MAX_IMAGE_UPLOAD_RETRIES,
  MAX_VIDEO_UPLOAD_RETRIES,
  ONE_HUNDRED_MB_IN_BYTES,
  VALID_VIDEO_MIME_TYPES,
  VIDEO_DURATION_MAX_IN_SECONDS,
} from '@constants/fileUpload';
import {
  abortMultipartUpload,
  getMultipartVideoUploadOperationData,
  getVideoAssetId,
  markChunkComplete,
  markUploadComplete,
} from '@services/video/uploadVideo';
import { ServerAdAssetCompositeReviewDecisionType } from '@type/ad';
import { UserType } from '@type/authentication';
import {
  AspectRatioValidation,
  GetMultipartVideoUploadOperationDataRequest,
  SetUploadedImageParams,
  VideoUploadTransport,
} from '@type/fileUpload';
import { InBrowser } from '@utils/browser';
import { findMatchingAspectRatio } from '@utils/creativeFormat';
import { CaptureException } from '@utils/error';

// Video URL manager to prevent memory leaks
export class VideoURLManager {
  private static urlMap = new Map<string, string>();

  private static fileMap = new Map<string, Blob | File>();

  private static urlCreationTimes = new Map<string, number>();

  private static maxUrlAge = 15 * 60 * 1000; // 15 minutes

  private static cleanupInterval: ReturnType<typeof setInterval> | null = null;

  static {
    // Start periodic cleanup when class is first loaded
    this.startPeriodicCleanup();

    // Cleanup on page unload
    if (InBrowser()) {
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
  }

  private static startPeriodicCleanup(): void {
    // Only start cleanup in browser environment
    if (!InBrowser()) {
      return;
    }
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleUrls();
    }, 60000); // Cleanup every minute
  }

  private static cleanupStaleUrls(): void {
    // Only run cleanup in browser environment
    if (!InBrowser()) {
      return;
    }

    const now = Date.now();
    const URLUtil = window?.URL || window?.webkitURL;

    this.urlCreationTimes.forEach((creationTime, videoId) => {
      if (now - creationTime > this.maxUrlAge) {
        const url = this.urlMap.get(videoId);
        if (url) {
          try {
            URLUtil?.revokeObjectURL(url);
          } catch (error) {
            CaptureException(error);
          }
        }
        this.urlMap.delete(videoId);
        this.fileMap.delete(videoId);
        this.urlCreationTimes.delete(videoId);
      }
    });
  }

  static createVideoURL(file: Blob | string, videoId?: string): string {
    if (typeof file === 'string') {
      return file;
    }

    // Only create URLs in browser environment
    if (!InBrowser()) {
      return '';
    }

    try {
      // Check if we already have a URL for this videoId and the same file
      if (videoId) {
        const existingUrl = this.urlMap.get(videoId);
        const existingFile = this.fileMap.get(videoId);

        // If we have the same file, return the existing URL
        if (existingUrl && existingFile === file) {
          // Update creation time to extend life
          this.urlCreationTimes.set(videoId, Date.now());
          return existingUrl;
        }

        // If we have a different file, revoke the old URL first
        if (existingUrl && existingFile !== file) {
          this.revokeVideoURL(videoId);
        }
      }

      const URLUtil = window?.URL || window?.webkitURL;
      if (!URLUtil) {
        throw new Error('URL.createObjectURL is not supported');
      }

      const url = URLUtil.createObjectURL(file);

      // Store the URL and file with videoId for cleanup and comparison
      if (videoId) {
        this.urlMap.set(videoId, url);
        this.fileMap.set(videoId, file);
        this.urlCreationTimes.set(videoId, Date.now());
      }

      return url;
    } catch (error) {
      CaptureException(error as Error, { context: 'Failed to create video URL' });
      // Return empty string as fallback - components should handle this gracefully
      return '';
    }
  }

  static revokeVideoURL(videoId: string): void {
    // Only revoke URLs in browser environment
    if (!InBrowser()) {
      return;
    }

    try {
      const url = this.urlMap.get(videoId);
      if (url) {
        const URLUtil = window?.URL || window?.webkitURL;
        URLUtil?.revokeObjectURL(url);
      }
    } catch (error) {
      CaptureException(error);
    } finally {
      // Always clean up the maps even if revoke fails
      this.urlMap.delete(videoId);
      this.fileMap.delete(videoId);
      this.urlCreationTimes.delete(videoId);
    }
  }

  static revokeAllVideoURLs(): void {
    // Only revoke URLs in browser environment
    if (!InBrowser()) {
      // Still clear the maps even in non-browser environment
      this.urlMap.clear();
      this.fileMap.clear();
      this.urlCreationTimes.clear();
      return;
    }

    try {
      const URLUtil = window?.URL || window?.webkitURL;
      this.urlMap.forEach((url) => {
        try {
          URLUtil?.revokeObjectURL(url);
        } catch (error) {
          CaptureException(error);
        }
      });
    } catch (error) {
      CaptureException(error as Error, { context: 'Error during bulk URL revocation' });
    } finally {
      // Always clear the maps
      this.urlMap.clear();
      this.fileMap.clear();
      this.urlCreationTimes.clear();
    }
  }

  static cleanup(): void {
    this.revokeAllVideoURLs();

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  static getStats(): { oldestUrl: number | null; totalUrls: number } {
    const now = Date.now();
    let oldestUrl: number | null = null;

    this.urlCreationTimes.forEach((creationTime) => {
      const age = now - creationTime;
      if (oldestUrl === null || age > oldestUrl) {
        oldestUrl = age;
      }
    });

    return {
      oldestUrl,
      totalUrls: this.urlMap.size,
    };
  }
}

// Helper function to determine aspect ratio from video dimensions
export const GetAspectRatio = (width: number, height: number): string => {
  if (!width || !height) {
    return FALLBACK_ASPECT_RATIO;
  }

  // Calculate GCD for simplification
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const simplifiedWidth = width / divisor;
  const simplifiedHeight = height / divisor;

  // Common aspect ratios mapping
  const ratio = width / height;

  // Check for common aspect ratios with tolerance
  if (Math.abs(ratio - 16 / 9) < 0.01) {
    return '16:9';
  }
  if (Math.abs(ratio - 9 / 16) < 0.01) {
    return '9:16';
  }
  if (Math.abs(ratio - 4 / 3) < 0.01) {
    return '4:3';
  }
  if (Math.abs(ratio - 3 / 4) < 0.01) {
    return '3:4';
  }
  if (Math.abs(ratio - 1) < 0.01) {
    return '1:1';
  }
  if (Math.abs(ratio - 21 / 9) < 0.01) {
    return '21:9';
  }

  // For other ratios, use simplified fraction but cap at reasonable numbers
  if (simplifiedWidth > 100 || simplifiedHeight > 100) {
    // If simplified ratio is too large, round to nearest common ratio
    if (ratio > 1.5) {
      return '16:9';
    }
    if (ratio > 0.7) {
      return '1:1';
    }
    return '9:16';
  }

  return `${simplifiedWidth}:${simplifiedHeight}`;
};

interface PollWithRetryLimitAndCancelCallbackParams {
  fn: () => Promise<number | undefined>;
  interval: number;
  maxRetries?: number;
  onCancelCb?: () => void;
  onMaxRetriesReached?: () => void;
  successCb: (assetId: number) => void;
}

const PollWithRetryLimitAndCancelCallback = ({
  fn,
  interval,
  maxRetries,
  onCancelCb,
  onMaxRetriesReached,
  successCb,
}: PollWithRetryLimitAndCancelCallbackParams) => {
  // Initialize internal state within the closure
  const internalState: {
    keepRetrying: boolean;
    numberOfRetries: number;
    timeoutId: ReturnType<typeof setTimeout> | null;
  } = { keepRetrying: true, numberOfRetries: 0, timeoutId: null };

  const poll = () => {
    fn().then((result: number | undefined) => {
      if (result) {
        successCb(result);
      } else {
        if (maxRetries) {
          if (internalState.numberOfRetries >= maxRetries) {
            if (onMaxRetriesReached) {
              onMaxRetriesReached();
            }
            return;
          }
        }
        if (internalState.keepRetrying) {
          internalState.timeoutId = setTimeout(() => {
            internalState.timeoutId = null;
            internalState.numberOfRetries += 1;
            poll(); // Recursive call to the internal poll function
          }, interval);
        }
      }
    });
  };

  poll(); // Start the polling immediately

  const cancelRetrying = () => {
    if (onCancelCb) {
      onCancelCb();
    }
    if (internalState.timeoutId) {
      clearTimeout(internalState.timeoutId);
    }
    internalState.keepRetrying = false; // Modify the local internalState
  };

  return cancelRetrying;
};

/**
 * Default display name passed to Assets Registry when a caller does not
 * provide one. Kept identical to the previous hardcoded value so that
 * existing callers (e.g. campaign builder thumbnail uploads) are unchanged.
 */
const DEFAULT_IMAGE_ASSET_DISPLAY_NAME = 'AdsCreationAndManagementImage';

interface OnFileUploadParams {
  /** Aspect ratio validation rules for logos */
  aspectRatioValidation?: AspectRatioValidation;
  authenticatedUser: UserType | null;
  /**
   * Optional Assets Registry display name. The displayName field is
   * text-moderated, so callers that source it from user input (e.g. file
   * names) should sanitize first (trim, truncate, fall back to default
   * when empty). When omitted, the previous hardcoded constant is used.
   */
  displayName?: string;
  id: string;
  image?: File;
  OnFileUploadError: (id: string, errorMessage: string) => void;
  setCancelImageUpload: (id: string, cancelImageUpload: () => void) => void;
  setImageUploading: (id: string, uploading: boolean) => void;
  setUploadedImage: (params: SetUploadedImageParams) => void;
  uploadRetries?: number;
}

export const OnFileUpload = ({
  aspectRatioValidation,
  authenticatedUser,
  displayName,
  id,
  image,
  OnFileUploadError,
  setCancelImageUpload,
  setImageUploading,
  setUploadedImage,
  uploadRetries,
}: OnFileUploadParams) => {
  if (!image) {
    return;
  }

  logNativeImpressionEvent(EventName.ImageUploadClicked);

  // Guard the `authenticatedUser!.id` deref in proceedWithImageUpload —
  // the upload flow assumes the user is signed in, but auth init races
  // and signed-out sessions can briefly hand us a null here. Bail with
  // a user-facing error so the upload row surfaces it instead of
  // throwing a runtime TypeError that takes down the page.
  if (!authenticatedUser?.id) {
    CaptureException(new Error('OnFileUpload called without an authenticated user'));
    OnFileUploadError(id, 'You must be signed in to upload media. Please refresh and try again.');
    return;
  }

  // Validate image size and type first
  if (image.size > MAX_IMAGE_SIZE) {
    OnFileUploadError(id, 'Image size too large. Please upload a smaller one.');
    return;
  }

  if (
    image?.type?.toLowerCase() !== 'image/jpeg' &&
    image?.type?.toLowerCase() !== 'image/jpg' &&
    image?.type?.toLowerCase() !== 'image/png'
    // TODO: Add gif, tga, bmp
  ) {
    OnFileUploadError(
      id,
      'Image format does not meet the given requirements. Please upload a new one.',
    );
    return;
  }

  // Helper function to proceed with upload
  const proceedWithImageUpload = (aspectRatio?: string) => {
    image.arrayBuffer().then((arrayBuffer: ArrayBuffer) => {
      const blob = new Blob([new Uint8Array(arrayBuffer)], { type: image.type });

      const uploadAssetMetaData: AssetCreationRequest = {
        assetType: AssetType.Image,
        creationContext: {
          creator: { userId: authenticatedUser!.id },
        },
        description: '',
        displayName: displayName || DEFAULT_IMAGE_ASSET_DISPLAY_NAME,
      };

      setImageUploading(id, true);
      // Clear out XSRF token for fresh upload - accessing private middleware property
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (assetsUploadApiClient?.assetsUploadApi as any)?.middleware?.[1]?.storeCRSFToken?.(
          undefined,
        );
      } catch (error) {
        CaptureException(error);
      }
      assetsUploadApiClient
        .createAsset(uploadAssetMetaData, blob)
        .then((assetCreationOperationId) => {
          if (assetCreationOperationId) {
            const imageAssetIdResolved = async () =>
              assetsUploadApiClient.getAssetIdFromOperationStatus(assetCreationOperationId);

            const imageAssetResolvedSuccess = async (assetId: number) => {
              setImageUploading(id, false);
              setUploadedImage({ aspectRatio, assetId, blob, image });
              logNativeImpressionEvent(EventName.ImageUploadSuccess, {
                assetId: assetId.toString(),
              });
            };

            const cancelPolling = PollWithRetryLimitAndCancelCallback({
              fn: imageAssetIdResolved,
              interval: IMAGE_UPLOAD_INTERVAL,
              maxRetries: uploadRetries || MAX_IMAGE_UPLOAD_RETRIES,
              onMaxRetriesReached: () => {
                logNativeImpressionEvent(EventName.ImageUploadFailure, {
                  ctx: ContextName.ImageUploadMaxRetriesReachedAndErrorShown,
                });
                setImageUploading(id, false);
                OnFileUploadError(id, 'Error uploading image - please try again.');
              },
              successCb: imageAssetResolvedSuccess,
            });

            const cancelCurrentImageUpload = () => {
              logNativeClickEvent(EventName.CancelImageUpload);
              cancelPolling();
              setTimeout(() => {
                setImageUploading(id, false);
              });
            };

            setCancelImageUpload(id, cancelCurrentImageUpload);
          } else {
            OnFileUploadError(id, 'No Image Status Url Returned');
          }
        })
        .catch((error) => {
          setImageUploading(id, false);
          logNativeImpressionEvent(EventName.ImageUploadFailure, {
            error: error.toString(),
          });
          OnFileUploadError(id, 'Error uploading image - please try again.');
        });
    });
  };

  // If aspect ratio validation is required, validate dimensions before uploading
  if (aspectRatioValidation) {
    const img = new Image();
    const objectUrl = URL.createObjectURL(image);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { height, width } = img;

      // Shared with the library compatibility matcher so the upload
      // gate and the badges agree on "within tolerance".
      const matchedRatio = findMatchingAspectRatio(
        width,
        height,
        aspectRatioValidation.allowedRatios,
        aspectRatioValidation.tolerance ?? 0.05,
      );

      if (!matchedRatio) {
        const ratioStrings = aspectRatioValidation.allowedRatios
          .map(([w, h]) => `${w}:${h}`)
          .join(' or ');
        const actualRatio =
          width >= height ? `${(width / height).toFixed(2)}:1` : `1:${(height / width).toFixed(2)}`;
        OnFileUploadError(
          id,
          `Logo must have an aspect ratio of ${ratioStrings}. Your image is ${width}x${height} (${actualRatio}).`,
        );
        return;
      }

      // Use the matched validator bucket (e.g. "3:1") rather than
      // `GetAspectRatio`'s rounding fallback, which only knows about
      // 16:9 / 1:1 / 9:16 and would mis-tag a near-3:1 logo as 16:9.
      // Downstream (`useTransformFormToCampaign`) parses the leading
      // integer into `logo_asset_aspect_width`, which the backend
      // strict-checks for 1 or 3.
      proceedWithImageUpload(`${matchedRatio[0]}:${matchedRatio[1]}`);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      OnFileUploadError(id, 'Unable to load image. Please try a different file.');
    };

    img.src = objectUrl;
    return;
  }

  // If no aspect ratio validation, proceed directly
  proceedWithImageUpload();
};

const createUploadChunkPlan = (videoSize: number) => {
  const chunkPlan = [];
  let remainingSize = videoSize;
  while (remainingSize > 0) {
    chunkPlan.push(Math.min(remainingSize, MAX_CHUNKING_SIZE));
    remainingSize -= MAX_CHUNKING_SIZE;
  }
  return chunkPlan;
};
// Default transport: talk directly to the public assets-upload-api (moderated,
// upload-fee-charged path). Callers that need the internal EnhancedVideoExperience
// bypass pass the ads-management-api transport instead.
const assetsVideoUploadTransport: VideoUploadTransport = {
  abortMultipartUpload,
  getMultipartVideoUploadOperationData,
  getVideoAssetId,
  markChunkComplete,
  markUploadComplete,
};

interface UploadVideoParams {
  adAccountId: string;
  // Asset type sent on the multipart start request. Defaults to 'AdsVideo'
  // (public moderated path); the internal EnhancedVideoExperience path uses
  // 'Video' so the created asset registers as ASSET_TYPE_VIDEO.
  assetType?: string;
  authenticatedUser: UserType | null;
  maxRetries?: number;
  setCancelVideoUpload: (params: { cancelCb: () => void }) => void;
  setUploadedVideo: (video: File, assetId: string) => void;
  setVideoDuration: (duration: number) => void;
  setVideoHeight?: (height: number) => void;
  setVideoUploadError: (error: string) => void;
  setVideoUploading: (uploading: boolean) => void;
  setVideoUploadProgress: (progress: number) => void;
  setVideoWidth?: (width: number) => void;
  // Control-plane transport (defaults to the public assets-upload-api).
  transport?: VideoUploadTransport;
  video: File;
}

export const UploadVideo = ({
  adAccountId,
  assetType = 'AdsVideo',
  authenticatedUser,
  maxRetries = MAX_VIDEO_UPLOAD_RETRIES,
  setCancelVideoUpload,
  setUploadedVideo,
  setVideoDuration,
  setVideoHeight,
  setVideoUploadError,
  setVideoUploading,
  setVideoUploadProgress,
  setVideoWidth,
  transport = assetsVideoUploadTransport,
  video,
}: UploadVideoParams) => {
  const URLUtil = window?.URL || window?.webkitURL;
  const videoUploadStartTimeMs = Date.now();
  if (!authenticatedUser && !authenticatedUser!.id) {
    // TODO: Show an error modal prompting the user to login in a new tab
    return;
  }

  if (video === undefined) {
    return;
  }

  const videoSize = video.size;
  let localVideoUploading = true;

  logNativeImpressionEvent(EventName.VideoUploadClicked);

  if (videoSize > ONE_HUNDRED_MB_IN_BYTES) {
    setVideoUploadError('Video exceeds 100MB limit');
    return;
  }

  const encounteredErrorUploadingVideo = (err?: Error) => {
    setVideoUploading(false);
    localVideoUploading = false;
    setVideoUploadProgress(0);
    if (err) {
      CaptureException(err as Error);
    }
    setVideoUploadError('Error uploading video - please try again later');
    unifiedLogger.logImpressionEvent({
      eventName: EventName.VideoUploadFailure,
      parameters: {
        adAccountId,
      },
    });
  };

  const getUploadOperationData = async (
    uploadData: Partial<GetMultipartVideoUploadOperationDataRequest>,
  ) => {
    try {
      const multipartUploadInfoRes =
        await transport.getMultipartVideoUploadOperationData(uploadData);
      const { operationPath, uploadUrls = [] } = multipartUploadInfoRes;
      return { operationPath, uploadUrls };
    } catch {
      encounteredErrorUploadingVideo();
      return {};
    }
  };

  const uploadVideoChunks = async (
    uploadUrls: Array<{ chunkNum: number; url: string }>,
    chunkData: Array<Uint8Array>,
  ) => {
    const videoS3UploadStartTimeMs = Date.now();
    const promises: Array<Promise<Response>> = uploadUrls.map(
      ({ chunkNum, url }: { chunkNum: number; url: string }) =>
        fetch(url, {
          body: chunkData[chunkNum - 1] as BodyInit,
          method: 'PUT',
        }).then((response) => {
          if (response.ok) {
            // setVideoUploadProgress((prevProgress) => prevProgress + 10 / uploadUrls.length);
            // Allow upload progress up to 50% to leave room for transcoding phase
            setVideoUploadProgress(Math.floor((chunkNum / uploadUrls.length) * 50));
          }
          return response;
        }),
    );
    const videoUploadResponses = await Promise.all(promises).then((responses) => responses);
    const videoS3UploadEndTimeMs = Date.now();
    return { videoS3UploadEndTimeMs, videoS3UploadStartTimeMs, videoUploadResponses };
  };

  const markChunksComplete = async (etags: Array<string>, operationPath: string) => {
    const promises = etags.map((eTag, index) =>
      transport.markChunkComplete(operationPath, index + 1, eTag),
    );
    return Promise.all(promises);
  };

  const fetchTranscodingStatusPoll = (operationPath: string) => {
    const videoTranscodeStartTimeMs = Date.now();
    setVideoUploadProgress(50);

    const videoAssetIdResolved = async () => {
      try {
        const getVideoAssetIdRes = await transport.getVideoAssetId(operationPath);
        const { done, metadata = {}, response = {} } = getVideoAssetIdRes;
        const { progress } = metadata;

        if (progress !== undefined && progress > 0) {
          // Use actual API progress when available and meaningful, but cap at 99%
          const totalProgress = 50 + Math.floor(progress * 49);
          const finalProgress = Math.min(totalProgress, 99);
          setVideoUploadProgress(finalProgress);
        } else {
          // Start at 80% and gradually increment by 1% based on time elapsed
          const timeElapsedMs = Date.now() - videoTranscodeStartTimeMs;
          const timeElapsedSeconds = timeElapsedMs / 1000;
          // Start at 80%, increment 1% every 3 seconds, cap at 99%
          const timeBasedProgress = Math.floor(timeElapsedSeconds / 3);
          const artificialProgress = Math.min(80 + timeBasedProgress, 99);
          setVideoUploadProgress(artificialProgress);
        }

        if (done) {
          // const videoTranscodeEndTimeMs = Date.now();
          if (response) {
            return response.assetId;
          }
          encounteredErrorUploadingVideo();
        }
        return undefined;
      } catch (err) {
        CaptureException(err as Error);
      }
      return undefined;
    };

    const videoAssetResolvedSuccess = (assetId: string | number) => {
      setVideoUploading(false);
      localVideoUploading = false;
      setVideoUploadProgress(100);
      setUploadedVideo(video, assetId.toString());
      const videoUploadEndTimeMs = Date.now();
      const videoS3UploadStartTimeMs = Date.now();
      const videoS3UploadEndTimeMs = Date.now();
      const videoTranscodeEndTimeMs = Date.now();
      setTimeout(() => {
        const parameters: Record<string, string> = {
          adAccountId,
          videoSizeInBytes: videoSize.toString(),
        };

        if (videoUploadStartTimeMs && videoUploadEndTimeMs) {
          parameters.uploadTimeInMs = (videoUploadEndTimeMs - videoUploadStartTimeMs).toString();
        }
        if (videoS3UploadStartTimeMs && videoS3UploadEndTimeMs) {
          parameters.s3UploadTimeInMs = (
            videoS3UploadEndTimeMs - videoS3UploadStartTimeMs
          ).toString();
        }
        if (videoTranscodeStartTimeMs && videoTranscodeEndTimeMs) {
          parameters.transcodeTimeInMs = (
            videoTranscodeEndTimeMs - videoTranscodeStartTimeMs
          ).toString();
        }

        unifiedLogger.logImpressionEvent({
          eventName: EventName.VideoUploadSuccess,
          parameters,
        });
      }, 100);
    };

    // This will be set to false if the user clicks cancel - so we check for this at misc points cause that can happen async
    if (!localVideoUploading) {
      return;
    }
    const cancelPolling = PollWithRetryLimitAndCancelCallback({
      fn: videoAssetIdResolved,
      interval: 1500, // retry every 1.5 seconds
      maxRetries, // 5 minutes

      onMaxRetriesReached: () => {
        setVideoUploading(false);

        localVideoUploading = false;
        setVideoUploadProgress(0);
        setVideoUploadError('Error uploading video - please try again later');
        unifiedLogger.logImpressionEvent({
          eventName: EventName.VideoUploadFailure,
          parameters: {
            adAccountId,
            context: ContextName.VideoUploadMaxRetriesReachedAndErrorShown,
          },
        });
      },
      successCb: videoAssetResolvedSuccess,
    });

    const cancelCurrentVideoUpload = () => {
      cancelPolling();
      setTimeout(() => {
        setVideoUploading(false);
        localVideoUploading = false;
        setVideoUploadProgress(0);
      });
      if (operationPath) {
        transport.abortMultipartUpload(operationPath);
      }
    };

    setCancelVideoUpload({ cancelCb: cancelCurrentVideoUpload });
  };

  if (video) {
    const fileType = video.type;
    const allowedVideoType = VALID_VIDEO_MIME_TYPES[fileType.toLowerCase()];

    if (!allowedVideoType) {
      setVideoUploadError('Please upload a file in the MP4 or MOV format.');
      return;
    }
    const adVideoElId = 'ad-video-element';
    const videoEl = document.createElement('video');
    videoEl.style.position = 'fixed';
    videoEl.style.visibility = 'hidden';
    videoEl.style.top = '-100%';

    videoEl.preload = 'metadata';
    videoEl.id = adVideoElId;

    videoEl.onloadedmetadata = () => {
      const rawDuration = videoEl.duration;

      // For the actual duration value, we'll store the raw value and let the display logic handle rounding
      const durationToStore = rawDuration;

      // Only set duration if we have a valid value, store the raw duration for more accurate display
      if (!Number.isNaN(rawDuration) && Number.isFinite(rawDuration) && rawDuration > 0) {
        setVideoDuration(durationToStore);
      } else {
        CaptureException(new Error('Invalid video duration detected:'), {
          networkState: videoEl.networkState,
          rawDuration,
          readyState: videoEl.readyState,
          videoSrc: videoEl.src,
        });
      }

      // Extract video dimensions
      const { videoHeight, videoWidth } = videoEl;
      if (setVideoWidth && videoWidth) {
        setVideoWidth(videoWidth);
      }
      if (setVideoHeight && videoHeight) {
        setVideoHeight(videoHeight);
      }
    };

    videoEl.onloadeddata = async () => {
      setVideoUploadProgress(20);

      videoEl.remove();

      const reader = new FileReader();

      reader.onload = async (event) => {
        setVideoUploading(true);
        localVideoUploading = true;
        if (event?.target && event.target?.result) {
          const videoDurationInSeconds = videoEl?.duration;

          if (videoDurationInSeconds > VIDEO_DURATION_MAX_IN_SECONDS) {
            setVideoUploadError(`Video can be at most ${VIDEO_DURATION_MAX_IN_SECONDS} seconds.`);
            setVideoUploading(false);

            localVideoUploading = false;
            setVideoUploadProgress(0);
            return;
          }
        }

        if (!event?.target?.result || !(event.target.result instanceof ArrayBuffer)) {
          setVideoUploadError('Failed to read video file');
          setVideoUploading(false);
          localVideoUploading = false;
          setVideoUploadProgress(0);
          return;
        }

        const data = new Uint8Array(event.target.result);
        const chunkPlan = createUploadChunkPlan(videoSize);
        if (data) {
          const md5CheckSum = md5(data);
          const uploadData = {
            asset: {
              assetType,
              creationContext: {
                creator: {
                  userId: authenticatedUser!.id,
                },
                expectedPrice: 0,
              },
              description: 'Ads Video From Ads Manager',
              displayName: 'AdsVideo',
            },
            file: {
              chunkPlan,
              contentType: fileType,
              filesize: videoSize,
              md5CheckSum,
            },
          };

          try {
            localVideoUploading = true;
            setVideoUploading(true);
            setVideoUploadProgress(25);

            // 1. Get the upload operation data - this will give us the operation path and the upload urls
            const { operationPath, uploadUrls } = await getUploadOperationData(uploadData);
            setVideoUploadProgress(35);
            if (!operationPath || !uploadUrls.length) {
              encounteredErrorUploadingVideo();
              return;
            }

            // 2. Upload the video in chunks to the S3 urls
            const chunkData: Array<Uint8Array> = [];
            let offset = 0;
            chunkPlan.forEach((chunkSize) => {
              chunkData.push(data.slice(offset, offset + chunkSize));
              offset += chunkSize;
            });
            // const { videoS3UploadEndTimeMs, videoS3UploadStartTimeMs, videoUploadResponses } =
            const { videoUploadResponses } = await uploadVideoChunks(uploadUrls, chunkData);
            const etags: Array<string> = [];
            videoUploadResponses.forEach(({ headers, ok }) => {
              if (!ok) {
                localVideoUploading = false;
                return;
              }
              const etag = headers.get('ETag');
              if (etag) {
                etags.push(etag);
              }
            });
            // This will be set to false if the user clicks cancel - so we check for this at misc points cause that can happen async
            if (!localVideoUploading) {
              transport.abortMultipartUpload(operationPath);
              return;
            }
            setVideoUploadProgress(45);

            // 3. Mark the chunks as complete - this will tell the server that the chunk has been uploaded
            try {
              await markChunksComplete(etags, operationPath);
            } catch {
              encounteredErrorUploadingVideo();
              transport.abortMultipartUpload(operationPath);
              return;
            }
            // This will be set to false if the user clicks cancel - so we check for this at misc points cause that can happen async
            if (!localVideoUploading) {
              transport.abortMultipartUpload(operationPath);
              return;
            }

            // 4. Mark the upload as complete - this will tell the server that the upload has been completed
            // Poll and retry because there is a read after write consistency issue with the server
            PollWithRetryLimitAndCancelCallback({
              fn: async (): Promise<number | undefined> => {
                try {
                  await transport.markUploadComplete(operationPath);
                  return 200;
                } catch (err) {
                  CaptureException(err as Error);
                }
                return undefined;
              },
              interval: 500, // retry every 0.5 seconds
              maxRetries: 5, // for 5 times
              onMaxRetriesReached: () => {
                encounteredErrorUploadingVideo();
                transport.abortMultipartUpload(operationPath);
              },
              successCb: () => {
                // 5. Get the video asset id and polling for transcodeing
                fetchTranscodingStatusPoll(operationPath);
              },
            });
          } catch (err) {
            encounteredErrorUploadingVideo(err as Error);
          }
        }
      };

      reader.readAsArrayBuffer(video);
    };
    const dataUrl = URLUtil.createObjectURL(video);
    videoEl.src = dataUrl;
    document.body.append(videoEl);
  }
};

export const GetEndUserAdAssetStatus = (
  reviewDecision: ServerAdAssetCompositeReviewDecisionType,
) => {
  switch (reviewDecision) {
    case ServerAdAssetCompositeReviewDecisionType.PENDING_REVIEW:
      return 'Pending Review';
    case ServerAdAssetCompositeReviewDecisionType.REJECTED:
      return 'Rejected';
    case ServerAdAssetCompositeReviewDecisionType.APPROVED:
      return 'Approved';
    default:
      return 'Approved';
  }
};
