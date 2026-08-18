import {
  Dropdown,
  Icon,
  Menu,
  MenuItem,
  MenuSection,
  Radio,
  RadioGroup,
  TextInput,
} from '@rbx/foundation-ui';
import { useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import useCreativesStyles from '@components/campaignBuilder/common/creative/Creatives.styles';
import useReachCreativePreviewStyles from '@components/campaignBuilder/common/creative/ReachCreativePreview.styles';
import AttributionThumbnailUploadDrawer from '@components/campaignBuilder/common/creative/reachSection/AttributionThumbnailUploadDrawer';
import LogoUploadDrawer from '@components/campaignBuilder/common/creative/reachSection/LogoUploadDrawer';
import ThumbnailAiCreateDrawer from '@components/campaignBuilder/common/creative/thumbnailSection/ThumbnailAiCreateDrawer';
import ThumbnailCreativeAddButton from '@components/campaignBuilder/common/creative/thumbnailSection/ThumbnailCreativeAddButton';
import ThumbnailUploadDrawer from '@components/campaignBuilder/common/creative/thumbnailSection/ThumbnailUploadDrawer';
import VideoUploadDrawer from '@components/campaignBuilder/common/creative/videoSection/VideoUploadDrawer';
import useFormLayoutStyles from '@components/campaignBuilder/common/FormLayout.styles';
import Creative from '@components/common/Creative';
import {
  DEFAULT_HEADLINE_MAX_LENGTH,
  DEFAULT_REACH_BID_TYPE,
  DEFAULT_REACH_CTA_BUTTON_TYPE,
  DEFAULT_SUBTITLE_MAX_LENGTH,
  FlowTypes,
  FormField,
  MAX_ATTRIBUTION_THUMBNAIL_SELECTIONS,
  MAX_LOGO_SELECTIONS,
  REACH_CTA_OPTIONS,
  ReachAdFormat,
  ReachCtaButtonLabelKey,
} from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { adsInternalVideoTransport } from '@services/video/adsInternalVideoUpload';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { ThumbnailType } from '@type/campaignBuilder';
import { UploadedVideoType, VideoUploadState } from '@type/fileUpload';

interface ReachCreativeSectionProps {
  formThumbnails: FormType[typeof FormField.THUMBNAILS];
  selectedThumbnails: ThumbnailType[];
}

const ReachCreativeSection = ({
  formThumbnails,
  selectedThumbnails,
}: ReachCreativeSectionProps) => {
  const { translateHTML: translateCreativeLibraryHTML } = useNamespacedTranslation(
    TranslationNamespace.CreativeLibrary,
  );
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateAdsServing } = useNamespacedTranslation(
    TranslationNamespace.AdsServing,
  );
  const { control, getFieldState, getValues, setValue } = useFormContext<FormType>();
  const flowType = useCampaignBuilderStore((state) => state.flowType);
  const editMode = flowType === FlowTypes.EDIT;
  const maxHeadlineLength =
    useAppStore((state) => state.appMetadataState?.data?.maxHeadlineLengthInChars) ||
    DEFAULT_HEADLINE_MAX_LENGTH;
  const maxSubtitleLength =
    useAppStore((state) => state.appMetadataState?.data?.maxSubtitleLengthInChars) ||
    DEFAULT_SUBTITLE_MAX_LENGTH;
  const isGenAiCreativesEnabled = useAppStore(
    (state) => state.appMetadataState?.data?.isGenAiCreativesEnabled ?? false,
  );
  // Gates the 2x1 vs 1x2 ad format toggle. When off, only the legacy 2x1
  // image flow is shown (see Roblox/ads#12555).
  const isOneByTwoTileCreationEnabled = useAppStore(
    (state) => state.appMetadataState?.data?.isOneByTwoTileCreationEnabled ?? false,
  );
  const [aiCreateDrawerOpen, setAiCreateDrawerOpen] = useState<boolean>(false);
  const maxAllowedThumbnailsFromMetadata =
    useAppStore(
      (state) => state.appMetadataState?.data?.maximumAdsPerTrafficDrivingCampaignCount,
    ) ?? 0;

  const {
    classes: { formColumn },
  } = useFormLayoutStyles();
  const {
    classes: { reachCreativeFieldContainer },
    cx,
  } = useReachCreativePreviewStyles();
  const {
    classes: {
      creativeSectionPreviewContainer,
      creativeUploadButton,
      creativeUploadButtonWrapper,
      errorBorder,
      logoStyle,
      thumbnailStyle,
    },
  } = useCreativesStyles();

  const {
    setAttributionThumbnailDrawerOpen,
    setLogoDrawerOpen,
    setThumbnailDrawerOpen,
    setVideoDrawerOpen,
  } = useCampaignBuilderStore();

  const logoAssets = useWatch<FormType, typeof FormField.LOGO_ASSETS>({
    name: FormField.LOGO_ASSETS,
  });
  const attributionThumbnails = useWatch<FormType, typeof FormField.ATTRIBUTION_THUMBNAILS>({
    name: FormField.ATTRIBUTION_THUMBNAILS,
  });
  const creativeFormat = useWatch<FormType, typeof FormField.CREATIVE_FORMAT>({
    name: FormField.CREATIVE_FORMAT,
  });
  const videos = useWatch<FormType, typeof FormField.VIDEOS>({ name: FormField.VIDEOS });
  const isVerticalFormat = creativeFormat === ReachAdFormat.VERTICAL_1X2;
  // 1x2 uses a single poster image for the video ad; 2x1 can select more.
  const maxAllowedThumbnails = isVerticalFormat ? 1 : maxAllowedThumbnailsFromMetadata;

  // Get selected logos (should only be one)
  const selectedLogos = logoAssets.filter(({ isSelected }) => isSelected);
  const selectedAttributionThumbnails =
    attributionThumbnails?.filter(({ isSelected }) => isSelected) ?? [];
  // 1x2 vertical reach carries a single uploaded video asset.
  const finishedVideos = videos.filter(
    (video: UploadedVideoType) => video.state === VideoUploadState.FINISHED && !!video.assetId,
  );

  const { error: thumbnailError, isTouched: thumbnailIsTouched } = getFieldState(
    FormField.THUMBNAILS,
  );
  const { error: logoError, isTouched: logoIsTouched } = getFieldState(FormField.LOGO_ASSETS);
  const { error: videoError, isTouched: videoIsTouched } = getFieldState(FormField.VIDEOS);
  const { error: attributionThumbnailError, isTouched: attributionThumbnailIsTouched } =
    getFieldState(FormField.ATTRIBUTION_THUMBNAILS);

  const hasThumbnailError = !!thumbnailError;
  const shouldShowThumbnailErrorMessage = hasThumbnailError && !!thumbnailIsTouched;
  const hasLogoError = !!logoError;
  const shouldShowLogoErrorMessage = hasLogoError && !!logoIsTouched;
  const shouldShowVideoErrorMessage = !!videoError && !!videoIsTouched;
  const shouldShowAttributionThumbnailErrorMessage =
    !!attributionThumbnailError && !!attributionThumbnailIsTouched;

  const showCreativeAddMenu = isGenAiCreativesEnabled;
  const showAiGenerateMenuItem =
    isGenAiCreativesEnabled && selectedThumbnails.length < maxAllowedThumbnails;

  const maybeRenderImageUploadButton = () => {
    if (editMode) {
      return null;
    }

    return (
      <div className={creativeUploadButtonWrapper}>
        <ThumbnailCreativeAddButton
          hasError={shouldShowThumbnailErrorMessage}
          onAddCreative={() => {
            setThumbnailDrawerOpen(true, getValues(FormField.EXPERIENCE).universe_id);
          }}
          onAiGenerate={() => setAiCreateDrawerOpen(true)}
          showAiGenerateMenuItem={showAiGenerateMenuItem}
          showCreativeAddMenu={showCreativeAddMenu}
          testId='image-asset-upload-button'
        />
      </div>
    );
  };

  const maybeRenderLogoUploadButton = () => {
    if (editMode) {
      return null;
    }

    return (
      <div className={creativeUploadButtonWrapper}>
        <button
          className={cx(creativeUploadButton, { [errorBorder]: shouldShowLogoErrorMessage })}
          data-testid='logo-asset-upload-button'
          onClick={() => {
            setLogoDrawerOpen(true, getValues(FormField.EXPERIENCE).universe_id);
          }}
          type='button'>
          <Icon name='icon-regular-circle-plus' size='Medium' />
        </button>
      </div>
    );
  };

  const maybeRenderAttributionThumbnailUploadButton = () => {
    if (editMode) {
      return null;
    }

    return (
      <div className={creativeUploadButtonWrapper}>
        <button
          className={cx(creativeUploadButton, {
            [errorBorder]: shouldShowAttributionThumbnailErrorMessage,
          })}
          data-testid='attribution-thumbnail-asset-upload-button'
          onClick={() => {
            setAttributionThumbnailDrawerOpen(true, getValues(FormField.EXPERIENCE).universe_id);
          }}
          type='button'>
          <Icon name='icon-regular-circle-plus' size='Medium' />
        </button>
      </div>
    );
  };

  // 1x2 vertical reach allows a single video asset, uploaded via the internal
  // ads-management-api proxy (EnhancedVideoExperience bypass). Hide the add
  // button once a video is uploaded or while editing.
  const maybeRenderVideoUploadButton = () => {
    if (editMode || finishedVideos.length > 0) {
      return null;
    }

    return (
      <div className={creativeUploadButtonWrapper}>
        <button
          className={cx(creativeUploadButton, { [errorBorder]: shouldShowVideoErrorMessage })}
          data-testid='video-asset-upload-button'
          onClick={() => {
            setVideoDrawerOpen(true, getValues(FormField.EXPERIENCE).universe_id);
          }}
          type='button'>
          <Icon name='icon-regular-circle-plus' size='Medium' />
        </button>
      </div>
    );
  };

  return (
    <>
      <ThumbnailUploadDrawer
        maxAllowedCreativesOverride={isVerticalFormat ? 1 : undefined}
        onClose={() => {
          // set touched and dirty to true
          setValue(FormField.THUMBNAILS, formThumbnails || [], {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          });
        }}
      />
      {showCreativeAddMenu ? (
        <ThumbnailAiCreateDrawer onOpenChange={setAiCreateDrawerOpen} open={aiCreateDrawerOpen} />
      ) : null}
      <LogoUploadDrawer
        onClose={() => {
          // set touched and dirty to true
          setValue(FormField.LOGO_ASSETS, logoAssets || [], {
            shouldDirty: true,
            shouldTouch: true,
          });
        }}
      />
      {isVerticalFormat && (
        <AttributionThumbnailUploadDrawer
          onClose={() => {
            // set touched and dirty to true; shouldValidate clears the
            // clickout-required error as soon as an asset is picked.
            setValue(
              FormField.ATTRIBUTION_THUMBNAILS,
              getValues(FormField.ATTRIBUTION_THUMBNAILS),
              {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              },
            );
          }}
        />
      )}
      {isVerticalFormat && (
        <VideoUploadDrawer
          assetType='Video'
          maxVideosOverride={1}
          onClose={() => {
            // set touched and dirty to true; shouldValidate clears VideoRequired
            // so Publish re-enables after a successful upload (same pattern as
            // ThumbnailUploadDrawerContent).
            setValue(FormField.VIDEOS, getValues(FormField.VIDEOS), {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
          }}
          uploadTransport={adsInternalVideoTransport}
        />
      )}
      <div className={`text-body-large ${formColumn}`}>
        {/* Ad format selector (2x1 horizontal image vs 1x2 vertical video) */}
        {isOneByTwoTileCreationEnabled && (
          <Controller
            control={control}
            name={FormField.CREATIVE_FORMAT}
            render={({ field: { onBlur, onChange, ref, value } }) => (
              <RadioGroup
                onBlur={onBlur}
                onValueChange={(nextFormat) => {
                  onChange(nextFormat);
                  // 2x1 (image) only supports CPM and rejects a clickout URL, so
                  // drop any CPV2 selection and clear the click destination.
                  if (nextFormat === ReachAdFormat.HORIZONTAL_2X1) {
                    setValue(FormField.BID_TYPE, DEFAULT_REACH_BID_TYPE);
                    setValue(FormField.CLICK_DESTINATION, undefined);
                    // Only the clickout attribution bar uses it, and the
                    // backend rejects it on 2x1 image ads.
                    setValue(FormField.ATTRIBUTION_THUMBNAILS, []);
                    // 2x1 CTA text comes from the max-reach tile-variant
                    // experiment, not from an advertiser choice.
                    setValue(FormField.CTA_BUTTON_TYPE, undefined);
                  } else {
                    setValue(FormField.CTA_BUTTON_TYPE, DEFAULT_REACH_CTA_BUTTON_TYPE);
                  }
                }}
                ref={ref}
                size='Small'
                value={value ?? ReachAdFormat.HORIZONTAL_2X1}>
                <div className='flex flex-row gap-large'>
                  <Radio
                    isDisabled={editMode}
                    label={translateCampaign('Label.Reach2x1Horizontal')}
                    value={ReachAdFormat.HORIZONTAL_2X1}
                  />
                  <Radio
                    isDisabled={editMode}
                    label={translateCampaign('Label.Reach1x2Vertical')}
                    value={ReachAdFormat.VERTICAL_1X2}
                  />
                </div>
              </RadioGroup>
            )}
          />
        )}

        {/* Image + video asset sections share a row (video only shows for 1x2) */}
        <div className='flex flex-row gap-large'>
          {/* Image asset section */}
          <div className={`text-body-large ${reachCreativeFieldContainer}`}>
            <p
              className='margin-[0px] text-body-medium content-default'
              data-testid='reach-image-asset-count'>
              {translateCreativeLibraryHTML(
                'Label.ImageAssetsCount',
                [
                  {
                    closing: 'boldEnd',
                    content: (chunks) => <span className='text-label-medium'>{chunks}</span>,
                    opening: 'boldStart',
                  },
                ],
                {
                  max: String(maxAllowedThumbnails),
                  selected: String(selectedThumbnails.length),
                },
              )}
            </p>
            <div className={creativeSectionPreviewContainer}>
              {selectedThumbnails.map(({ assetId }: ThumbnailType) => (
                <Creative assetId={assetId} className={thumbnailStyle} key={assetId} />
              ))}
              {maybeRenderImageUploadButton()}
            </div>
            {shouldShowThumbnailErrorMessage && (
              <div className='text-body-medium content-system-alert'>{thumbnailError?.message}</div>
            )}
          </div>

          {/* Video asset section (1x2 vertical format only) */}
          {isVerticalFormat && (
            <div className={`text-body-large ${reachCreativeFieldContainer}`}>
              <p
                className='margin-[0px] text-body-medium content-default'
                data-testid='reach-video-asset-label'>
                {translateCampaign('Label.VideoAsset')}
              </p>
              <div className={creativeSectionPreviewContainer}>
                {finishedVideos.map((video: UploadedVideoType) => (
                  <Creative
                    assetId={Number(video.assetId)}
                    className={thumbnailStyle}
                    key={video.id}
                  />
                ))}
                {maybeRenderVideoUploadButton()}
              </div>
              {shouldShowVideoErrorMessage && (
                <div className='text-body-medium content-system-alert'>{videoError?.message}</div>
              )}
            </div>
          )}
        </div>

        {/* Logo asset section */}
        <div className={`text-body-large ${reachCreativeFieldContainer}`}>
          <p
            className='margin-[0px] text-body-medium content-default'
            data-testid='reach-logo-asset-count'>
            {translateCreativeLibraryHTML(
              'Label.LogoAssetsCount',
              [
                {
                  closing: 'boldEnd',
                  content: (chunks) => <span className='text-label-medium'>{chunks}</span>,
                  opening: 'boldStart',
                },
              ],
              {
                max: String(MAX_LOGO_SELECTIONS),
                selected: String(selectedLogos.length),
              },
            )}
          </p>
          <div className={creativeSectionPreviewContainer}>
            {selectedLogos.map(({ assetId }) => (
              <Creative assetId={assetId} className={logoStyle} key={assetId} />
            ))}
            {maybeRenderLogoUploadButton()}
          </div>
          {shouldShowLogoErrorMessage && (
            <div className='text-body-medium content-system-alert'>{logoError?.message}</div>
          )}
        </div>

        {/* Attribution thumbnail section — the square brand icon shown in the
            expanded 1x2 video player's attribution bar. Required once a click
            destination is set. */}
        {isVerticalFormat && (
          <div className={`text-body-large ${reachCreativeFieldContainer}`}>
            <p
              className='margin-[0px] text-body-medium content-default'
              data-testid='reach-attribution-thumbnail-asset-count'>
              {translateCreativeLibraryHTML(
                'Label.AttributionThumbnailAssetsCount',
                [
                  {
                    closing: 'boldEnd',
                    content: (chunks) => <span className='text-label-medium'>{chunks}</span>,
                    opening: 'boldStart',
                  },
                ],
                {
                  max: String(MAX_ATTRIBUTION_THUMBNAIL_SELECTIONS),
                  selected: String(selectedAttributionThumbnails.length),
                },
              )}
            </p>
            <div className={creativeSectionPreviewContainer}>
              {selectedAttributionThumbnails.map(({ assetId }) => (
                <Creative assetId={assetId} className={logoStyle} key={assetId} />
              ))}
              {maybeRenderAttributionThumbnailUploadButton()}
            </div>
            {shouldShowAttributionThumbnailErrorMessage && (
              <div className='text-body-medium content-system-alert'>
                {attributionThumbnailError?.message}
              </div>
            )}
          </div>
        )}

        {/* Headline */}
        <Controller
          control={control}
          name={FormField.HEADLINE}
          render={({ field, fieldState: { error, isTouched } }) => {
            const shouldShowError = !!error && !!isTouched;
            return (
              <div className={`text-body-large ${reachCreativeFieldContainer}`}>
                <TextInput
                  {...field}
                  error={shouldShowError ? error?.message : undefined}
                  hasError={shouldShowError}
                  helperText={translateCampaign('Label.CharCount', {
                    current: String(field.value?.length || 0),
                    max: String(maxHeadlineLength),
                  })}
                  id='headline'
                  isDisabled={editMode}
                  label={translateCampaign('Label.Headline')}
                  size='Medium'
                />
              </div>
            );
          }}
        />

        {/* Subtitle */}
        <Controller
          control={control}
          name={FormField.SUBTITLE}
          render={({ field, fieldState: { error, isTouched } }) => {
            const shouldShowError = !!error && !!isTouched;
            return (
              <div className={`text-body-large ${reachCreativeFieldContainer}`}>
                <TextInput
                  {...field}
                  error={shouldShowError ? error?.message : undefined}
                  hasError={shouldShowError}
                  helperText={translateCampaign('Label.CharCount', {
                    current: String(field.value?.length || 0),
                    max: String(maxSubtitleLength),
                  })}
                  id='subtitle'
                  isDisabled={editMode}
                  label={translateCampaign('Label.SubtitleOptional')}
                  size='Medium'
                />
              </div>
            );
          }}
        />

        {/* CTA button text — 1x2 vertical (video) format only. The option labels come
            from the Ads.Serving namespace so the picker, the preview, and the served
            ad all read the same string. */}
        {isVerticalFormat && (
          <Controller
            control={control}
            name={FormField.CTA_BUTTON_TYPE}
            render={({ field: { onChange, value } }) => (
              <div
                className={`text-body-large ${reachCreativeFieldContainer}`}
                data-testid='reach-cta-button-type-select'>
                <Dropdown
                  isDisabled={editMode}
                  label={translateCampaign('Label.CtaButtonText')}
                  // Dropdown values are strings; the form field is the numeric
                  // CtaButtonType, so it round-trips through String/Number.
                  onValueChange={(newValue) => {
                    onChange(Number(newValue));
                  }}
                  placeholder={translateCampaign('Label.CtaButtonText')}
                  size='Medium'
                  value={String(value ?? DEFAULT_REACH_CTA_BUTTON_TYPE)}>
                  <Menu>
                    <MenuSection>
                      {REACH_CTA_OPTIONS.map((option) => (
                        <MenuItem
                          key={option}
                          title={translateAdsServing(ReachCtaButtonLabelKey[option])}
                          value={String(option)}
                        />
                      ))}
                    </MenuSection>
                  </Menu>
                </Dropdown>
              </div>
            )}
          />
        )}

        {/* Click destination (clickout URL) — 1x2 vertical (video) format only */}
        {isVerticalFormat && (
          <Controller
            control={control}
            name={FormField.CLICK_DESTINATION}
            render={({ field, fieldState: { error, isTouched } }) => {
              const shouldShowError = !!error && !!isTouched;
              return (
                <div className={`text-body-large ${reachCreativeFieldContainer}`}>
                  <TextInput
                    {...field}
                    error={shouldShowError ? error?.message : undefined}
                    hasError={shouldShowError}
                    id='clickDestination'
                    isDisabled={editMode}
                    label={translateCampaign('Label.ClickDestination')}
                    placeholder='http://'
                    size='Medium'
                    value={field.value ?? ''}
                  />
                </div>
              );
            }}
          />
        )}
      </div>
    </>
  );
};

export default ReachCreativeSection;
