import { FormattedText } from '@modules/analytics-translations';
import { FileUploadBase } from '@modules/miscellaneous/common';
import { FileRejectStatus } from '@modules/miscellaneous/common/components/uploaders/';
import { bytesPerMB } from '@modules/miscellaneous/common/components/uploaders/constants/size';
import { getAppealsPortalUrl } from '@modules/miscellaneous/common/urls/www';
import { AssetType, ModerationState } from '@rbx/clients/assetsUploadApi';
import { useTranslation } from '@rbx/intl';
import {
  AccessTimeIcon,
  Button,
  DeleteOutlinedIcon,
  DialogTemplate,
  FormHelperText,
  Grid,
  LinearProgress,
  Link,
  Tooltip,
  Typography,
  useDialog,
  useSnackbar,
  WarningIcon,
} from '@rbx/ui';
import { RobloxVideoPlayer } from '@rbx/video-player';
import React, {
  Fragment,
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import type { CreatorStoreConfigurationType } from '../../creatorStore/components/CreatorStoreConfiguration/CreatorStoreConfiguration';
import useUploadVideoPreviewsFormStyles from './UploadVideoPreviewsForm.styles';
import {
  ACCEPTED_VIDEO_TYPES,
  DURATION_TOLERANCE_SECONDS,
  getVideoMetadata,
  getVideoQuota,
  MAX_DURATION_SECONDS,
  MAX_FILE_SIZE_MB,
  MAX_RESOLUTION,
  RECOMMENDED_BITRATE_MBPS,
  REQUIRED_ASPECT_RATIO,
  validateVideoFile,
} from './videoHelpers';

export type UploadVideoPreviewsFormProps = {
  uploadPreview: (file: File, fileAssetType: AssetType) => Promise<void>;
  deletePreview: (videoId: number) => Promise<void>;
  videoModerationState: ModerationState;
  videoType: AssetType;
  onVideoUploadComplete: () => void;
  refetchPreviewIds: () => Promise<void>;
  noticeMessage?: React.ReactNode;
  maxFileSizeMB?: number;
  uploadButtonTooltip?: FormattedText;
  minResolution?: { width: number; height: number };
  maxResolution?: { width: number; height: number };
  /** Whether to show upload progress. Defaults to false. */
  showProgress?: boolean;
  /** Optional message to show above the progress bar */
  progressMessage?: React.ReactNode;
  /** Current upload progress value (0-100) */
  progress?: number;
  hideLimitDescription?: boolean;
  showBitrateRecommendation?: boolean;
  isUploadDisabled?: boolean;
};

const FORM_FIELD_NAME = 'videoPreviewId';

const UploadVideoPreviewsForm: FunctionComponent<
  React.PropsWithChildren<UploadVideoPreviewsFormProps>
> = ({
  uploadPreview,
  deletePreview,
  videoModerationState,
  videoType,
  onVideoUploadComplete,
  refetchPreviewIds,
  noticeMessage,
  maxFileSizeMB,
  uploadButtonTooltip,
  minResolution,
  maxResolution = MAX_RESOLUTION,
  showProgress = false,
  progressMessage,
  progress = 0,
  hideLimitDescription = false,
  showBitrateRecommendation = false,
  isUploadDisabled = false,
}) => {
  const { control, setValue, watch } = useFormContext<CreatorStoreConfigurationType>();
  const {
    classes: {
      approvedStatusMessage,
      controlsContainer,
      errorMessage: errorMessageClassName,
      errorMessageHidden,
      fileNameContainer,
      headerDescription,
      headerTitle,
      mainContentContainer,
      moderationStatusBox: moderationStatusBoxClassName,
      moderationStatusIcon,
      moderationStatusMessage,
      rejectedMessagesContainer,
      removeButton,
      requirementInfoItem,
      uploadButton,
      videoInfoContainer,
      videoPlayerContainer,
    },
  } = useUploadVideoPreviewsFormStyles();
  const [isUploadingVideo, setIsUploadingVideo] = useState<boolean>(false);
  const [isDeletingVideo, setIsDeletingVideo] = useState<boolean>(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quotaMessage, setQuotaMessage] = useState<string>('');
  const [hasQuotaCapacity, setHasQuotaCapacity] = useState<boolean>(true);
  const pendingFileRef = React.useRef<File | null>(null);

  const videoPreviewId = watch(FORM_FIELD_NAME);
  const hasVideo = !!videoPreviewId;

  // Note: We don't need a useEffect for pendingFileRef since it's just for temporary storage
  // Using ref instead of state for immediate access without async updates

  const { translate, translateHTML } = useTranslation();

  // Create translated message with embedded appeal link
  const createVideoRejectedMessageWithLink = useCallback(
    (appealUrl: string) => {
      return translateHTML('Message.VideoRejectedWithAppeal', [
        {
          opening: 'linkStart',
          closing: 'linkEnd',
          content(chunks) {
            return (
              <Link href={appealUrl} target='_blank' underline='always'>
                {chunks}
              </Link>
            );
          },
        },
      ]);
    },
    [translateHTML],
  );

  const fetchVideoQuota = useCallback(
    async (videoAssetType: AssetType) => {
      const quotaInfo = await getVideoQuota(translate, videoAssetType);
      setQuotaMessage(quotaInfo.quotaMessage);
      setHasQuotaCapacity(quotaInfo.hasCapacity);
    },
    [translate],
  );

  // Fetch quota information for video previews
  useEffect(() => {
    fetchVideoQuota(videoType);
  }, [fetchVideoQuota, videoType]);

  const { enqueue } = useSnackbar();
  const { configure, open, close: closeDialog } = useDialog();

  const handleCancelDialog = useCallback(() => {
    pendingFileRef.current = null;
    closeDialog();
  }, [closeDialog]);

  const processVideoFile = useCallback(
    async (file: File) => {
      setErrorMessage(null);
      setIsUploadingVideo(true);

      try {
        // Use the existing preview IDs passed from parent
        await uploadPreview(file, videoType);
        // Set local file state to show uploaded state with reviewing moderation state.
        setVideoFile(file);
        onVideoUploadComplete();

        enqueue(
          {
            message: (
              <span data-testid='success-message'>{translate('Message.VideoUploadSuccess')}</span>
            ),
            autoHide: true,
          },
          (reason) => reason === 'timeout',
        );
      } catch {
        const errorMessageTranslated = translate('Message.VideoUploadFailure');
        setErrorMessage(errorMessageTranslated);
        enqueue(
          {
            message: errorMessageTranslated,
            autoHide: true,
          },
          (reason) => reason === 'timeout',
        );
      } finally {
        await refetchPreviewIds();
        // refetch quota information, since this might have changed irrespective
        // of video upload success or failure
        fetchVideoQuota(videoType);
        setIsUploadingVideo(false);
      }
    },
    [
      uploadPreview,
      enqueue,
      setErrorMessage,
      translate,
      onVideoUploadComplete,
      refetchPreviewIds,
      fetchVideoQuota,
      videoType,
    ],
  );

  const executeDeleteVideo = useCallback(async () => {
    setErrorMessage(null);
    setIsDeletingVideo(true);
    closeDialog();

    if (!videoPreviewId) {
      return;
    }

    try {
      await deletePreview(videoPreviewId);

      setValue(FORM_FIELD_NAME, null);
      setVideoFile(null);

      enqueue(
        {
          message: (
            <span data-testid='success-message'>
              {translate('Message.SuccessfullyDeleteVideo')}
            </span>
          ),
          autoHide: true,
        },
        (reason) => reason === 'timeout',
      );
    } catch {
      setErrorMessage(translate('Message.FailureDeleteVideo'));
    } finally {
      setIsDeletingVideo(false);
    }
  }, [videoPreviewId, deletePreview, setValue, closeDialog, enqueue, translate]);

  const removeVideoConfirmDialog = useMemo(() => {
    return (
      <DialogTemplate
        variant='alert'
        color='destructive'
        title={translate('Label.DeleteVideo')}
        content={translate('Message.DeleteVideoConfirmation')}
        cancelText={translate('Label.Cancel')}
        confirmText={translate('Label.Delete')}
        onCancel={handleCancelDialog}
        onConfirm={executeDeleteVideo}
      />
    );
  }, [handleCancelDialog, executeDeleteVideo, translate]);

  const handleConfirmUploadVideo = useCallback(async () => {
    const pendingFile = pendingFileRef.current;
    closeDialog();
    if (pendingFile) {
      try {
        await processVideoFile(pendingFile);
      } catch {
        // Error handling is done in processVideoFile
      }
    }
  }, [processVideoFile, closeDialog]);

  const createUploadVideoConfirmDialog = useCallback(() => {
    const fileName = pendingFileRef.current?.name || '';
    return (
      <DialogTemplate
        variant='alert'
        color='primaryBrand'
        title={translate('Label.UploadVideo')}
        content={
          <div>
            {translate('Message.UploadVideoConfirmation')}
            {fileName && (
              <div className={fileNameContainer}>{translate('Label.File', { fileName })}</div>
            )}
          </div>
        }
        cancelText={translate('Label.Cancel')}
        confirmText={translate('Label.UploadVideo')}
        onCancel={handleCancelDialog}
        onConfirm={handleConfirmUploadVideo}
      />
    );
  }, [handleCancelDialog, handleConfirmUploadVideo, translate, fileNameContainer]);

  const handleVideoFileChange = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) {
        return;
      }

      const file = files[0];

      setErrorMessage(null);

      // Basic file validation (synchronous)
      const validationErrors = validateVideoFile(file, maxFileSizeMB);

      if (validationErrors.length > 0) {
        // Convert validation errors to user-friendly messages
        const error = validationErrors[0]; // Show first error
        switch (error) {
          case FileRejectStatus.FileWrongType:
            setErrorMessage(translate('Message.WrongFormatError'));
            break;
          case FileRejectStatus.FileTooBig: {
            const effectiveMaxFileSizeMB = maxFileSizeMB ?? MAX_FILE_SIZE_MB;
            setErrorMessage(
              translate('Message.MaxSizeExceededError', {
                maxFileSize: `${effectiveMaxFileSizeMB}MB`,
              }),
            );
            break;
          }
          default:
            setErrorMessage(translate('Error.UnknownError'));
            break;
        }
        return;
      }

      // Video metadata validation (asynchronous)
      try {
        const { duration, width, height } = await getVideoMetadata(file);

        // Check duration
        // Allow a small tolerance (e.g., 0.1 seconds) for videos slightly over the max duration
        if (duration > MAX_DURATION_SECONDS + DURATION_TOLERANCE_SECONDS) {
          setErrorMessage(
            translate('Message.VideoDurationExceeded', {
              maxDuration: MAX_DURATION_SECONDS.toString(),
            }),
          );
          return;
        }

        // Check resolution
        if (width > maxResolution.width || height > maxResolution.height) {
          setErrorMessage(
            translate('Message.VideoResolutionExceeded', {
              maxWidth: maxResolution.width.toString(),
              maxHeight: maxResolution.height.toString(),
            }),
          );
          return;
        }

        if (minResolution && (width < minResolution.width || height < minResolution.height)) {
          setErrorMessage(
            translate('Message.VideoResolutionTooSmall', {
              minWidth: minResolution.width.toString(),
              minHeight: minResolution.height.toString(),
            }),
          );
          return;
        }
        // Check aspect ratio (16:9)
        const aspectRatio = width / height;
        const tolerance = 0.01; // Small tolerance for floating point comparison
        if (Math.abs(aspectRatio - REQUIRED_ASPECT_RATIO) > tolerance) {
          setErrorMessage(translate('Message.VideoWrongAspectRatio'));
          return;
        }
      } catch {
        // If we can't read metadata, let the server validate it
        // Don't block the upload here
      }

      // Only allow upload when no video exists
      if (!hasVideo && !videoFile) {
        pendingFileRef.current = file;
        configure(createUploadVideoConfirmDialog());
        open();
      }
    },
    [
      maxFileSizeMB,
      hasVideo,
      videoFile,
      translate,
      minResolution,
      maxResolution.width,
      maxResolution.height,
      configure,
      createUploadVideoConfirmDialog,
      open,
    ],
  );

  const handleDeleteClick = useCallback(() => {
    configure(removeVideoConfirmDialog);
    open();
  }, [configure, open, removeVideoConfirmDialog]);

  // Video player component for approved videos
  const videoPlayerComponent = useMemo(() => {
    if (!videoPreviewId) return null;

    return (
      <div className={videoPlayerContainer}>
        <RobloxVideoPlayer
          videoAssetId={videoPreviewId.toString()}
          environment={process.env.targetEnvironment === 'production' ? 'production' : 'sitetest1'}
          src={undefined}
          data-video='true'
        />
      </div>
    );
  }, [videoPreviewId, videoPlayerContainer]);

  const moderationStatusBox = useMemo(() => {
    const moderationState = videoModerationState;

    let icon;
    let message;

    switch (moderationState) {
      case ModerationState.Reviewing:
        icon = <AccessTimeIcon color='disabled' className={moderationStatusIcon} />;
        message = translate('Message.VideoStatusReviewing');
        break;
      case ModerationState.Rejected:
        icon = <WarningIcon color='disabled' className={moderationStatusIcon} />;
        message = '';
        break;
      default:
        // Default to reviewing state for unspecified or unknown states. This will be the state when the video is first uploaded.
        icon = <AccessTimeIcon color='disabled' className={moderationStatusIcon} />;
        message = translate('Message.VideoStatusReviewing');
        break;
    }

    return (
      <div>
        <div className={moderationStatusBoxClassName}>
          {icon}
          <Typography variant='body2' color='secondary' className={moderationStatusMessage}>
            {message}
          </Typography>
          {moderationState === ModerationState.Reviewing && (
            <Typography variant='body2' color='secondary' className={moderationStatusMessage}>
              {translate('Message.CheckBackLater')}
            </Typography>
          )}
        </div>
        {moderationState === ModerationState.Rejected && (
          <Grid container direction='column' spacing={0.5} className={rejectedMessagesContainer}>
            <Grid item>
              <Typography variant='body2' color='error'>
                {translate('Message.VideoRejected')}
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant='body2' color='secondary'>
                {createVideoRejectedMessageWithLink(getAppealsPortalUrl())}
              </Typography>
            </Grid>
          </Grid>
        )}
      </div>
    );
  }, [
    videoModerationState,
    createVideoRejectedMessageWithLink,
    translate,
    moderationStatusMessage,
    moderationStatusIcon,
    moderationStatusBoxClassName,
    rejectedMessagesContainer,
  ]);

  // Shared video requirements info component
  const videoRequirementsInfo = useMemo(
    () => (
      <Fragment>
        {quotaMessage && (
          <Typography variant='body2' color='secondary' className={requirementInfoItem}>
            {quotaMessage}
          </Typography>
        )}
        <Typography variant='body2' color='secondary' className={requirementInfoItem}>
          {translate('Label.Format')}*.mp4 *.mov
        </Typography>
        <Typography variant='body2' color='secondary' className={requirementInfoItem}>
          {translate('Message.AttachmentSizeLimit', {
            maxAttachmentSize: (maxFileSizeMB ?? MAX_FILE_SIZE_MB).toString(),
          })}
        </Typography>
        {showBitrateRecommendation && (
          <Typography variant='body2' color='secondary' className={requirementInfoItem}>
            {translate('Message.BitrateRecommendationText', {
              recommendedBitrate: RECOMMENDED_BITRATE_MBPS.toString(),
            })}
          </Typography>
        )}
        <Typography variant='body2' color='secondary' className={requirementInfoItem}>
          {translate('Message.DurationLimitText', { maxDuration: MAX_DURATION_SECONDS.toString() })}
        </Typography>
        {minResolution && (
          <Typography variant='body2' color='secondary' className={requirementInfoItem}>
            {translate('Message.MinResolutionLimitText', {
              minResolution: `${minResolution.width}x${minResolution.height}`,
            })}
          </Typography>
        )}
        <Typography variant='body2' color='secondary' className={requirementInfoItem}>
          {translate('Message.MaxResolutionLimitText', {
            maxResolution: `${maxResolution.width}x${maxResolution.height}`,
          })}
        </Typography>
        <Typography variant='body2' color='secondary' className={requirementInfoItem}>
          {translate('Message.AspectRatioLimitText', { aspectRatio: '16:9' })}
        </Typography>
      </Fragment>
    ),
    [
      quotaMessage,
      translate,
      requirementInfoItem,
      maxFileSizeMB,
      showBitrateRecommendation,
      minResolution,
      maxResolution.width,
      maxResolution.height,
    ],
  );

  return (
    <Controller
      name={FORM_FIELD_NAME}
      control={control}
      render={() => (
        <Grid container spacing={2}>
          {/* Shared Header */}
          <Grid item container direction='column' XSmall={12}>
            <Typography variant='h5' component='h2' className={headerTitle}>
              {translate('Label.Video')}
            </Typography>
            {noticeMessage && (
              <Typography variant='body2' color='secondary' className={headerDescription}>
                {noticeMessage}
              </Typography>
            )}
            {!hideLimitDescription && (
              <Typography variant='body2' color='secondary' className={headerDescription}>
                {translate('Message.VideoLimitDescription')}
              </Typography>
            )}
          </Grid>

          {hasVideo || videoFile ? (
            // Uploaded state
            <Fragment>
              {/* Main content area */}
              <Grid container item XSmall={12} spacing={2} className={mainContentContainer}>
                {/* Video preview area */}
                <Grid item XSmall={12} Large={8}>
                  {videoModerationState === ModerationState.Approved
                    ? videoPlayerComponent
                    : moderationStatusBox}
                </Grid>

                {/* Controls area */}
                <Grid item XSmall={12} Large={4}>
                  <div className={controlsContainer}>
                    <Button
                      variant='outlined'
                      color='primary'
                      startIcon={<DeleteOutlinedIcon />}
                      onClick={handleDeleteClick}
                      loading={isDeletingVideo}
                      className={removeButton}>
                      {translate('Action.Remove')}
                    </Button>

                    {/* Video info positioned on the right */}
                    <div className={videoInfoContainer}>
                      {videoModerationState === ModerationState.Approved && (
                        <Typography
                          variant='body2'
                          color='secondary'
                          className={approvedStatusMessage}>
                          {translate('Message.VideoApproved')}
                        </Typography>
                      )}
                      {videoRequirementsInfo}
                    </div>
                  </div>
                </Grid>
              </Grid>
            </Fragment>
          ) : (
            // Upload state
            <Fragment>
              {/* Upload button */}
              <Grid item XSmall={12}>
                <FileUploadBase
                  accept={ACCEPTED_VIDEO_TYPES.map((type) => `.${type}`).join(',')}
                  size={(maxFileSizeMB ?? MAX_FILE_SIZE_MB) * bytesPerMB}
                  onChange={handleVideoFileChange}>
                  {(onClick: () => void) => (
                    <Tooltip title={uploadButtonTooltip} arrow placement='top'>
                      {/** Need to wrap Button with a <span> element because
                       * Tooltip component does not work on a disabled button with pointer-event: none
                       */}
                      <span style={{ display: 'inline-block' }}>
                        <Button
                          variant='contained'
                          color='primary'
                          onClick={onClick}
                          disabled={
                            isUploadingVideo ||
                            isDeletingVideo ||
                            !hasQuotaCapacity ||
                            isUploadDisabled
                          }
                          loading={isUploadingVideo}
                          data-testid='upload-video-button'
                          className={uploadButton}>
                          {translate('Label.UploadVideo')}
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                </FileUploadBase>
                {isUploadingVideo && showProgress && (
                  <Grid container item XSmall={12} spacing={1} data-testid='video-upload-progress'>
                    {progressMessage && (
                      <Grid item XSmall={12}>
                        <Typography variant='body2' color='error'>
                          {progressMessage}
                        </Typography>
                      </Grid>
                    )}
                    <Grid item XSmall={12}>
                      <LinearProgress
                        value={progress ?? 0}
                        variant='determinate'
                        title=''
                        data-testid='video-upload-progress-bar'
                      />
                    </Grid>
                  </Grid>
                )}
              </Grid>

              {/* Format info */}
              <Grid item XSmall={12}>
                <div>{videoRequirementsInfo}</div>
              </Grid>
            </Fragment>
          )}

          {/* Error messages */}
          <Grid item XSmall={12}>
            <FormHelperText
              error
              className={errorMessage ? errorMessageClassName : errorMessageHidden}>
              {errorMessage || ' '}
            </FormHelperText>
          </Grid>
        </Grid>
      )}
    />
  );
};

export default UploadVideoPreviewsForm;
