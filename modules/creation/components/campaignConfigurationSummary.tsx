import {
  Alert,
  Button,
  Divider,
  EditOutlinedIcon,
  makeStyles,
  ReportProblemOutlinedIcon,
  Typography,
} from '@rbx/ui';
import { noop } from 'lodash';
import { ReactNode, useContext, useState } from 'react';

import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { BudgetType } from '@modules/clients/ads/adsClientTypes';
import { languagesEnabled } from '@modules/creation/components/createAdSetConfigurationForm';
import { CreateCampaignMetadataContext } from '@modules/creation/contexts/createCampaignPageContext';
import {
  createCampaignWizardModel,
  getEndUserBidInfoDisplay,
  getEndUserDisplayAdPlacement,
  getEndUserDisplayAdType,
  getEndUserDisplayAgeBucket,
  getEndUserDisplayBrandSuitabilityType,
  getEndUserDisplayCampaignBudgetType,
  getEndUserDisplayCurrency,
  getEndUserDisplayDevice,
  getEndUserDisplayGender,
  getEndUserDisplayPaymentMethod,
} from '@modules/creation/wizard/models/createCampaignWizard/createCampaignWizardModel';
import { formatDateToMMMMDYYYYHMMAT } from '@modules/miscellaneous/utils/dateUtilities';
import VideoAssetComponent from '@modules/miscellaneous/video/videoAssetComponent';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { AdFormatType, ServerAdAssetCompositeReviewDecisionType } from '@type/ad';
import { GetEndUserDisplayCampaignObjective } from '@utils/campaignBuilder';
import { NumberToCommaSeparatedWithTwoDecimalPlacesString } from '@utils/currency';
import { GetTimezoneOffsetMs } from '@utils/date';
import { GetEndUserAdAssetStatus } from '@utils/fileUpload';
import { GetTimezoneObjFromEnum } from '@utils/timezone';
import {
  getApplicableAgeBucketCount,
  isU13TargetingApplicableForFormat,
} from 'app/shared/formDefaults';
import { TODOFIXANY } from 'app/shared/types';

import { GameThumbnailComponent } from './createAdConfigurationForm/createAdConfigurationForm';
import UploadedImageReviewComponentDynamic from './uploadedImageReviewComponentDynamic';
import UploadedVideoReviewComponentDynamic from './uploadedVideoReviewComponentDynamic';

interface SettingsReviewColumnRowProps {
  label: ReactNode;
  showWarning?: boolean;
  value: ReactNode;
}

const SettingsReviewColumnRow = ({
  label,
  showWarning = false,
  value,
}: SettingsReviewColumnRowProps) => {
  const {
    classes: {
      labelWrapper,
      settingReviewColumnRowLabel,
      settingReviewColumnRowSection,
      settingReviewColumnRowValue,
      textWrapTypography,
      warningIcon,
    },
  } = makeStyles()((theme) => ({
    labelWrapper: {
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'row',
    },

    settingReviewColumnRowLabel: {
      marginBottom: 5,
    },

    settingReviewColumnRowSection: {
      height: 80,
      marginTop: 10,
    },

    settingReviewColumnRowValue: {
      marginBottom: 5,
    },

    textWrapTypography: {
      display: 'inline-block',
      maxHeight: 67,
      overflow: 'hidden',
      overflowWrap: 'break-word',
      textOverflow: 'ellipsis',
      width: '90%',
    },

    warningIcon: {
      color: theme.palette.content.alert.notice,
      paddingLeft: 5,
    },
  }))();

  return (
    <div className={settingReviewColumnRowSection}>
      <div className={settingReviewColumnRowLabel}>
        <Typography classes={{ root: labelWrapper }} color='secondary' variant='footer'>
          {label}
          {showWarning && <ReportProblemOutlinedIcon className={warningIcon} />}
        </Typography>
      </div>
      <div className={settingReviewColumnRowValue}>
        <Typography classes={{ root: textWrapTypography }} variant='smallLabel2'>
          {value}
        </Typography>
      </div>
    </div>
  );
};

interface CampaignConfigurationSummaryProps {
  formikInfo: TODOFIXANY;
  onEditAdClick: TODOFIXANY;
  onEditAdSetClick: TODOFIXANY;
  onEditCampaignClick: TODOFIXANY;
  shouldShowOneTimeCloningTreatment?: boolean;
  showSummaryAdSetEditButton?: boolean;
  showSummaryCampaignEditButton?: boolean;
}

export const CampaignConfigurationSummary = ({
  formikInfo,
  onEditAdClick = noop,
  onEditAdSetClick = noop,
  onEditCampaignClick = noop,
  shouldShowOneTimeCloningTreatment = false,
  showSummaryAdSetEditButton,
  showSummaryCampaignEditButton,
}: CampaignConfigurationSummaryProps) => {
  const {
    classes: {
      alertText,
      buttonText,
      fillEl,
      headerSpacer,
      rowSpacer,
      settingsReviewInfoColumn,
      settingsReviewInfoContainer,
      settingsReviewInfoDoubleColumn,
      settingsReviewSection,
    },
  } = makeStyles()(() => ({
    alertText: {
      fontSize: 16,
    },

    buttonText: {
      paddingLeft: 5,
    },

    fillEl: {
      height: 36,
      width: '100%',
    },

    headerSpacer: {
      height: 28,
      width: '100%',
    },

    rowSpacer: {
      height: 80,
      marginTop: 10,
      width: '100%',
    },
    settingsReviewInfoColumn: {
      alignContent: 'space-between',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      height: 'max-content',
      justifyContent: 'start',
      marginBottom: 'auto',
      width: '20rem',
    },

    settingsReviewInfoContainer: {
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 30,
      marginTop: 30,
      minWidth: '62rem',
      width: 'fit-content',
    },
    settingsReviewInfoDoubleColumn: {
      alignContent: 'space-between',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      height: '12rem',
      justifyContent: 'start',
      width: '40rem',
    },

    settingsReviewSection: {
      height: '100%',
      marginTop: 30,
      width: '100%',
    },
  }))();

  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { uploadedImage, uploadedVideo, videoDuration } = useContext(CreateCampaignMetadataContext);

  const isBusinessOrganization = useAppStore((state: AppStoreType) => state.organizationIsBusiness);
  const { organizationInfo } = useAppStore((state: AppStoreType) => state.appData);
  const usersTimezone = organizationInfo.time_zone;

  const timezoneObj = GetTimezoneObjFromEnum(usersTimezone);
  const { timezoneDbName, title: tzTitle } = timezoneObj;

  const isTileAdFormat = formikInfo?.values?.adType === AdFormatType.TILE;
  const isSearchAdFormat = formikInfo?.values?.adType === AdFormatType.SEARCH;

  const adType = formikInfo?.values?.adType;
  // "All" requires every age bucket the format could ever target to be selected: 4 for
  // U13-eligible formats (including 5-12) and 3 for TILE/SEARCH. Accounts without 5-12 access
  // can never reach 4 buckets, so they always see the explicit 13+ list instead of "All".
  const formatSupportsU13 = isU13TargetingApplicableForFormat(adType, true);
  const fullCoverageBucketCount = getApplicableAgeBucketCount(formatSupportsU13);
  const shouldDisplayAdvertiserName = isBusinessOrganization();

  const genreTargetingColumnRow = (
    <SettingsReviewColumnRow
      label={createCampaignWizardModel.formField.adSetGenreTargeting.label}
      showWarning={Boolean(formikInfo.errors.adSetGenreTargeting)}
      value={formikInfo.values.adSetGenreTargeting.genres
        .map(({ title }: { title: string }) => title)
        .join(', ')}
    />
  );

  const brandSuitabilityColumnRow = (
    <SettingsReviewColumnRow
      label={createCampaignWizardModel.formField.adSetBrandSuitabilityType.label}
      showWarning={Boolean(formikInfo.errors.adSetBrandSuitabilityType)}
      value={getEndUserDisplayBrandSuitabilityType(formikInfo?.values?.adSetBrandSuitabilityType)}
    />
  );

  const bidInfoColumnRow = (
    <SettingsReviewColumnRow
      label={createCampaignWizardModel.formField.adSetBidValueUsd.label}
      showWarning={Boolean(formikInfo.errors.adSetBidValueUsd)}
      value={`${NumberToCommaSeparatedWithTwoDecimalPlacesString(
        Number(formikInfo.values.adSetBidValueUsd),
      )} ${getEndUserBidInfoDisplay(
        formikInfo.values.adSetBidType,
        formikInfo.values.campaignPaymentMethod,
      )}`}
    />
  );

  const adSetNameColumnRow = (
    <SettingsReviewColumnRow
      label={createCampaignWizardModel.formField.adSetName.label}
      showWarning={Boolean(formikInfo.errors.adSetName)}
      value={formikInfo.values.adSetName}
    />
  );

  const campaignStartEndTimeColumnRow = (
    <SettingsReviewColumnRow
      label='Start & End'
      showWarning={shouldShowOneTimeCloningTreatment}
      value={
        <div>
          {`${formatDateToMMMMDYYYYHMMAT({
            timestamp:
              formikInfo.values.campaignStartTimestampMs -
              GetTimezoneOffsetMs(
                GetTimezoneObjFromEnum(organizationInfo.time_zone).timezoneDbName,
              ),
            timezone: timezoneDbName,
          })} - ${
            formikInfo.values.campaignBudgetType === BudgetType.DAILY &&
            !formikInfo.values.campaignHasEndDate
              ? 'Run Indefinitely'
              : formatDateToMMMMDYYYYHMMAT({
                  timestamp:
                    formikInfo.values.campaignEndTimestampMs -
                    GetTimezoneOffsetMs(
                      GetTimezoneObjFromEnum(organizationInfo.time_zone).timezoneDbName,
                    ),
                  timezone: timezoneDbName,
                })
          }`}
          <br />
          {tzTitle}
        </div>
      }
    />
  );

  const campaignAdvertiserNameColumnRow = (
    <SettingsReviewColumnRow
      label={createCampaignWizardModel.formField.campaignAdvertiserName.label}
      showWarning={Boolean(formikInfo.values.campaignAdvertiserNameError)}
      value={formikInfo.values.campaignAdvertiserName}
    />
  );

  const [useThumbnailForVideo, setUseThumbnailForVideo] = useState<boolean>(false);

  let adAssetReviewComponent;
  if (
    formikInfo.values.compositeReviewDecision === ServerAdAssetCompositeReviewDecisionType.REJECTED
  ) {
    adAssetReviewComponent = (
      <SettingsReviewColumnRow
        label='Ad Creative'
        showWarning
        value='The ad creative is missing or rejected. Please re-upload by clicking Edit.'
      />
    );
  } else if (formikInfo.values.adType === AdFormatType.VIDEO) {
    let uploadedVideoObjectUrl = uploadedVideo;
    let uploadedFormat;
    if (uploadedVideo instanceof Blob) {
      uploadedVideoObjectUrl = URL.createObjectURL(uploadedVideo);
      uploadedFormat = uploadedVideo.type;
    } else if (useThumbnailForVideo && uploadedVideo) {
      uploadedVideoObjectUrl = uploadedVideo;
      uploadedFormat = 'image/png';
    }

    const overrideThumbVideoPlayer = (
      <VideoAssetComponent
        compositeReviewDecision={formikInfo.values.compositeReviewDecision}
        setUseThumbnailForVideo={setUseThumbnailForVideo}
        videoAssetId={formikInfo.values.adVideoAssetId}
      />
    );
    adAssetReviewComponent = (
      <UploadedVideoReviewComponentDynamic
        adAssetStatus={GetEndUserAdAssetStatus(formikInfo.values.compositeReviewDecision)}
        adFormat={translate(
          GetEndUserDisplayCampaignObjective(formikInfo.values.campaignObjective),
        )}
        duration={videoDuration}
        overrideThumbVideoPlayer={useThumbnailForVideo ? undefined : overrideThumbVideoPlayer}
        uploadedFormat={uploadedFormat}
        uploadedVideoObjectUrl={uploadedVideoObjectUrl}
      />
    );
  } else {
    adAssetReviewComponent = (
      <UploadedImageReviewComponentDynamic
        adAssetStatus={GetEndUserAdAssetStatus(formikInfo.values.compositeReviewDecision)}
        adFormat={translate(
          GetEndUserDisplayCampaignObjective(formikInfo.values.campaignObjective),
        )}
        overlayImageStr={
          uploadedImage instanceof Blob ? URL.createObjectURL(uploadedImage) : uploadedImage
        }
      />
    );
  }

  return (
    <>
      {shouldShowOneTimeCloningTreatment && (
        <Alert className={alertText} severity='warning' variant='standard'>
          Please review and update the highlighted fields to ensure the campaign details are
          accurate before submitting.
        </Alert>
      )}
      <div className={settingsReviewSection}>
        {showSummaryCampaignEditButton === true && (
          <Button color='primaryBrand' onClick={onEditCampaignClick} variant='contained'>
            <EditOutlinedIcon />
            <span className={buttonText}>Edit Campaign</span>
          </Button>
        )}
        <div className={settingsReviewInfoContainer}>
          <div className={settingsReviewInfoColumn}>
            <Typography variant='h5'>Campaign Settings</Typography>
            <SettingsReviewColumnRow
              label={createCampaignWizardModel.formField.campaignObjective.label}
              showWarning={Boolean(formikInfo.errors.campaignObjective)}
              value={translate(
                GetEndUserDisplayCampaignObjective(formikInfo.values.campaignObjective),
              )}
            />
            <SettingsReviewColumnRow
              label={createCampaignWizardModel.formField.campaignName.label}
              showWarning={Boolean(formikInfo.errors.campaignName)}
              value={formikInfo.values.campaignName}
            />
          </div>
          <div className={settingsReviewInfoColumn}>
            <div className={headerSpacer} />
            <SettingsReviewColumnRow
              label={createCampaignWizardModel.formField.campaignPaymentMethod.label}
              showWarning={Boolean(formikInfo.errors.campaignPaymentMethod)}
              value={getEndUserDisplayPaymentMethod(formikInfo.values.campaignPaymentMethod)}
            />
            {!shouldDisplayAdvertiserName && campaignStartEndTimeColumnRow}
            {shouldDisplayAdvertiserName && campaignAdvertiserNameColumnRow}
          </div>
          <div className={settingsReviewInfoColumn}>
            <div className={headerSpacer} />
            <SettingsReviewColumnRow
              label={getEndUserDisplayCampaignBudgetType(formikInfo.values.campaignBudgetType)}
              showWarning={Boolean(formikInfo.errors.campaignBudgetCapUsd)}
              value={`${NumberToCommaSeparatedWithTwoDecimalPlacesString(
                Number(formikInfo.values.campaignBudgetCapUsd),
              )} ${getEndUserDisplayCurrency(formikInfo.values.campaignPaymentMethod)}`}
            />
            {shouldDisplayAdvertiserName && campaignStartEndTimeColumnRow}
          </div>
        </div>
        <Divider />
      </div>

      <div className={settingsReviewSection}>
        {showSummaryAdSetEditButton === true && (
          <Button color='primaryBrand' onClick={onEditAdSetClick} variant='contained'>
            <EditOutlinedIcon />
            <span className={buttonText}>Edit Ad Set</span>
          </Button>
        )}
        <div className={settingsReviewInfoContainer}>
          {/* column 1 */}
          <div className={settingsReviewInfoColumn}>
            <Typography variant='h5'>Ad Set Settings</Typography>
            {/* row 1 */}
            {isSearchAdFormat && (
              <SettingsReviewColumnRow
                label={createCampaignWizardModel.formField.adSetFormatType.label}
                showWarning={Boolean(formikInfo?.errors?.adType)}
                value={getEndUserDisplayAdPlacement(formikInfo?.values?.adType)}
              />
            )}
            {!isSearchAdFormat && (
              <SettingsReviewColumnRow
                label={
                  createCampaignWizardModel.formField.adSetMixedRegionAndCountryTargeting.label
                }
                showWarning={Boolean(formikInfo.errors.adSetMixedRegionAndCountryTargeting)}
                value={[
                  formikInfo.values.adSetMixedRegionAndCountryTargeting.regions
                    .map(({ title }: { title: string }) => title)
                    .join(', '),
                  formikInfo.values.adSetMixedRegionAndCountryTargeting.countries
                    .map(({ title }: { title: string }) => title)
                    .join(', '),
                ]
                  .filter((str) => str.length > 0)
                  .join(', ')}
              />
            )}

            {/* row 2 */}
            {!isSearchAdFormat && (
              <SettingsReviewColumnRow
                label={createCampaignWizardModel.formField.adSetGenderTargeting.label}
                showWarning={Boolean(formikInfo.errors.adSetGenderTargeting)}
                value={getEndUserDisplayGender(formikInfo.values.adSetGenderTargeting.gender)}
              />
            )}
            {/* row 3 */}
            {!isSearchAdFormat && (
              <SettingsReviewColumnRow
                label={createCampaignWizardModel.formField.adSetFormatType.label}
                showWarning={Boolean(formikInfo?.errors?.adType)}
                value={getEndUserDisplayAdPlacement(formikInfo?.values?.adType)}
              />
            )}
            {/* row 4 */}
            {!isTileAdFormat && bidInfoColumnRow}
            {isTileAdFormat && adSetNameColumnRow}

            {languagesEnabled && (
              <SettingsReviewColumnRow
                label={createCampaignWizardModel.formField.adSetLanguageTargeting.label}
                showWarning={Boolean(formikInfo.errors.adSetLanguageTargeting)}
                value={formikInfo.values.adSetLanguageTargeting.languages
                  .map(({ title }: { title: string }) => title)
                  .join(', ')}
              />
            )}
          </div>
          {/* column 2 */}
          <div className={settingsReviewInfoColumn}>
            <div className={headerSpacer} />
            <div className={rowSpacer} />
            {/* row 1 */}
            {!isSearchAdFormat && (
              <SettingsReviewColumnRow
                label={createCampaignWizardModel.formField.adSetAgeBucketTargeting.label}
                showWarning={Boolean(formikInfo.errors.adSetAgeBucketTargeting)}
                value={
                  formikInfo.values?.adSetAgeBucketTargeting?.ageBuckets?.length ===
                  fullCoverageBucketCount
                    ? 'All'
                    : `${formikInfo.values?.adSetAgeBucketTargeting?.ageBuckets
                        ?.map((ageType: TODOFIXANY) => getEndUserDisplayAgeBucket(ageType))
                        .join(', ')}`
                }
              />
            )}

            {/* row 2 */}
            {!isSearchAdFormat && !isTileAdFormat && brandSuitabilityColumnRow}
            {!isSearchAdFormat && isTileAdFormat && genreTargetingColumnRow}
            {isSearchAdFormat && <div className={rowSpacer} />}

            {/* row 3 */}
            {!isSearchAdFormat && !isTileAdFormat && adSetNameColumnRow}
            {isSearchAdFormat && adSetNameColumnRow}
          </div>
          {/* column 3 */}
          <div className={settingsReviewInfoColumn}>
            <div className={headerSpacer} />
            <div className={rowSpacer} />
            {/* row 1 */}
            {!isSearchAdFormat && (
              <SettingsReviewColumnRow
                label={createCampaignWizardModel.formField.adSetDeviceTargeting.label}
                showWarning={Boolean(formikInfo.errors.adSetDeviceTargeting)}
                value={`${getEndUserDisplayDevice(formikInfo.values.adSetDeviceTargeting.devices)}`}
              />
            )}

            {/* row 2 */}
            {!isSearchAdFormat && isTileAdFormat && bidInfoColumnRow}
            {!isSearchAdFormat && !isTileAdFormat && genreTargetingColumnRow}
          </div>
        </div>
        <Divider />
      </div>

      <div className={settingsReviewSection}>
        <Button color='primaryBrand' onClick={onEditAdClick} variant='contained'>
          <EditOutlinedIcon />
          <span className={buttonText}>Edit Ad</span>
        </Button>
        <div className={settingsReviewInfoContainer}>
          <div className={settingsReviewInfoColumn}>
            <Typography variant='h5'>Ad Settings</Typography>
            <SettingsReviewColumnRow
              label={createCampaignWizardModel.formField.adName.label}
              showWarning={Boolean(formikInfo.errors.adName)}
              value={formikInfo.values.adName}
            />
            <SettingsReviewColumnRow
              label={createCampaignWizardModel.formField.adType.label}
              showWarning={Boolean(formikInfo.errors.adType)}
              value={getEndUserDisplayAdType(formikInfo.values.adType)}
            />
          </div>
          {formikInfo?.values?.adType === AdFormatType.TILE ? (
            <div className={settingsReviewInfoColumn}>
              <div className={headerSpacer} />
              <SettingsReviewColumnRow
                label='Destination Experience'
                showWarning={Boolean(formikInfo.errors.adDestinationUniverseId)}
                value={formikInfo.values.adPortalDestinationText}
              />
              <GameThumbnailComponent
                adType={formikInfo.values.adType}
                experienceName={formikInfo.values.adPortalDestinationText}
                hideImage={false}
                imageUrl={formikInfo.values.adGameThumbnailUrl}
                summaryView
              />
            </div>
          ) : (
            <div className={settingsReviewInfoDoubleColumn}>
              <div className={fillEl} />
              {adAssetReviewComponent}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
