import {
  Button,
  CircularProgress,
  FormHelperText,
  makeStyles,
  ReportProblemOutlinedIcon,
  TCircularProgressProps,
  Typography,
} from '@rbx/ui';
import { md5 } from 'js-md5';
import { noop } from 'lodash';
import { ChangeEvent, DragEvent, useContext, useEffect, useRef, useState } from 'react';

import { ContextName, EventName, unifiedLogger } from '@clients/unifiedLogger';
import { CampaignObjectiveType } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import { useAuthenticatedUser } from '@hooks/useAuthenticatedUser';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import getLivePreviewModalConfig from '@modules/app/utility-components/livePreviewModal';
import { CreateCampaignMetadataContext } from '@modules/creation/contexts/createCampaignPageContext';
import { createCampaignWizardModel } from '@modules/creation/wizard/models/createCampaignWizard/createCampaignWizardModel';
import VideoAssetComponent from '@modules/miscellaneous/video/videoAssetComponent';
import {
  abortMultipartUpload,
  getMultipartVideoUploadOperationData,
  getVideoAssetId,
  markChunkComplete,
  markUploadComplete,
} from '@services/video/uploadVideo';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useModalStore } from '@stores/modalStoreProvider';
import { ServerAdAssetCompositeReviewDecisionType } from '@type/ad';
import { AdSetBidType } from '@type/adSet';
import { GetMultipartVideoUploadOperationDataRequest } from '@type/fileUpload';
import { CalculateAspectRatio } from '@utils/assets';
import { GetEndUserDisplayCampaignObjective } from '@utils/campaignBuilder';
import { CaptureException } from '@utils/error';
import { SetErrorModalImpersonationConfig } from '@utils/errorModalImpersonation';
import { GetEndUserAdAssetStatus } from '@utils/fileUpload';
import { GetLocalStorage, StorageKeys } from '@utils/localStorage';
import { TODOFIXANY } from 'app/shared/types';
import { PollWithRetryLimitAndCancelCallback } from 'app/util/fns';

import UploadedVideoReviewComponentDynamic from '../uploadedVideoReviewComponentDynamic';

const ONE_HUNDRED_MB_IN_BYTES = 100000000;
const MAX_CHUNKING_SIZE = 10 * 1000 * 1000; // 10MB in bytes

const VALID_VIDEO_MIME_TYPES: { [id: string]: boolean } = {
  'video/3g2': true,
  'video/3gp': true,
  'video/3gp2': true,
  'video/3gpp': true,
  'video/asf': true,
  'video/asx': true,
  'video/avi': true,
  'video/divx': true,
  'video/m4v': true,
  // These are all the formats that are covered under the `mov` format
  'video/mov': true,
  'video/mp4': true,
  'video/mpe': true,
  'video/mpeg': true,
  'video/mpg': true,
  'video/ogg': true,
  'video/quicktime': true,
  'video/wmv': true,
  'video/x-m4v': true,
};

const CircularProgressWithLabel = (props: TCircularProgressProps) => {
  const {
    classes: { smallText },
  } = makeStyles()(() => ({
    smallText: {
      fontSize: 10,
    },
  }))();
  const { value = 0 } = props;
  return (
    <div style={{ display: 'inline-flex', position: 'relative' }}>
      <CircularProgress {...props} />
      <div
        style={{
          alignItems: 'center',
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        }}>
        <Typography className={smallText} color='secondary' component='div' variant='caption'>
          {`${Math.round(value)}%`}
        </Typography>
      </div>
    </div>
  );
};

const AdVideoUploadDisplayComponent = ({
  disableInputs,
  formikInfo,
  isEditAd,
}: {
  disableInputs: boolean;
  formikInfo: TODOFIXANY;
  isEditAd: boolean;
}) => {
  const {
    classes: {
      configureAdRow,
      customHelperText,
      hidden,
      progressContainer,
      uploadContainer,
      uploadSubtitle,
      videoUploadError,
      videoUploadErrorContainer,
      videoUploadErrorIcon,
      videoUploadHelperText,
    },
  } = makeStyles()(() => ({
    configureAdRow: {
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
      marginBottom: 24,
      marginTop: 24,
      width: '100%',
    },

    customHelperText: {
      marginTop: '3px !important',
    },

    hidden: {
      display: 'none',
      visibility: 'hidden',
    },

    progressContainer: {
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      height: '100%',
      justifyContent: 'center',
      width: '100%',
    },

    uploadContainer: {
      alignContent: 'flex-start',
      alignItems: 'center',
      borderColor: 'white',
      borderStyle: 'dashed',
      borderWidth: 1,
      display: 'flex',
      flexWrap: 'wrap',
      height: 184,
      justifyContent: 'center',
      marginTop: 24,
      width: '100%',
    },

    uploadSubtitle: {
      marginTop: 16,
    },

    videoUploadError: {
      alignContent: 'center',
      display: 'flex',
      marginTop: 16,
    },

    videoUploadErrorContainer: {
      marginBottom: 8,
    },

    videoUploadErrorIcon: {
      marginRight: 8,
    },

    videoUploadHelperText: {
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
      marginTop: 16,
      width: '100%',
    },
  }))();

  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { adAccountId = GetLocalStorage(StorageKeys.AD_ACCOUNT_ID) } = useAppStore(
    (state: AppStoreType) => state.appData,
  );

  const { setUploadedVideo, setVideoDuration, uploadedVideo, videoDuration } = useContext(
    CreateCampaignMetadataContext,
  );

  const adAccountIsInternalManaged = useAppStore(
    (state: AppStoreType) => state.adAccountIsInternalManaged,
  );

  const videoDurationMaxInSeconds = adAccountIsInternalManaged() ? 300 : 30;

  const { setModalConfigData, setModalOpen } = useModalStore();
  const authenticatedUser = useAuthenticatedUser();
  const userName = authenticatedUser?.name ?? '';
  const isImpersonating = document.cookie.includes('ad-account-imp-info');

  const livePreview = async () => {
    if (isImpersonating) {
      SetErrorModalImpersonationConfig(setModalOpen, setModalConfigData);
      return;
    }

    setModalOpen(true);
    setModalConfigData(
      getLivePreviewModalConfig({
        formik: formikInfo,
        setModalOpen,
        userName,
      }),
    );
  };

  // useState is not quick enough for some of our local needs
  let localVideoUploading = false;
  let videoUploadStartTimeMs: number;
  let videoUploadEndTimeMs: number;
  let videoS3UploadStartTimeMs: number;
  let videoS3UploadEndTimeMs: number;
  let videoTranscodeStartTimeMs: number;
  let videoTranscodeEndTimeMs: number;

  const [videoUploading, setVideoUploading] = useState<boolean>(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [assetReplaced, setAssetReplaced] = useState<boolean>(false);
  const [useThumbnailForVideo, setUseThumbnailForVideo] = useState(false);
  const [cancelVideoUpload, setCancelVideoUpload] = useState<{ cancelCb: () => void }>({
    cancelCb: () => {
      localVideoUploading = false;
      setVideoUploading(false);
      setVideoUploadProgress(0);
    },
  });

  const inputFile = useRef(null);
  const URLUtil = window?.URL || window?.webkitURL;

  const isVideoViewObjective =
    formikInfo.values.campaignObjective === CampaignObjectiveType.VIDEO_VIEWS;
  const isAwarenessViewObjective =
    formikInfo.values.campaignObjective === CampaignObjectiveType.AWARENESS;

  const clearPreviouslyUploadedInfo = () => {
    setUploadedVideo(undefined);
    formikInfo.setFieldValue(createCampaignWizardModel.formField.adAssetWidth.name, undefined);
    formikInfo.setFieldValue(createCampaignWizardModel.formField.adAssetHeight.name, undefined);
    formikInfo.setFieldValue(createCampaignWizardModel.formField.adVideoAssetId.name, undefined);
    formikInfo.setFieldValue(createCampaignWizardModel.formField.adVideoDurationMs.name, undefined);
    if (inputFile && inputFile.current) {
      // @ts-ignore */
      inputFile.current.value = null;
    }
  };

  const uploadFile = () => {
    if (isImpersonating) {
      SetErrorModalImpersonationConfig(setModalOpen, setModalConfigData);
      return;
    }

    if (localVideoUploading) {
      return;
    }

    setVideoUploadProgress(0);

    if (inputFile && inputFile.current) {
      clearPreviouslyUploadedInfo();

      // @ts-ignore */
      inputFile.current.click();
    }
  };

  useEffect(() => {
    if (isImpersonating) {
      (async () => {
        const response = await fetch(
          `${process.env.assetPathPrefix}/common/impersonation_asset_video.mp4`,
        );
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([new Uint8Array(arrayBuffer)], { type: 'video/mp4' });

        formikInfo.setFieldValue(createCampaignWizardModel.formField.adAssetWidth.name, 1920);
        formikInfo.setFieldValue(createCampaignWizardModel.formField.adAssetHeight.name, 1080);
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.adVideoAssetId.name,
          'simulated-video-asset-id',
        );
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.compositeReviewDecision.name,
          ServerAdAssetCompositeReviewDecisionType.PENDING_REVIEW,
        );

        setVideoUploading(false);
        setUploadedVideo(blob);
        setVideoDuration(3);
      })();
    }
  }, []);

  const createUploadChunkPlan = (videoSize: number) => {
    const chunkPlan = [];
    let remainingSize = videoSize;
    while (remainingSize > 0) {
      chunkPlan.push(Math.min(remainingSize, MAX_CHUNKING_SIZE));
      remainingSize -= MAX_CHUNKING_SIZE;
    }
    return chunkPlan;
  };

  const onFileUpload = (e: DragEvent<HTMLDivElement> | ChangeEvent<HTMLInputElement>) => {
    videoUploadStartTimeMs = Date.now();
    if (!authenticatedUser && !authenticatedUser!.id) {
      // TODO: Show an error modal prompting the user to login in a new tab
      return;
    }

    const video = (e.target as HTMLInputElement).files
      ? (e.target as HTMLInputElement).files![0]
      : (e as DragEvent).dataTransfer.files[0];

    if (video === undefined) {
      return;
    }

    const videoSize = video.size;

    unifiedLogger.logImpressionEvent({
      eventName: EventName.VideoUploadClicked,
      parameters: { adAccountId },
    });

    setVideoUploadProgress(10);

    if (videoSize > ONE_HUNDRED_MB_IN_BYTES) {
      formikInfo.setErrors({
        [createCampaignWizardModel.formField.adVideoAssetId.name]:
          'File size exceeds the 100MB limit.',
      });
      return;
    }

    const encounteredErrorUploadingVideo = (err?: TODOFIXANY) => {
      setVideoUploading(false);
      localVideoUploading = false;
      setVideoUploadProgress(0);
      if (err) {
        CaptureException(err as Error);
      }
      formikInfo.setErrors({
        [createCampaignWizardModel.formField.adVideoAssetId.name]:
          'Error uploading video - please try again later',
      });
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
        const multipartUploadInfoRes = await getMultipartVideoUploadOperationData(uploadData);
        const { operationPath, uploadUrls = [] } = multipartUploadInfoRes;
        return { operationPath, uploadUrls };
      } catch (err) {
        encounteredErrorUploadingVideo(err);
        return {};
      }
    };

    const uploadVideoChunks = async (
      uploadUrls: Array<{ chunkNum: number; url: string }>,
      chunkData: Array<Uint8Array>,
    ) => {
      videoS3UploadStartTimeMs = Date.now();
      const promises: Array<Promise<Response>> = uploadUrls.map(
        ({ chunkNum, url }: { chunkNum: number; url: string }) =>
          fetch(url, {
            body: chunkData[chunkNum - 1] as BodyInit,
            method: 'PUT',
          }).then((response) => {
            if (response.ok) {
              setVideoUploadProgress((prevProgress) => prevProgress + 10 / uploadUrls.length);
            }
            return response;
          }),
      );
      const videoUploadResponses = await Promise.all(promises).then((responses) => responses);
      videoS3UploadEndTimeMs = Date.now();
      return videoUploadResponses;
    };

    const markChunksComplete = async (etags: Array<string>, operationPath: string) => {
      const promises = etags.map(
        (eTag, index) => markChunkComplete(operationPath, index + 1, eTag) as Promise<Response>,
      );
      return Promise.all(promises);
    };

    const fetchTranscodingStatusPoll = (operationPath: string, videoEl: HTMLVideoElement) => {
      videoTranscodeStartTimeMs = Date.now();
      setVideoUploadProgress(50);
      const videoAssetIdResolved = async () => {
        try {
          const getVideoAssetIdRes = await getVideoAssetId(operationPath);
          const { done, metadata = {}, response = {} } = getVideoAssetIdRes;
          const { progress } = metadata;
          if (progress) {
            setVideoUploadProgress(50 + Math.floor(progress * 50));
          }
          if (done) {
            videoTranscodeEndTimeMs = Date.now();
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

      const videoAssetResolvedSuccess = (assetId: string) => {
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.adVideoAssetId.name,
          parseInt(assetId, 10),
        );
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.adVideoDurationMs.name,
          Math.ceil(videoEl.duration * 1000),
        );
        setVideoUploading(false);
        localVideoUploading = false;
        setVideoUploadProgress(100);
        setUploadedVideo(video);
        videoUploadEndTimeMs = Date.now();
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
        maxRetries: 200, // 5 minutes
        onMaxRetriesReached: () => {
          setVideoUploading(false);

          localVideoUploading = false;
          setVideoUploadProgress(0);
          formikInfo.setErrors({
            [createCampaignWizardModel.formField.adVideoAssetId.name]:
              'Error uploading video - please try again later',
          });
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
          abortMultipartUpload(operationPath);
        }
      };

      setCancelVideoUpload({ cancelCb: cancelCurrentVideoUpload });
    };

    if (video) {
      const fileType = video.type;
      const allowedVideoType = VALID_VIDEO_MIME_TYPES[fileType.toLowerCase()];

      if (!allowedVideoType) {
        formikInfo.setErrors({
          [createCampaignWizardModel.formField.adVideoAssetId.name]:
            'Please upload a file in the MP4 or MOV format.',
        });
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
        // This needs to round down - videos under 15 seconds cannot be uploaded for the video view objective and if we round up ever this requirment will not be satisfied.
        setVideoDuration(Math.floor(videoEl.duration));
      };

      videoEl.onloadeddata = async () => {
        setVideoUploadProgress(20);
        const { videoHeight, videoWidth } = videoEl;
        const [widthRatio, heightRatio] = CalculateAspectRatio(videoWidth / videoHeight, 10);

        videoEl.remove();

        if (videoWidth < 720) {
          formikInfo.setErrors({
            [createCampaignWizardModel.formField.adVideoAssetId.name]:
              'Video must be in 16:9 ratio and must be at least 720p resolution.',
          });
          return;
        }

        if (videoWidth > 1920) {
          formikInfo.setErrors({
            [createCampaignWizardModel.formField.adVideoAssetId.name]:
              'Video must be in 16:9 ratio and must be at max 1080p resolution',
          });
          return;
        }

        // AMS allows up to 2% buffer in video aspect ratio.
        const rationBuffer = 100 / (widthRatio / heightRatio);

        if (rationBuffer > 58.25 || rationBuffer < 54.25) {
          formikInfo.setErrors({
            [createCampaignWizardModel.formField.adVideoAssetId.name]:
              'Video must be in 16:9 ratio and must be at least 720p resolution.',
          });
          return;
        }

        formikInfo.setFieldValue(createCampaignWizardModel.formField.adAssetWidth.name, videoWidth);
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.adAssetHeight.name,
          videoHeight,
        );

        const reader = new FileReader();

        reader.onload = async (event) => {
          setVideoUploading(true);
          localVideoUploading = true;
          if (event?.target && event.target?.result) {
            const videoDurationInSeconds = videoEl?.duration;

            if (isVideoViewObjective) {
              if (videoDurationInSeconds < 15 || videoDurationInSeconds > 30) {
                formikInfo.setErrors({
                  [createCampaignWizardModel.formField.adVideoAssetId.name]:
                    'Video must be between 15 and 30 seconds.',
                });

                setVideoUploading(false);
                localVideoUploading = false;
                setVideoUploadProgress(0);
                return;
              }
            }
            if (isAwarenessViewObjective) {
              if (
                videoDurationInSeconds < 1 ||
                videoDurationInSeconds > videoDurationMaxInSeconds
              ) {
                formikInfo.setErrors({
                  [createCampaignWizardModel.formField.adVideoAssetId.name]:
                    `Video must be between 1 and ${videoDurationMaxInSeconds} seconds.`,
                });
                setVideoUploading(false);

                localVideoUploading = false;
                setVideoUploadProgress(0);
                return;
              }
            }
            // @ts-ignore
            const data = new Uint8Array(event?.target?.result);
            const chunkPlan = createUploadChunkPlan(videoSize);
            if (data) {
              const md5CheckSum = md5(data);
              const uploadData = {
                asset: {
                  assetType: 'AdsVideo',
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
                const videoUploadResponses = await uploadVideoChunks(uploadUrls, chunkData);
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
                  abortMultipartUpload(operationPath);
                  return;
                }
                setVideoUploadProgress(45);

                // 3. Mark the chunks as complete - this will tell the server that the chunk has been uploaded
                try {
                  await markChunksComplete(etags, operationPath);
                } catch (err) {
                  encounteredErrorUploadingVideo(err);
                  abortMultipartUpload(operationPath);
                  return;
                }

                // This will be set to false if the user clicks cancel - so we check for this at misc points cause that can happen async
                if (!localVideoUploading) {
                  abortMultipartUpload(operationPath);
                  return;
                }

                // 4. Mark the upload as complete - this will tell the server that the upload has been completed
                // Poll and retry because there is a read after write consistency issue with the server
                PollWithRetryLimitAndCancelCallback({
                  fn: async () => {
                    try {
                      return await markUploadComplete(operationPath);
                    } catch (err) {
                      CaptureException(err as Error);
                    }
                    return undefined;
                  },
                  interval: 500, // retry every 0.5 seconds
                  maxRetries: 5, // for 5 times
                  onMaxRetriesReached: () => {
                    encounteredErrorUploadingVideo();
                    abortMultipartUpload(operationPath);
                  },
                  successCb: () => {
                    // 5. Get the video asset id and polling for transcodeing
                    fetchTranscodingStatusPoll(operationPath, videoEl);
                  },
                });
              } catch (err) {
                encounteredErrorUploadingVideo(err);
              }
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

  // handle drag events
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    if (localVideoUploading) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    if (localVideoUploading) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e);
    }
  };

  return (
    <div>
      {Boolean(formikInfo.errors.adVideoAssetId) && (
        <div className={videoUploadErrorContainer}>
          <Typography classes={{ root: videoUploadError }} color='error' variant='h4'>
            <ReportProblemOutlinedIcon classes={{ root: videoUploadErrorIcon }} />
            {` ${formikInfo.errors.adVideoAssetId}`}
          </Typography>
        </div>
      )}
      {Boolean(uploadedVideo) && (
        <div>
          <UploadedVideoReviewComponentDynamic
            adAssetStatus={GetEndUserAdAssetStatus(formikInfo.values.compositeReviewDecision)}
            adFormat={translate(
              GetEndUserDisplayCampaignObjective(formikInfo.values.campaignObjective),
            )}
            assetReplaced={assetReplaced}
            disableInputs={disableInputs}
            duration={videoDuration}
            fullCPVScreenVideoPreview={
              formikInfo.values[createCampaignWizardModel.formField.adSetBidType.name] ===
              AdSetBidType.CPV15
            }
            livePreviewCb={livePreview}
            overrideThumbVideoPlayer={
              useThumbnailForVideo ? undefined : (
                <VideoAssetComponent
                  compositeReviewDecision={formikInfo.values.compositeReviewDecision}
                  setUseThumbnailForVideo={setUseThumbnailForVideo}
                  videoAssetId={formikInfo.values.adVideoAssetId}
                />
              )
            }
            replaceVideoCb={() => {
              uploadFile();
              setAssetReplaced(true);
            }}
            uploadedFormat={
              uploadedVideo instanceof Blob ? (uploadedVideo['type'] as string) : 'image/png'
            }
            uploadedVideoObjectUrl={
              uploadedVideo instanceof Blob ? URLUtil.createObjectURL(uploadedVideo) : uploadedVideo
            }
          />

          <div className={uploadSubtitle}>
            <Typography color='primary' variant='subtitle2'>
              Please allow up to 24 hours for review.
            </Typography>
          </div>
        </div>
      )}
      <div className={uploadedVideo || isEditAd ? hidden : ''}>
        <br />
        <Typography color='secondary' variant='subtitle2'>
          Assets uploaded through Ads Manager will be displayed exclusively in valid ad units. It
          can not be referenced anywhere else on the platform.
        </Typography>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}>
          <label htmlFor='input-file-upload' id='label-file-upload'>
            <input
              accept='video/mov, video/3g2, video/3gp, video/3gp2, video/3gpp, video/asf, video/asx, video/avi, video/divx, video/m4v,  video/mp4, video/mpe, video/x-m4v, video/mpeg, video/mpg, video/ogg, video/wmv, video/quicktime'
              disabled={videoUploading}
              hidden
              id='input-file-upload'
              onChange={onFileUpload}
              ref={inputFile}
              style={{ display: 'none' }}
              type='file'
            />
            <div
              className={uploadContainer}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onKeyPress={noop}
              role='none'>
              {Boolean(videoUploading) && (
                <div className={progressContainer}>
                  <CircularProgressWithLabel value={videoUploadProgress} />
                  Uploading Video...
                  <Button
                    color='primaryBrand'
                    onClick={() => {
                      if (cancelVideoUpload.cancelCb) {
                        cancelVideoUpload.cancelCb();
                      }
                    }}
                    variant='outlined'>
                    Cancel
                  </Button>
                </div>
              )}
              {!videoUploading && (
                <div>
                  <div className={configureAdRow}>
                    <Button
                      color='primaryBrand'
                      disabled={disableInputs}
                      id='fileSelect'
                      onClick={uploadFile}
                      variant='outlined'>
                      Upload Media
                    </Button>
                  </div>
                  <div className={videoUploadHelperText}>
                    <Typography color='secondary' variant='smallLabel2'>
                      Drag and drop media here to upload
                    </Typography>
                  </div>
                  <div className={videoUploadHelperText}>
                    <Typography color='secondary' variant='smallLabel1'>
                      Maximum 1 file at a time
                    </Typography>
                  </div>
                </div>
              )}
            </div>
          </label>
        </div>
        <FormHelperText classes={{ root: customHelperText }}>
          <Typography variant='smallLabel2'>Format: </Typography>
          <Typography variant='smallLabel1'>MP4, MOV; </Typography>
          <Typography variant='smallLabel2'>Max File Size: </Typography>
          <Typography variant='smallLabel1'>100MB; </Typography>
          <Typography variant='smallLabel2'>Ratio: </Typography>
          <Typography variant='smallLabel1'>16:9; </Typography>
          <Typography variant='smallLabel2'>Resolution: </Typography>
          <Typography variant='smallLabel1'>720p-1080p; </Typography>
          <Typography variant='smallLabel2'>Min Width: </Typography>
          <Typography variant='smallLabel1'>720px; </Typography>
          <Typography variant='smallLabel2'>Length: </Typography>
          <Typography variant='smallLabel1'>
            {isAwarenessViewObjective ? `1-${videoDurationMaxInSeconds} Secs` : '15-30 Secs'}
          </Typography>
        </FormHelperText>
      </div>
    </div>
  );
};

export default AdVideoUploadDisplayComponent;
