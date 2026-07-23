import { Button, Divider } from '@rbx/foundation-ui';
import { Card, Grid, Typography, useTheme } from '@rbx/ui';
import React, { DragEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';

import VideoUploadCard from '@components/campaignBuilder/common/creative/videoSection/VideoUploadCard';
import useVideoUploadDragAndDropZoneStyles from '@components/campaignBuilder/common/creative/videoSection/VideoUploadDragAndDropZone.styles';
import { openImpersonationErrorDialog } from '@components/common/dialog/impersonationErrorDialog';
import { FormField } from '@constants/campaignBuilder';
import { VIDEO_ACCEPT_FORMATS } from '@constants/fileUpload';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import { useAuthenticatedUser } from '@hooks/useAuthenticatedUser';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { UploadedVideoType, VideoUploadState } from '@type/fileUpload';
import { UploadVideo, VideoURLManager } from '@utils/fileUpload';
import { GetLocalStorage, StorageKeys } from '@utils/localStorage';
import {
  CreateStagedVideo,
  ErrorVideoUpload,
  FinishVideoUpload,
  RemoveVideoFromMap,
  StartVideoUpload,
  UpdateVideoInMap,
} from '@utils/videoStateHelpers';

const VideoUploadDragAndDropZone = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const theme = useTheme();
  const {
    classes: { sectionMarginTop },
  } = useVideoUploadDragAndDropZoneStyles();
  const { adAccountId = GetLocalStorage(StorageKeys.AD_ACCOUNT_ID) } = useAppStore(
    (state: AppStoreType) => state.appData,
  );

  const [dragActive, setDragActive] = useState<boolean>(false);
  const [videos, setVideos] = useState<Map<string, UploadedVideoType>>(new Map());

  const authenticatedUser = useAuthenticatedUser();
  const isImpersonating = document.cookie.includes('ad-account-imp-info');
  const inputFile = useRef<HTMLInputElement | null>(null);
  const formVideos = useWatch<FormType, typeof FormField.VIDEOS>({ name: FormField.VIDEOS });
  const { getValues, setValue } = useFormContext<FormType>();
  const { offPlatformRequestMaximumRawVideos: maxAllowedVideos } = useAppStore(
    (state) => state.appMetadataState.data,
  );

  const { setIsVideoUploadInProgress } = useCampaignBuilderStore();

  const updateFormWithVideo = useCallback(
    (video: UploadedVideoType) => {
      const currentFormVideos = getValues(FormField.VIDEOS);
      // Only add video if we haven't reached the limit
      if (currentFormVideos.length < maxAllowedVideos) {
        setValue(FormField.VIDEOS, [...currentFormVideos, video]);
      }
    },
    [getValues, setValue, maxAllowedVideos],
  );

  const handleUploadError = useCallback(
    (error: string, videoId: string) => {
      setVideos((prev) => {
        const video = prev.get(videoId);
        if (!video) {
          return prev;
        }
        const errorVideo = ErrorVideoUpload(video, error || translate('Description.UploadFailed'));
        return UpdateVideoInMap(prev, videoId, errorVideo);
      });

      if (isImpersonating) {
        openImpersonationErrorDialog();
      }
    },
    [isImpersonating, translate],
  );

  const addVideoToMap = useCallback((video: UploadedVideoType) => {
    setVideos((prev) => {
      const newVideos = new Map(prev);
      newVideos.set(video.id, video);
      return newVideos;
    });
  }, []);

  const removeVideoFromMap = useCallback((videoId: string) => {
    setVideos((prev) => {
      const video = prev.get(videoId);
      if (!video) {
        return prev;
      }

      if (video.state === VideoUploadState.UPLOADING && video.cancelCb) {
        video.cancelCb();
      }

      VideoURLManager.revokeVideoURL(videoId);
      return RemoveVideoFromMap(prev, videoId);
    });
  }, []);

  const retryVideoUpload = useCallback((videoId: string) => {
    setVideos((prev) => {
      const video = prev.get(videoId);
      if (!video || video.state !== VideoUploadState.ERROR) {
        return prev;
      }

      // Reset the video to staged state for retry
      const retriedVideo = CreateStagedVideo(video.file as File, video.id);
      return UpdateVideoInMap(prev, videoId, retriedVideo);
    });
  }, []);

  const videosByState = useMemo(() => {
    const staged: UploadedVideoType[] = [];
    const uploading: UploadedVideoType[] = [];
    const finished: UploadedVideoType[] = [];
    const error: UploadedVideoType[] = [];
    const staging: UploadedVideoType[] = [];

    videos.forEach((video) => {
      switch (video.state) {
        case VideoUploadState.STAGED:
          staged.push(video);
          staging.push(video);
          break;
        case VideoUploadState.UPLOADING:
          uploading.push(video);
          staging.push(video);
          break;
        case VideoUploadState.FINISHED:
          finished.push(video);
          break;
        case VideoUploadState.ERROR:
          error.push(video);
          staging.push(video);
          break;
        default:
          break;
      }
    });

    return { error, finished, staged, staging, uploading };
  }, [videos]);

  const {
    error: errorVideos,
    staged: stagedVideos,
    staging: stagingVideos,
    uploading: uploadingVideos,
  } = videosByState;

  const {
    hasAnyPendingVideos,
    hasPendingVideos,
    isAtCapacity,
    stagingVideoCount,
    uploadedVideoCount,
  } = useMemo(() => {
    const uploaded = formVideos;
    const total = uploaded.length + stagingVideos.length;
    return {
      hasAnyPendingVideos: stagingVideos.length > 0,
      hasPendingVideos: stagedVideos.length > 0,
      isAtCapacity: total >= maxAllowedVideos,
      stagingVideoCount: stagingVideos.length,
      uploadedVideoCount: uploaded.length,
    };
  }, [stagingVideos, stagedVideos, formVideos, maxAllowedVideos]);

  useEffect(() => {
    setIsVideoUploadInProgress(uploadingVideos.length > 0);
  }, [uploadingVideos, setIsVideoUploadInProgress]);

  useEffect(
    () => () => {
      Array.from(videos.values()).forEach((video) => {
        VideoURLManager.revokeVideoURL(video.id);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleUploadAll = useCallback(async () => {
    if (stagedVideos.length === 0) {
      return;
    }

    try {
      stagedVideos.forEach((stagedVideo) => {
        setVideos((prev) => {
          const video = prev.get(stagedVideo.id);
          if (!video) {
            return prev;
          }
          return UpdateVideoInMap(prev, stagedVideo.id, StartVideoUpload(video));
        });
      });

      const uploadPromises = stagedVideos.map(
        (stagedVideo) =>
          new Promise<void>((resolve, reject) => {
            UploadVideo({
              adAccountId,
              authenticatedUser,
              setCancelVideoUpload: ({ cancelCb }) => {
                setVideos((prev) => {
                  const video = prev.get(stagedVideo.id);
                  if (!video) {
                    return prev;
                  }
                  const uploadingVideo = { ...StartVideoUpload(video), cancelCb };
                  return UpdateVideoInMap(prev, stagedVideo.id, uploadingVideo);
                });
              },
              setUploadedVideo: (uploadedFile: Blob | undefined, assetId: string) => {
                if (uploadedFile) {
                  setVideos((currentVideos) => {
                    const video = currentVideos.get(stagedVideo.id);
                    if (!video) {
                      return currentVideos;
                    }
                    const finishedVideo = {
                      ...FinishVideoUpload(video, assetId),
                      file: uploadedFile,
                    };
                    const updatedMap = UpdateVideoInMap(
                      currentVideos,
                      stagedVideo.id,
                      finishedVideo,
                    );

                    const completedVideo = updatedMap.get(stagedVideo.id);
                    if (completedVideo) {
                      updateFormWithVideo(completedVideo);
                      // Remove the completed video from staging since it's now in the form
                      return RemoveVideoFromMap(updatedMap, stagedVideo.id);
                    }

                    return updatedMap;
                  });
                }
                resolve();
              },
              setVideoDuration: (duration: number) => {
                setVideos((prev) => {
                  const video = prev.get(stagedVideo.id);
                  if (!video) {
                    return prev;
                  }
                  const updatedVideo = { ...video, duration };
                  return UpdateVideoInMap(prev, stagedVideo.id, updatedVideo);
                });
              },
              setVideoHeight: (height: number) => {
                setVideos((prev) => {
                  const video = prev.get(stagedVideo.id);
                  if (!video) {
                    return prev;
                  }
                  const updatedVideo = { ...video, height };
                  return UpdateVideoInMap(prev, stagedVideo.id, updatedVideo);
                });
              },
              setVideoUploadError: (error: string | undefined) => {
                handleUploadError(error || translate('Description.UploadFailed'), stagedVideo.id);
                reject(new Error(error || translate('Description.UploadFailed')));
              },
              setVideoUploading: (uploading: boolean) => {
                if (uploading) {
                  setVideos((prev) => {
                    const video = prev.get(stagedVideo.id);
                    if (!video) {
                      return prev;
                    }
                    const updatedVideo = StartVideoUpload(video);
                    return UpdateVideoInMap(prev, stagedVideo.id, updatedVideo);
                  });
                }
              },
              setVideoUploadProgress: (progress: number) => {
                setVideos((prev) => {
                  const video = prev.get(stagedVideo.id);
                  if (!video) {
                    return prev;
                  }

                  if (!video.progress || progress > video.progress) {
                    const updatedVideo = { ...video, progress };
                    return UpdateVideoInMap(prev, stagedVideo.id, updatedVideo);
                  }
                  return prev;
                });
              },
              setVideoWidth: (width: number) => {
                setVideos((prev) => {
                  const video = prev.get(stagedVideo.id);
                  if (!video) {
                    return prev;
                  }
                  const updatedVideo = { ...video, width };
                  return UpdateVideoInMap(prev, stagedVideo.id, updatedVideo);
                });
              },
              video: stagedVideo.file as File,
            });
          }),
      );

      await Promise.allSettled(uploadPromises);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Batch upload failed:', error);
      }
      if (isImpersonating) {
        openImpersonationErrorDialog();
      }
    }
  }, [
    stagedVideos,
    adAccountId,
    authenticatedUser,
    isImpersonating,
    updateFormWithVideo,
    handleUploadError,
    translate,
  ]);

  const handleStageFiles = useCallback(
    (files: FileList) => {
      if (isImpersonating) {
        openImpersonationErrorDialog();
        return;
      }

      // Check capacity before processing files
      const currentFormVideos = getValues(FormField.VIDEOS);
      const currentTotal = currentFormVideos.length + stagingVideos.length;
      if (currentTotal >= maxAllowedVideos) {
        // Already at capacity, don't process any files
        return;
      }

      const filesToProcess = Array.from(files).slice(0, maxAllowedVideos - currentTotal);

      if (filesToProcess.length < files.length) {
        // Show warning if some files will be ignored
        // eslint-disable-next-line no-console
        console.warn(
          `Can only upload ${filesToProcess.length} more videos. Limit is ${maxAllowedVideos} total.`,
        );
      }

      filesToProcess.forEach((file) => {
        const checkIsDuplicate = (video: UploadedVideoType) =>
          video.file instanceof File &&
          video.file.name === file.name &&
          video.file.size === file.size;

        // Only check staging videos (videos in current upload session)
        const allStagingVideos = Array.from(videos.values());
        const duplicateInStaging = allStagingVideos.find(checkIsDuplicate);

        // Check form videos (successfully uploaded videos) - get fresh values
        const freshFormVideos = getValues(FormField.VIDEOS);
        const duplicateInFormVideos = freshFormVideos.find(checkIsDuplicate);

        if (duplicateInStaging || duplicateInFormVideos) {
          // Remove any existing error for this duplicate file to clean up UI
          const existingError = errorVideos.find(checkIsDuplicate);
          if (existingError) {
            removeVideoFromMap(existingError.id);
          }

          // Create new video with error state for duplicate
          const newVideoId = uuidv4();
          const stagedVideo = CreateStagedVideo(file, newVideoId);
          const errorVideo = ErrorVideoUpload(
            stagedVideo,
            translate('Description.VideoAlreadyUploaded'),
          );
          addVideoToMap(errorVideo);

          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.warn(`Duplicate video upload: ${file.name}`);
          }
          return;
        }

        const existingError = errorVideos.find(checkIsDuplicate);
        if (existingError) {
          removeVideoFromMap(existingError.id);
        }

        const newVideoId = uuidv4();
        const newVideo = CreateStagedVideo(file, newVideoId);

        addVideoToMap(newVideo);
      });

      if (inputFile.current) {
        inputFile.current.value = '';
      }
    },
    [
      isImpersonating,
      videos,
      errorVideos,
      stagingVideos,
      maxAllowedVideos,
      addVideoToMap,
      removeVideoFromMap,
      getValues,
      translate,
    ],
  );

  const handleDrag = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && !isAtCapacity) {
        handleStageFiles(e.dataTransfer.files);
      }
    },
    [handleStageFiles, isAtCapacity],
  );

  const onVideoUploadClick = useCallback(() => {
    if (!isAtCapacity) {
      inputFile.current?.click();
    }
  }, [isAtCapacity]);

  useEffect(() => {
    if (isImpersonating) {
      (async () => {
        const response = await fetch(
          `${process.env.assetPathPrefix}/common/impersonation_asset_video.mp4`,
        );
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([new Uint8Array(arrayBuffer)], { type: 'video/mp4' });

        const videoId = uuidv4();
        const video = CreateStagedVideo(blob as File, videoId);
        const finishedVideo = { ...FinishVideoUpload(video, `asset-${videoId}`), duration: 3 };

        addVideoToMap(finishedVideo);
      })();
    }
  }, [isImpersonating, addVideoToMap]);

  const assetsSectionTitle = translate('Heading.SelectedVideos', {
    count: String(stagingVideoCount),
  });
  const uploadedAssetsSectionTitle = translate('Heading.UploadedVideos', {
    max: String(maxAllowedVideos),
    uploaded: String(uploadedVideoCount),
  });
  const uploadButtonText = translate('Action.UploadMedia');

  const dragOverStyle = useMemo(
    () => ({
      backgroundColor: dragActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
      borderStyle: 'dashed',
      cursor: 'pointer',
    }),
    [dragActive],
  );

  const renderFileInput = useCallback(
    () => (
      <input
        accept={VIDEO_ACCEPT_FORMATS}
        hidden
        multiple
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0 && !isAtCapacity) {
            handleStageFiles(e.target.files);
          }
        }}
        ref={inputFile}
        type='file'
      />
    ),
    [handleStageFiles, isAtCapacity],
  );

  const renderSelectMediaSection = useCallback(
    () => (
      <Grid className={sectionMarginTop} item>
        <Card
          onClick={isAtCapacity ? undefined : onVideoUploadClick}
          onDragEnter={isAtCapacity ? undefined : handleDrag}
          onDragLeave={isAtCapacity ? undefined : handleDrag}
          onDragOver={isAtCapacity ? undefined : handleDrag}
          onDrop={isAtCapacity ? undefined : handleDrop}
          style={{
            ...dragOverStyle,
            cursor: isAtCapacity ? 'not-allowed' : 'pointer',
            opacity: isAtCapacity ? 0.5 : 1,
          }}
          variant='outlined'>
          <Grid
            alignItems='center'
            container
            direction='column'
            paddingBottom='32px'
            paddingTop='32px'
            paddingX={2}
            spacing={1}>
            <Grid item>
              <Button
                isDisabled={isAtCapacity}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent event bubbling to Card's onClick
                  onVideoUploadClick();
                }}
                size='Medium'
                variant='Standard'>
                {translate('Action.SelectMedia')}
              </Button>
            </Grid>
            <Grid item>
              <Typography color='secondary' textAlign='center' variant='caption'>
                {isAtCapacity
                  ? translate('Description.VideoLimitReached', { max: String(maxAllowedVideos) })
                  : translate('Description.DragAndDropVideo')}
              </Typography>
            </Grid>
            <Grid item>
              <Typography color='secondary' textAlign='center' variant='caption'>
                {translate('Description.VideoSupportedFormats')}
              </Typography>
            </Grid>
          </Grid>
        </Card>
      </Grid>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      onVideoUploadClick,
      handleDrag,
      handleDrop,
      dragOverStyle,
      isAtCapacity,
      maxAllowedVideos,
      translate,
    ],
  );

  const renderStagingVideoCard = useCallback(
    (video: UploadedVideoType, index: number) => (
      <>
        {index > 0 && (
          <Grid item>
            <Divider />
          </Grid>
        )}
        <Grid item>
          <VideoUploadCard
            disabled={false}
            isStaged={video.state === VideoUploadState.STAGED}
            onCancel={
              video.state === VideoUploadState.UPLOADING && video.cancelCb
                ? () => {
                    removeVideoFromMap(video.id);
                  }
                : undefined
            }
            onRemove={() => {
              removeVideoFromMap(video.id);
            }}
            onRetry={
              video.state === VideoUploadState.ERROR
                ? () => {
                    retryVideoUpload(video.id);
                  }
                : undefined
            }
            video={video}
          />
        </Grid>
      </>
    ),
    [removeVideoFromMap, retryVideoUpload],
  );

  const renderUploadedVideoCard = useCallback(
    (video: UploadedVideoType, index: number) => (
      <>
        {index > 0 && (
          <Grid item>
            <Divider />
          </Grid>
        )}
        <Grid item>
          <VideoUploadCard
            allUploadedVideos={formVideos}
            disabled={false}
            isStaged={false}
            onRemove={() => {
              const currentFormVideos = getValues(FormField.VIDEOS);
              setValue(
                FormField.VIDEOS,
                currentFormVideos.filter((v: UploadedVideoType) => v.id !== video.id),
              );
            }}
            video={video}
          />
        </Grid>
      </>
    ),
    [formVideos, getValues, setValue],
  );

  const renderStagingSection = useCallback(
    () => (
      <>
        <Grid className={sectionMarginTop} item>
          <Typography fontWeight='bold' variant='h6'>
            {assetsSectionTitle}
          </Typography>
        </Grid>
        <Grid item>
          <Divider />
        </Grid>

        {hasAnyPendingVideos ? (
          stagingVideos.map((video, index) => (
            <React.Fragment key={video.id}>{renderStagingVideoCard(video, index)}</React.Fragment>
          ))
        ) : (
          <Grid item>
            <Typography color='secondary' variant='body2'>
              {translate('Description.NoVideosStagedForUpload')}
            </Typography>
          </Grid>
        )}

        <Grid item>
          <Button
            isDisabled={!hasPendingVideos}
            onClick={handleUploadAll}
            size='Medium'
            variant='Emphasis'>
            {uploadButtonText}
          </Button>
        </Grid>
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      assetsSectionTitle,
      hasAnyPendingVideos,
      stagingVideos,
      renderStagingVideoCard,
      hasPendingVideos,
      handleUploadAll,
      uploadButtonText,
    ],
  );

  const renderUploadedVideosSection = useCallback(
    () => (
      <>
        <Grid className={sectionMarginTop} item>
          <Typography fontWeight='bold' variant='h6'>
            {uploadedAssetsSectionTitle}
          </Typography>
        </Grid>
        <Grid item>
          <Divider />
        </Grid>

        {uploadedVideoCount > 0 ? (
          formVideos.map((video: UploadedVideoType, index: number) => (
            <React.Fragment key={video.id}>{renderUploadedVideoCard(video, index)}</React.Fragment>
          ))
        ) : (
          <Grid item>
            <Typography color='secondary' variant='body2'>
              {translate('Description.NoVideosUploadedYet')}
            </Typography>
          </Grid>
        )}
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uploadedAssetsSectionTitle, uploadedVideoCount, formVideos, renderUploadedVideoCard],
  );

  return (
    <Grid container direction='column' spacing={theme.spacing(3)}>
      {renderFileInput()}

      <Grid
        container
        direction='column'
        paddingX={theme.spacing(4)}
        paddingY={theme.spacing(4)}
        spacing={theme.spacing(3)}>
        {renderSelectMediaSection()}
        {stagingVideoCount > 0 && renderStagingSection()}
        {uploadedVideoCount > 0 && renderUploadedVideosSection()}
      </Grid>
    </Grid>
  );
};

export default VideoUploadDragAndDropZone;
