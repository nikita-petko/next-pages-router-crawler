import {
  Autocomplete,
  Checkbox,
  ExpandLessIcon,
  ExpandMoreIcon,
  FormControlLabel,
  FormHelperText,
  InputAdornment,
  Link,
  makeStyles,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@rbx/ui';
import { Field, FormikProvider } from 'formik';
import { debounce, isEmpty, noop } from 'lodash';
import {
  ChangeEvent,
  KeyboardEvent,
  MouseEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { NumericFormat } from 'react-number-format';

import CampaignWizardBanner from '@components/common/CampaignWizardBanner';
import CustomCircularProgress from '@components/common/CustomCircularProgress';
import { NewGenres } from '@constants/advancedTargeting';
import { CampaignObjectiveType } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import { allNonEULocationsObj, ServerCountryCode } from '@constants/locationAutocomplete';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { getAudienceEstimate, getCampaignV2 } from '@modules/clients/ads/adsClient';
import {
  AgeBucketType,
  BillableViewDurationType,
  DeviceType,
  Gender,
} from '@modules/clients/ads/adsClientTypes';
import {
  ClientToServer,
  convertPaymentTypeServerToClient,
  ServerToClient,
} from '@modules/clients/ads/serverClientTransformationUtilities';
import { getGameThumbnailByPlaceId } from '@modules/clients/thumbnails/thumbnailsClient';
import {
  AutocompleteOption,
  convertServerUniverseToAutocompletOption,
} from '@modules/creation/components/createAdConfigurationForm/selectUniverseAutocomplete';
import {
  CardRadioGroup,
  CardRadioInput,
} from '@modules/creation/components/shareConfigurationComponents/cardRadioGroup';
import { CreateCampaignMetadataContext } from '@modules/creation/contexts/createCampaignPageContext';
import {
  convertAdSetMixedRegionAndCountryTargetingIntoRegions,
  createCampaignWizardModel,
  getDefaultBidValue,
  getEndUserBidInfoDisplay,
  getEndUserDisplayAgeBucket,
} from '@modules/creation/wizard/models/createCampaignWizard/createCampaignWizardModel';
import { InfoTooltip } from '@modules/management/components/infoTooltip';
import { GetTooltipText } from '@modules/miscellaneous/utils/tooltipStrings';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useModalStore } from '@stores/modalStoreProvider';
import { AdFormatType } from '@type/ad';
import { AdSetAuctionType, AdSetBidType, AdSetBrandSuitabilityType } from '@type/adSet';
import { VideoMinBidMappingsMicroUsdInterface } from '@type/asset';
import { UniverseShapeType } from '@type/universe';
import { CaptureException } from '@utils/error';
import {
  ageBuckets,
  AllGenresObj,
  allLocationsObj,
  devices,
  FormInputObj,
  genders,
  getApplicableAgeBucketCount,
  isU13TargetingApplicableForFormat,
  regionsAndCountriesSortedAlph,
  RegionsAndLocationsFormInputObj,
  u13AgeBucket,
} from 'app/shared/formDefaults';
import { TODOFIXANY } from 'app/shared/types';
import { arrayHasSameMembers, toMaxLengthWithEllipsis } from 'app/util/fns';

import { AutocompleteWrapperWithRightAlignedHelperText } from './autocompleteWrapperWithRightAlignedHelperText';
import {
  imagePlacementImagePath,
  portalPlacementImagePath,
  tilePlacementImagePath,
  videoPlacementImagePath,
} from './constants/assetConstants';
import { AudienceEstimateEnum } from './createAudienceEstimate';
import { InputWrapperWithRightAlignedHelperText } from './inputWrapperWithRightAlignedHelperText';

export const languagesEnabled = false;

export const CLASSIC_DISABLED_SPONSORED_AND_SEARCH_AD_FORMAT_MESSAGE =
  'Sponsored and Search Experiences are not available in classic Ads Manager. All campaigns in the new Ads Manager will reach players across Home & Search — finding the users most aligned with your audience and goals.';

export const CLASSIC_DISABLED_SPONSORED_AND_SEARCH_BANNER_TEXT_BEFORE_LINK =
  'Sponsored Experience and Search ad placements are not available in classic Ads Manager. Create campaigns with these placements in the new ';

const inExperiencePortalTooltip = 'CreateAdSetForm.InExperiencePortalTile';
const sponsoredExperienceTooltip = 'CreateAdSetForm.SponsoredExperienceTile';
const brandSuitabilityTooltip = 'CreateAdSetForm.BrandSuitability';
const biddingTooltip = 'CreateAdSetForm.Bidding';
const adSetFrequencyCapTooltip = 'CreateAdSetForm.AdSetFrequencyCap';
const bidTypeCPMTooltip = 'CreateAdSetForm.BidTypeCPM';
const bidTypeCPV15Tooltip = 'CreateAdSetForm.BidTypeCPV15';
const bidTypeCPCTooltip = 'CreateAdSetForm.BidTypeCPC';
const inExperienceVideoCPV15Tooltip = 'CreateAdSetForm.InExperienceVideoCPV15';
const inExperienceVideoFixedCPMTooltip = 'CreateAdSetForm.InExperienceVideoFixedCPM';
const inExperienceImageFixedCPMTooltip = 'CreateAdSetForm.InExperienceImageFixedCPM';
const inExperienceImageTooltip = 'CreateAdSetForm.InExperienceImage';

export const getAdSetBidTypeFromCampaignTypeAndPaidAccessSelection = (
  campaignObjective: CampaignObjectiveType | '',
  paidAccessSelection: boolean,
) => {
  let adSetBidType;

  switch (campaignObjective) {
    case CampaignObjectiveType.AWARENESS:
      adSetBidType = AdSetBidType.FIXED_COST_PER_MILLE;
      break;
    case CampaignObjectiveType.VISITS:
      adSetBidType = AdSetBidType.FIXED_COST_PER_TELEPORT;
      if (paidAccessSelection) {
        adSetBidType = AdSetBidType.COST_PER_CLICK;
      }
      break;
    case CampaignObjectiveType.VIDEO_VIEWS:
      adSetBidType = AdSetBidType.CPV15;
      break;
    default:
      adSetBidType = AdSetBidType.UNDEFINED;
  }

  return adSetBidType;
};

const fetchGameThumbnailInfo = async (placeId: number, formikInfo: TODOFIXANY) => {
  try {
    const thumbnailResponse = await getGameThumbnailByPlaceId(placeId);
    const { imageUrl } = thumbnailResponse.data[0];
    return imageUrl;
  } catch (e) {
    throw new Error(`error getting thumbnail url for assetId ${formikInfo?.values?.assetId}`);
  }
};

export type UniverseToggleConfigurationValuesType = {
  coreCountryOverrideCodeList: ServerCountryCode[];
  coreRegionCodeList: TODOFIXANY[];
  strategicRegionCodeList: TODOFIXANY[];
  videoMinBidMappingsMicroUsd: VideoMinBidMappingsMicroUsdInterface;
};

const setBidAndResetDefaultBid = (
  bidType: AdSetBidType,
  formikInfo: TODOFIXANY,
  configurationValues: UniverseToggleConfigurationValuesType,
) => {
  formikInfo.setFieldValue(createCampaignWizardModel.formField.adSetBidType.name, bidType);
  const auctionType = formikInfo.values[createCampaignWizardModel.formField.adSetAuctionType.name];
  const regionCodes = (
    convertAdSetMixedRegionAndCountryTargetingIntoRegions(
      formikInfo?.values?.adSetMixedRegionAndCountryTargeting || [],
    ) || []
  ).map((r: TODOFIXANY) => r.value);
  const countries = formikInfo?.values?.adSetMixedRegionAndCountryTargeting?.countries || [];

  const defaultBidValue = getDefaultBidValue(
    bidType,
    auctionType,
    formikInfo.values[createCampaignWizardModel.formField.adType.name],
    regionCodes,
    countries,
    configurationValues.coreRegionCodeList,
    configurationValues.strategicRegionCodeList,
    configurationValues.coreCountryOverrideCodeList,
    { videoMinBidMappingsMicroUsd: configurationValues.videoMinBidMappingsMicroUsd },
  );
  formikInfo.setFieldValue(
    createCampaignWizardModel.formField.adSetBidValueUsd.name,
    defaultBidValue,
  );
  setTimeout(() => formikInfo.validateForm(), 0);
};

export const handleAdSetPaidAccessChange = (
  newVal: boolean,
  formikInfo: TODOFIXANY,
  configurationValues: UniverseToggleConfigurationValuesType,
) => {
  formikInfo.setFieldValue(createCampaignWizardModel.formField.adSetPaidAccess.name, newVal);

  // If paid gets checked, bid type is CPC. If paid is unchecked, bid type is CPP.
  if (newVal) {
    setBidAndResetDefaultBid(AdSetBidType.COST_PER_CLICK, formikInfo, configurationValues);
  } else {
    setBidAndResetDefaultBid(AdSetBidType.FIXED_COST_PER_TELEPORT, formikInfo, configurationValues);
  }

  setTimeout(
    () => formikInfo.validateField(createCampaignWizardModel.formField.adSetPaidAccess.name),
    0,
  );
};

export const handleAdSetRestrictedMaturityChange = (newVal: boolean, formikInfo: TODOFIXANY) => {
  formikInfo.setFieldValue(
    createCampaignWizardModel.formField.adSetRestrictedMaturity.name,
    newVal,
  );
};

const isRestrictedExperienceTargetingAdFormat = (adType: AdFormatType | string | undefined) =>
  adType === AdFormatType.PORTAL || adType === AdFormatType.TILE;

const handlePortalDestinationChange = (
  universeObj: AutocompleteOption | null,
  formikInfo: TODOFIXANY,
  configurationValues: UniverseToggleConfigurationValuesType,
) => {
  if (universeObj) {
    formikInfo.setFieldValue(
      createCampaignWizardModel.formField.adPortalDestinationPlaceId.name,
      universeObj?.rootPlaceId,
    );
    formikInfo.setFieldValue(
      createCampaignWizardModel.formField.adPortalDestinationText.name,
      universeObj?.universeName,
    );
    formikInfo.setFieldValue(
      createCampaignWizardModel.formField.adDestinationUniverseId.name,
      universeObj?.universeId,
    );

    const universeIsRestrictedMaturity = universeObj.seventeenPlusAgeRating;
    const universeIsPaid = universeObj.paidAccess;

    handleAdSetRestrictedMaturityChange(Boolean(universeIsRestrictedMaturity), formikInfo);
    handleAdSetPaidAccessChange(Boolean(universeIsPaid), formikInfo, configurationValues);

    // fetch thumbnail for both portal and tile, so when user switch to tile the
    // image will not be blank
    fetchGameThumbnailInfo(universeObj.rootPlaceId, formikInfo)
      .then((thumbnailUrl: string) => {
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.adGameThumbnailUrl.name,
          thumbnailUrl,
        );
      })
      .catch(() => {
        CaptureException('Could not fetch the image url');
      });
  } else {
    formikInfo.setFieldValue(
      createCampaignWizardModel.formField.adPortalDestinationPlaceId.name,
      '',
    );
    formikInfo.setFieldValue(createCampaignWizardModel.formField.adPortalDestinationText.name, '');
    formikInfo.setFieldValue(createCampaignWizardModel.formField.adDestinationUniverseId.name, '');
    formikInfo.setFieldValue(createCampaignWizardModel.formField.adGameThumbnailUrl.name, '');
  }
};

export const setNewAdsetName = ({
  adSetNameEdited,
  formikInfo,
  isU13Applicable = false,
  newAgeBuckets,
  newGenders,
  newLocations,
}: {
  adSetNameEdited: boolean;
  formikInfo: TODOFIXANY;
  isU13Applicable?: boolean;
  newAgeBuckets?: TODOFIXANY;
  newGenders?: TODOFIXANY;
  newLocations?: TODOFIXANY;
}) => {
  if (!adSetNameEdited) {
    const computedLocations =
      newLocations ||
      formikInfo.values[
        createCampaignWizardModel.formField.adSetMixedRegionAndCountryTargeting.name
      ];

    const computedGenders =
      newGenders ||
      formikInfo.values[createCampaignWizardModel.formField.adSetGenderTargeting.name];
    const computedAges =
      newAgeBuckets ||
      formikInfo.values[createCampaignWizardModel.formField.adSetAgeBucketTargeting.name];

    let genderString = 'All Genders';

    if (computedGenders.gender === Gender.GENDER_FEMALE) {
      genderString = 'Female';
    }

    if (computedGenders.gender === Gender.GENDER_MALE) {
      genderString = 'Male';
    }

    if (computedGenders.gender === Gender.GENDER_UNDEFINED_INVALID) {
      genderString = '';
    }

    let newAgeStr = 'All Ages';

    if (computedAges.ageBuckets.length !== getApplicableAgeBucketCount(isU13Applicable)) {
      newAgeStr = `${computedAges.ageBuckets
        .sort()
        .map((ageType: TODOFIXANY) => getEndUserDisplayAgeBucket(ageType))
        .join('|')}`;
    }

    const newLocationStr = `${computedLocations.regions
      .map((regionObj: TODOFIXANY) => regionObj.title)
      .join('|')}`;
    const newGenderStr = `${genderString}`;

    const newAdSetName = [
      toMaxLengthWithEllipsis(newLocationStr, 64),
      toMaxLengthWithEllipsis(newGenderStr, 32),
      toMaxLengthWithEllipsis(newAgeStr, 32),
    ]
      .filter(Boolean)
      .join(', ');
    formikInfo.setFieldValue(createCampaignWizardModel.formField.adSetName.name, newAdSetName);
  }
};

interface GenreSelectionAutocompleteRowProps {
  [key: string]: TODOFIXANY;

  genreOption: {
    description: string;
    title: string;
    value: string;
  };
}

const GenreSelectionAutocompleteRow = ({
  genreOption,
  ...props
}: GenreSelectionAutocompleteRowProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const {
    classes: {
      autocompleteListboxOption,
      expandedGenresRow,
      sectionExpansionContainer,
      sectionTitle,
      sectionTitleContainer,
    },
  } = makeStyles()(() => ({
    autocompleteListboxOption: {
      '& .MuiAutocomplete-option': {
        alignItems: 'flex-start',
        display: 'flex',
        flexDirection: 'column',
      },
    },
    expandedGenresRow: {
      padding: '8px 16px 8px 16px',
    },
    sectionExpandToggleIconContainer: {
      marginLeft: 'auto',
      zIndex: 99999,
    },
    sectionExpansionContainer: {
      minWidth: '100%',
      width: '100%',
    },
    sectionTitle: {},
    sectionTitleContainer: {
      display: 'flex',
      minWidth: '100%',
      width: '100%',
    },
  }))();

  return (
    <div className={autocompleteListboxOption} {...props}>
      <div className={sectionExpansionContainer}>
        <div className={sectionTitleContainer}>
          <div className={sectionTitle}>{translate(genreOption.title)}</div>
        </div>
        <div className={expandedGenresRow} key={genreOption.value}>
          <Typography style={{ color: '#989898', fontSize: '14px' }} variant='body1'>
            {translate(genreOption.description)}
          </Typography>
        </div>
      </div>
    </div>
  );
};

export const AdSetAdPlacementGroup = ({
  adSetNameEdited,
  blockedAdFormats,
  disableInputs,
  formikInfo,
}: {
  adSetNameEdited: boolean;
  blockedAdFormats: AdFormatType[];
  disableInputs: boolean;
  formikInfo: TODOFIXANY;
}) => {
  const {
    classes: {
      adFormatCardContainer,
      adPlacementContainer,
      adPlacementRadioItem,
      adPlacementRow,
      adPlacementRowFlexGroup,
      adPlacementSubTitle,
      adPlacementTitle,
      placementImage,
      placementText,
      radioButtonWithPlacementContentContainer,
      tooltip,
    },
    cx,
  } = makeStyles()(() => ({
    adFormatCardContainer: {
      padding: '14px 0 !important',
    },
    adPlacementContainer: {
      alignItems: 'center',
      borderRadius: 4,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: '24px 10px',
    },
    adPlacementRadioItem: {
      alignItems: 'center',
      display: 'flex',
    },
    adPlacementRow: {
      alignItems: 'center',
      display: 'flex',
      marginBottom: 48,
    },
    adPlacementRowFlexGroup: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 24,
      justifyContent: 'start',
      width: '100%',
    },
    adPlacementSubTitle: {
      marginTop: '8px',
    },
    adPlacementTitle: {
      margin: '24px 0px 48px',
    },
    placementImage: {
      height: 164,
      width: 240,
    },
    placementText: {
      display: 'flex',
    },
    radioButtonWithPlacementContentContainer: {
      display: 'flex',
      flexDirection: 'column',
    },
    tooltip: {
      height: 24,
      marginBottom: '-2px',
      marginLeft: 4,
      width: 24,
    },
  }))();

  const {
    coreCountryOverrideCodeList,
    coreRegionCodeList,
    strategicRegionCodeList,
    videoMinBidMappingsMicroUsd,
  } = useAppStore((state: AppStoreType) => state.appData);
  const { isAge5To12TargetingEnabled } = useAppStore(
    (state: AppStoreType) => state.appMetadataState.data,
  );
  const adAccountIsExternalManaged = useAppStore(
    (state: AppStoreType) => state.adAccountIsExternalManaged,
  );
  const adAccountIsInternalManaged = useAppStore(
    (state: AppStoreType) => state.adAccountIsInternalManaged,
  );
  const isManagedOrInternalAccount = adAccountIsExternalManaged() || adAccountIsInternalManaged();
  const handleAdPlacementChange = (adPlacement: TODOFIXANY) => {
    formikInfo.setFieldValue(createCampaignWizardModel.formField.adType.name, adPlacement);

    const auctionType =
      formikInfo.values[createCampaignWizardModel.formField.adSetAuctionType.name];
    const bidType = formikInfo.values[createCampaignWizardModel.formField.adSetBidType.name];

    const regionCodes = (
      convertAdSetMixedRegionAndCountryTargetingIntoRegions(
        formikInfo?.values?.adSetMixedRegionAndCountryTargeting || [],
      ) || []
    ).map((r: TODOFIXANY) => r.value);
    const countries = formikInfo?.values?.adSetMixedRegionAndCountryTargeting?.countries || [];

    formikInfo.setFieldValue(
      createCampaignWizardModel.formField.adSetBidValueUsd.name,
      // TODO - update value to match new floors set by AMA
      getDefaultBidValue(
        bidType,
        auctionType,
        adPlacement,
        regionCodes,
        countries,
        coreRegionCodeList,
        strategicRegionCodeList,
        coreCountryOverrideCodeList,
        { videoMinBidMappingsMicroUsd },
      ),
    );

    const isU13ApplicableForPlacement = isU13TargetingApplicableForFormat(
      adPlacement,
      isAge5To12TargetingEnabled,
    );

    setNewAdsetName({
      adSetNameEdited,
      formikInfo,
      isU13Applicable: isU13ApplicableForPlacement,
    });

    setTimeout(() => formikInfo.validateForm(), 0);
  };

  const isPortalFormatDisabled = blockedAdFormats.includes(AdFormatType.PORTAL);
  const isTileFormatDisabled = true;
  const adFormatDisabledMessage =
    'Search ads cannot currently be combined with other ad formats in the same campaign.';
  const portalDisabledDueToRestrictedMaturity =
    formikInfo.values.adSetRestrictedMaturity && !isManagedOrInternalAccount;
  const portalDisabledDueToPaidOrRestrictedMaturity =
    portalDisabledDueToRestrictedMaturity || formikInfo.values.adSetPaidAccess;
  const portalDisabledDueToPaidOrRestrictedMaturityMessage =
    'Restricted (18+) or paid-access experiences are not eligible for the immersive portal ad format.';
  const portalAdFormatDisabledMessage = portalDisabledDueToPaidOrRestrictedMaturity
    ? portalDisabledDueToPaidOrRestrictedMaturityMessage
    : adFormatDisabledMessage;
  const classicDisabledSponsoredAndSearchAdFormatMessage =
    CLASSIC_DISABLED_SPONSORED_AND_SEARCH_AD_FORMAT_MESSAGE;

  if (
    formikInfo.values.adType === AdFormatType.VIDEO &&
    formikInfo.values.adSetBidType === AdSetBidType.CPV15
  ) {
    return (
      <>
        <div className={adPlacementTitle}>
          <Typography variant='h4'>Ad Format</Typography>
          <div className={adPlacementSubTitle}>
            <Typography variant='smallLabel2'>
              Ad format options are based on your campaign objective.
            </Typography>
          </div>
        </div>
        <div className={adPlacementRow}>
          <CardRadioGroup
            classes={{ root: adPlacementRowFlexGroup }}
            data-testid='ad-placement-radio-group'
            onChange={(_event: ChangeEvent<object>, value: TODOFIXANY) =>
              handleAdPlacementChange(value)
            }
            radioGroupName={createCampaignWizardModel.formField.adSetFormatType.name}
            value={formikInfo.values.adType}>
            <div className={radioButtonWithPlacementContentContainer}>
              <div className={adPlacementRadioItem}>
                <CardRadioInput
                  ariaLabel='In-Experience Video Ad Placement'
                  cardContainerClass={adFormatCardContainer}
                  disabled
                  labelForId='videoPlacement'
                  selected={formikInfo.values.adType === AdFormatType.VIDEO}
                  value={AdFormatType.VIDEO}>
                  <div className={adPlacementContainer}>
                    <img
                      alt='In-Experience Video Ad Placement'
                      className={placementImage}
                      src={videoPlacementImagePath}
                    />
                    <div className={placementText}>
                      <Typography variant='subtitle1'>In-Experience Video</Typography>
                      <InfoTooltip
                        classesToAdd={{ root: tooltip }}
                        text={GetTooltipText(inExperienceVideoCPV15Tooltip)}
                      />
                    </div>
                  </div>
                </CardRadioInput>
              </div>
            </div>
          </CardRadioGroup>
        </div>
      </>
    );
  }

  if (formikInfo.values.adSetBidType === AdSetBidType.FIXED_COST_PER_MILLE) {
    return (
      <>
        <div className={adPlacementTitle}>
          <Typography variant='h4'>Ad Format</Typography>
          <div className={adPlacementSubTitle}>
            <Typography variant='smallLabel2'>
              Ad format options are based on your campaign objective.
            </Typography>
          </div>
        </div>
        <div className={adPlacementRow}>
          <CardRadioGroup
            classes={{ root: adPlacementRowFlexGroup }}
            data-testid='ad-placement-radio-group-CPM'
            onChange={(_event: ChangeEvent<object>, value: TODOFIXANY) =>
              handleAdPlacementChange(value)
            }
            radioGroupName={createCampaignWizardModel.formField.adSetFormatType.name}
            value={formikInfo.values.adType}>
            <div className={radioButtonWithPlacementContentContainer}>
              <div className={adPlacementRadioItem}>
                <CardRadioInput
                  ariaLabel='In-Experience Video Ad Placement'
                  cardContainerClass={adFormatCardContainer}
                  disabled={disableInputs}
                  labelForId='awarenessVideoPlacement'
                  selected={formikInfo.values.adType === AdFormatType.VIDEO}
                  value={AdFormatType.VIDEO}>
                  <div className={adPlacementContainer}>
                    <img
                      alt='In-Experience Video Ad Placement'
                      className={placementImage}
                      src={videoPlacementImagePath}
                    />
                    <div className={placementText}>
                      <Typography variant='subtitle1'>In-Experience Video</Typography>
                      <InfoTooltip
                        classesToAdd={{ root: tooltip }}
                        text={GetTooltipText(inExperienceVideoFixedCPMTooltip)}
                      />
                    </div>
                  </div>
                </CardRadioInput>
              </div>
            </div>
            <div className={radioButtonWithPlacementContentContainer}>
              <div className={adPlacementRadioItem}>
                <CardRadioInput
                  ariaLabel='In-Experience Image Ad Placement'
                  cardContainerClass={adFormatCardContainer}
                  disabled={disableInputs}
                  labelForId='awarenessImagePlacement'
                  selected={formikInfo.values.adType === AdFormatType.DISPLAY}
                  value={AdFormatType.DISPLAY}>
                  <div className={adPlacementContainer}>
                    <img
                      alt='In-Experience Image Ad Placement'
                      className={placementImage}
                      src={imagePlacementImagePath}
                    />
                    <div className={placementText}>
                      <Typography variant='subtitle1'>In-Experience Image</Typography>
                      <InfoTooltip
                        classesToAdd={{ root: tooltip }}
                        text={GetTooltipText(inExperienceImageFixedCPMTooltip)}
                      />
                    </div>
                  </div>
                </CardRadioInput>
              </div>
            </div>
          </CardRadioGroup>
        </div>
      </>
    );
  }

  if (formikInfo.values.adType === AdFormatType.DISPLAY) {
    return (
      <>
        <div className={adPlacementTitle}>
          <Typography variant='h4'>Ad Format</Typography>
          <div className={adPlacementSubTitle}>
            <Typography variant='smallLabel2'>
              Ad format options are based on your campaign objective.
            </Typography>
          </div>
        </div>
        <div className={adPlacementRow}>
          <div className={adPlacementContainer}>
            <img
              alt='in-experience ad placement'
              className={placementImage}
              src={imagePlacementImagePath}
            />
            <div className={placementText}>
              <Typography variant='subtitle1'>In-Experience Image</Typography>
              <InfoTooltip
                classesToAdd={{ root: tooltip }}
                text={GetTooltipText(inExperienceImageTooltip)}
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  // Portal and Tile selection only available for visit objective type
  return (
    <>
      <div className={adPlacementTitle}>
        <Typography variant='h4'>Ad Format</Typography>
        <div className={adPlacementSubTitle}>
          <Typography variant='smallLabel2'>
            Ad format options are based on your campaign objective.
          </Typography>
        </div>
      </div>
      <div className={adPlacementRow}>
        <CardRadioGroup
          classes={{ root: adPlacementRowFlexGroup }}
          data-testid='ad-placement-radio-group-visits'
          onChange={(_event: ChangeEvent<object>, value: TODOFIXANY) =>
            handleAdPlacementChange(value)
          }
          radioGroupName={createCampaignWizardModel.formField.adSetFormatType.name}
          value={formikInfo.values.adType}>
          <div className={radioButtonWithPlacementContentContainer}>
            <Tooltip
              disableHoverListener={!isTileFormatDisabled}
              title={classicDisabledSponsoredAndSearchAdFormatMessage}>
              <div className={adPlacementRadioItem}>
                <CardRadioInput
                  ariaLabel='Tile Ad Placement'
                  cardContainerClass={adFormatCardContainer}
                  disabled={disableInputs || isTileFormatDisabled}
                  labelForId='tilePlacement'
                  selected={formikInfo.values.adType === AdFormatType.TILE}
                  value={AdFormatType.TILE}>
                  <div className={cx(adPlacementContainer)}>
                    <img
                      alt='tile ad placement'
                      className={placementImage}
                      src={tilePlacementImagePath}
                    />
                    <div className={placementText}>
                      <Typography variant='subtitle2'>Sponsored Experience</Typography>
                      <InfoTooltip
                        classesToAdd={{ root: tooltip }}
                        disableHoverListener={isTileFormatDisabled}
                        text={GetTooltipText(sponsoredExperienceTooltip)}
                      />
                    </div>
                  </div>
                </CardRadioInput>
              </div>
            </Tooltip>
          </div>

          <div className={radioButtonWithPlacementContentContainer}>
            <Tooltip
              disableHoverListener={
                !(isPortalFormatDisabled || portalDisabledDueToPaidOrRestrictedMaturity)
              }
              title={portalAdFormatDisabledMessage}>
              <div className={adPlacementRadioItem}>
                <CardRadioInput
                  ariaLabel='Portal Ad Placement'
                  cardContainerClass={adFormatCardContainer}
                  disabled={
                    disableInputs ||
                    isPortalFormatDisabled ||
                    portalDisabledDueToPaidOrRestrictedMaturity
                  }
                  labelForId='portalPlacement'
                  selected={formikInfo.values.adType === AdFormatType.PORTAL}
                  value={AdFormatType.PORTAL}>
                  <div className={adPlacementContainer}>
                    <img
                      alt='portal ad placement'
                      className={placementImage}
                      src={portalPlacementImagePath}
                    />
                    <div className={placementText}>
                      <Typography variant='subtitle2'>In-Experience Portal</Typography>
                      <InfoTooltip
                        classesToAdd={{ root: tooltip }}
                        disableHoverListener={
                          isPortalFormatDisabled || portalDisabledDueToPaidOrRestrictedMaturity
                        }
                        text={GetTooltipText(inExperiencePortalTooltip)}
                      />
                    </div>
                  </div>
                </CardRadioInput>
              </div>
            </Tooltip>
          </div>
        </CardRadioGroup>
      </div>
    </>
  );
};

const getBrandSuitabilityCardTitle = (type: AdSetBrandSuitabilityType) => {
  switch (type) {
    case AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_STANDARD:
      return 'Standard Inventory';
    case AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_SELECT:
      return 'Advertiser Select Inventory';
    default:
      return '';
  }
};

const getBrandSuitabilityCardSubtitle = (type: AdSetBrandSuitabilityType) => {
  switch (type) {
    case AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_STANDARD:
      return (
        <div>
          Your ads may appear in experiences with mild, minimal, or moderate themes, but not
          restricted content. Experiences with free form UGC are excluded.
          <br />
          <br />
        </div>
      );
    case AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_SELECT:
      return (
        <div>
          Your ads will only appear in mild or minimal rated top experiences with 1M monthly
          actives. Experiences with free form UGC are excluded.
          <br />
          <br />
          <br />
        </div>
      );
    default:
      return '';
  }
};

const getBrandSuitabilityCardExampleList = (type: AdSetBrandSuitabilityType) => {
  switch (type) {
    case AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_STANDARD:
      return ['Laser tag or cartoon boxing', 'Use of mild crude humor'];
    case AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_SELECT:
      return ['Pizza delivery simulator', 'Obstacle course'];
    default:
      return [];
  }
};

const getBrandSuitabilityCard = ({
  disableInputs,
  labelForId,
  selected,
  suitabilityType,
}: {
  disableInputs: boolean;
  labelForId: string;
  selected: boolean;
  suitabilityType: AdSetBrandSuitabilityType;
}) => {
  const {
    classes: { filterTextBody, filterTextBottom },
  } = makeStyles()(() => ({
    filterTextBody: {
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 16,
    },
    filterTextBottom: {
      paddingTop: 16,
    },
  }))();
  const exampleItems = getBrandSuitabilityCardExampleList(suitabilityType);

  // id='filterFull'
  return (
    <CardRadioInput
      ariaLabel={`brand suitability filter ${suitabilityType}`}
      disabled={disableInputs}
      labelForId={labelForId}
      selected={selected}
      value={suitabilityType}>
      <div>
        <Typography variant='h6'>{getBrandSuitabilityCardTitle(suitabilityType)}</Typography>
      </div>
      <div className={filterTextBody}>
        <Typography variant='body2'>{getBrandSuitabilityCardSubtitle(suitabilityType)}</Typography>
        <div className={filterTextBottom}>
          <Typography color='disabled' component='div' variant='body2'>
            Examples:
            <div style={{ paddingLeft: 12 }}>
              {exampleItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </div>
          </Typography>
        </div>
      </div>
    </CardRadioInput>
  );
};

export const AdSetBrandSuitabilityGroup = ({
  disableInputs,
  formikInfo,
}: {
  disableInputs: boolean;
  formikInfo: TODOFIXANY;
}) => {
  const {
    classes: {
      brandSuitabilityRow,
      brandSuitabilityRowFlexGroup,
      brandSuitabilitySection,
      brandSuitabilityTitle,
      tooltip,
    },
  } = makeStyles()(() => ({
    brandSuitabilityRow: {
      alignItems: 'center',
      display: 'flex',
      marginBottom: 48,
      width: '100%',
    },
    brandSuitabilityRowFlexGroup: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      gap: 24,
      justifyContent: 'start',
      width: '100%',
    },
    brandSuitabilitySection: {
      marginBottom: 24,
      marginTop: 20,
    },
    brandSuitabilityTitle: {
      alignItems: 'center',
      display: 'flex',
      margin: '48px 0px 12px',
    },
    tooltip: {
      height: 24,
      marginBottom: '-2px',
      marginLeft: 4,
      width: 24,
    },
  }))();

  if (
    formikInfo.values.adSetBrandSuitabilityType ===
    AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_UNSPECIFIED
  ) {
    return null;
  }

  return (
    <>
      <div className={brandSuitabilitySection}>
        <h4>
          <div className={brandSuitabilityTitle}>
            <Typography variant='h4'>Brand Suitability</Typography>
            <InfoTooltip
              classesToAdd={{ root: tooltip }}
              text={GetTooltipText(brandSuitabilityTooltip)}
            />
          </div>
          <Typography variant='smallLabel2'>
            <div>
              {'Select an inventory tier that best fits your brand. '}
              <Link
                color='inherit'
                href='https://create.roblox.com/docs/production/promotion/ads-manager#define-ad-sets'
                rel='noopener noreferrer'
                target='_blank'
                underline='always'>
                Learn More
              </Link>
            </div>
          </Typography>
        </h4>
      </div>
      <div className={brandSuitabilityRow}>
        <CardRadioGroup
          classes={{ root: brandSuitabilityRowFlexGroup }}
          data-testid='ad-brand-suitability-radio-group'
          onChange={formikInfo.handleChange}
          radioGroupName={createCampaignWizardModel.formField.adSetBrandSuitabilityType.name}
          value={formikInfo.values.adSetBrandSuitabilityType}>
          {getBrandSuitabilityCard({
            disableInputs,
            labelForId: AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_SELECT,
            selected:
              formikInfo.values.adSetBrandSuitabilityType ===
              AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_SELECT,
            suitabilityType: AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_SELECT,
          })}
          {getBrandSuitabilityCard({
            disableInputs,
            labelForId: AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_STANDARD,
            selected:
              formikInfo.values.adSetBrandSuitabilityType ===
              AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_STANDARD,
            suitabilityType: AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_STANDARD,
          })}
        </CardRadioGroup>
      </div>
    </>
  );
};

export const AdSetGenreTargetingFormGroup = ({
  disableInputs,
  formikInfo,
}: {
  disableInputs: boolean;
  formikInfo: TODOFIXANY;
}) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const {
    classes: {
      autocompleteBox,
      autoCompleteRoot,
      autocompleteTag,
      chipDeleteIcon,
      genreTitle,
      inputBaseRootOverride,
    },
  } = makeStyles()(() => ({
    autocompleteBox: {
      paddingBottom: 5,
      paddingTop: '30px !important',
    },
    autoCompleteRoot: {
      '& > * + *': {
        marginTop: 24,
      },
      width: '100%',
    },
    autocompleteTag: {
      background: 'rgba(255, 255, 255, 0.16)',
      color: 'white',
      // @ts-ignore
      fontWeight: '500',
    },
    chipDeleteIcon: {
      color: '#FAFAFA',
    },
    genreTitle: {
      marginBottom: 12,
      marginTop: 20,
    },
    inputBaseRootOverride: {
      '& .MuiInputBase-root': {
        margin: '0 !important',
        minHeight: '0 !important',
        padding: '10px !important',
      },
      '& .MuiOutlinedInput-root': {
        margin: '0 !important',
        minHeight: '0 !important',
        padding: '10px !important',
      },
    },
  }))();

  const genresToDisplay = () => NewGenres.filter((genre) => !genre.deprecated);

  const handleGenreChange = (values: TODOFIXANY) => {
    let newValuesToSet = values;

    const itemsSelectedBeforeInputChange = formikInfo.values.adSetGenreTargeting.genres;

    const allItemsAlreadySelected = itemsSelectedBeforeInputChange.find(
      (genreObj: FormInputObj) => {
        return genreObj.value === AllGenresObj.value;
      },
    );

    const newValuesHaveAllItemsSelected = values.find((genreObj: FormInputObj) => {
      return genreObj.value === AllGenresObj.value;
    });

    if (newValuesHaveAllItemsSelected && !allItemsAlreadySelected) {
      newValuesToSet = [AllGenresObj];
    }

    if (allItemsAlreadySelected && newValuesHaveAllItemsSelected) {
      newValuesToSet = values.filter((genreObj: FormInputObj) => {
        return genreObj.value !== AllGenresObj.value;
      });
    }

    const allGenresLength = genresToDisplay().length - 1;
    if (values.length === allGenresLength && !newValuesHaveAllItemsSelected) {
      newValuesToSet = [AllGenresObj];
    }

    formikInfo.setFieldTouched(
      createCampaignWizardModel.formField.adSetGenreTargeting.name,
      true,
      true,
    );

    formikInfo.setFieldValue(createCampaignWizardModel.formField.adSetGenreTargeting.name, {
      genres: newValuesToSet,
    });
    formikInfo.validateField(createCampaignWizardModel.formField.adSetGenreTargeting.name);
  };

  const GenreAutocomplete = (
    <AutocompleteWrapperWithRightAlignedHelperText
      helperTextValue={`${formikInfo.values?.adSetGenreTargeting?.genres?.length} / ${genresToDisplay().length}`}>
      <Autocomplete
        ChipProps={{ classes: { deleteIcon: chipDeleteIcon } }}
        classes={{ inputRoot: autocompleteBox, root: inputBaseRootOverride, tag: autocompleteTag }}
        data-testid='genre-autocomplete'
        disabled={disableInputs}
        getOptionLabel={(option) => {
          return translate(option?.title);
        }}
        id={createCampaignWizardModel.formField.adSetGenreTargeting.name}
        isOptionEqualToValue={(option, value) => option?.value === value?.value}
        limitTags={10}
        multiple
        onChange={(_event: ChangeEvent<object>, value: TODOFIXANY) => handleGenreChange(value)}
        options={genresToDisplay()}
        renderInput={(params) => (
          <TextField
            {...params}
            error={
              formikInfo.touched.adSetGenreTargeting &&
              Boolean(formikInfo.errors.adSetGenreTargeting)
            }
            helperText={
              formikInfo.touched.adSetGenreTargeting && formikInfo.errors.adSetGenreTargeting
            }
            label={createCampaignWizardModel.formField.adSetGenreTargeting.label}
            name={createCampaignWizardModel.formField.adSetGenreTargeting.name}
            onBlur={formikInfo.handleBlur}
            placeholder='Select Genres'
          />
        )}
        renderOption={(props, option) => {
          return <GenreSelectionAutocompleteRow genreOption={option} {...props} />;
        }}
        value={formikInfo.values.adSetGenreTargeting.genres}
      />
    </AutocompleteWrapperWithRightAlignedHelperText>
  );

  let titleText = 'Experience Genre';
  let descriptionText = 'Select the types of experiences your ad will be displayed in.';
  if (formikInfo.values.adType === AdFormatType.TILE) {
    titleText = 'Audience Genre';
    descriptionText = 'Select audience segments based on their recent experience preferences.';
  }

  return (
    <div className={autoCompleteRoot}>
      <div className={genreTitle}>
        <Typography variant='h4'>{titleText}</Typography>
      </div>
      <Typography variant='smallLabel2'>{descriptionText}</Typography>
      {GenreAutocomplete}
    </div>
  );
};

function getFlattenedLocationOptions(locationTargeting: TODOFIXANY) {
  const { countries = [], regions: flatRegions = [] } = locationTargeting || {};
  return [...flatRegions, ...countries];
}

const ExpandingRegionAndCountrySelectionRow = ({
  carrotExpanded,
  checkboxState = 'UNCHECKED',
  locationInfo,
  onCarrotClick = noop,
  onRowToggle = noop,
  regionToCountryMap,
  rowType,
  showTooltipOnhover = false,
}: {
  carrotExpanded: boolean;
  checkboxState: 'CHECKED' | 'UNCHECKED' | 'PARTIAL';
  locationInfo: TODOFIXANY;
  onCarrotClick: TODOFIXANY;
  onRowToggle: TODOFIXANY;
  regionToCountryMap: TODOFIXANY;
  rowType: 'COUNTRY' | 'REGION' | 'SUPER_GROUP';
  showTooltipOnhover: boolean;
}) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const isRegion = rowType === 'REGION';
  const isSuperGroup = rowType === 'SUPER_GROUP';

  const {
    classes: {
      countryRow,
      hidden,
      regularRow,
      sectionExpandToggleIconContainer,
      sectionExpansionContainer,
    },
  } = makeStyles()(() => ({
    countryRow: {
      paddingLeft: 25,
      width: '100%',
    },
    hidden: { visibility: 'hidden' },
    regularRow: {
      width: '100%',
    },
    sectionExpandToggleIconContainer: {
      marginLeft: 'auto',
      position: 'absolute',
      right: 12,
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 99999,
    },
    sectionExpansionContainer: {
      minWidth: '100%',
      position: 'relative',
      width: '100%',
    },
  }))();

  const handleRowClick = (event: MouseEvent | KeyboardEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onRowToggle();
  };

  return (
    <div
      className={sectionExpansionContainer}
      onBlur={noop}
      onClick={handleRowClick}
      onFocus={noop}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault(); // Prevent default scrolling for Space key
          handleRowClick(e); // Trigger click logic on Enter/Space
        }
      }}
      onMouseOut={() => setTooltipOpen(false)}
      onMouseOver={() => setTooltipOpen(true)}
      role='button'
      tabIndex={0}>
      <div>
        <FormControlLabel
          className={isRegion || isSuperGroup ? regularRow : countryRow}
          control={
            <Tooltip
              arrow
              open={tooltipOpen && showTooltipOnhover}
              placement='top'
              title='Maximum of 15 selections allowed. To choose individual countries, uncheck region first'>
              <Checkbox
                checked={checkboxState === 'CHECKED'}
                classes={{ root: isSuperGroup ? hidden : '' }}
                color='primary'
                indeterminate={checkboxState === 'PARTIAL'}
                onChange={onRowToggle}
                size='medium'
              />
            </Tooltip>
          }
          label={
            <div>
              <Typography
                style={isRegion || isSuperGroup ? {} : { color: '#989898' }}
                variant='body1'>
                {locationInfo.title}
              </Typography>
              {locationInfo.parentRegion &&
                Boolean(regionToCountryMap[locationInfo.regionCode]?.length) && (
                  <div
                    className={sectionExpandToggleIconContainer}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      onCarrotClick(locationInfo);
                    }}
                    onKeyPress={noop}
                    role='button'
                    tabIndex={0}>
                    {carrotExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </div>
                )}
            </div>
          }
        />
      </div>
    </div>
  );
};

export const handleGenderChange = (
  ev: TODOFIXANY,
  formikInfo: TODOFIXANY,
  adSetNameEdited: boolean,
  isU13Applicable = false,
) => {
  const currentGender = formikInfo.values.adSetGenderTargeting.gender;
  const checkboxValue = ev.target.value;
  const checkboxIsCurrentGender = currentGender === checkboxValue;
  const currentlyChecked = checkboxIsCurrentGender || currentGender === Gender.GENDER_ANY;
  const oppositeGender =
    checkboxValue === Gender.GENDER_MALE ? Gender.GENDER_FEMALE : Gender.GENDER_MALE;
  let newGender;

  if (checkboxValue === Gender.GENDER_ANY) {
    newGender = checkboxIsCurrentGender ? Gender.GENDER_UNDEFINED_INVALID : Gender.GENDER_ANY;
  } else if (currentlyChecked) {
    newGender =
      currentGender === Gender.GENDER_ANY ? oppositeGender : Gender.GENDER_UNDEFINED_INVALID;
  } else {
    newGender = currentGender === oppositeGender ? Gender.GENDER_ANY : checkboxValue;
  }
  formikInfo.setFieldValue(createCampaignWizardModel.formField.adSetGenderTargeting.name, {
    gender: newGender,
  });

  setTimeout(() => {
    formikInfo?.validateField(createCampaignWizardModel.formField.adSetGenderTargeting.name);
  }, 0);

  setNewAdsetName({
    adSetNameEdited,
    formikInfo,
    isU13Applicable,
    newGenders: {
      gender: newGender,
    },
  });
};
export const AdSetAudienceTargetingFormGroup = ({
  adSetNameEdited,
  creatingNewCampaign = false,
  disableInputs,
  formikInfo,
  isU13TargetingApplicable,
  u13UserIsTarget,
  u18UserIsTarget,
}: {
  adSetNameEdited: boolean;
  creatingNewCampaign?: boolean;
  disableInputs: boolean;
  formikInfo: TODOFIXANY;
  isU13TargetingApplicable: () => boolean;
  u13UserIsTarget: boolean;
  u18UserIsTarget: boolean;
}) => {
  const {
    classes: {
      audienceRowFlexGroup,
      audienceRowPrefixTitle,
      autocompleteBox,
      autoCompleteRoot,
      autocompleteTag,
      chipDeleteIcon,
      customErrorHelperText,
      genderDisclosureForEU,
      inputBaseRootOverride,
      regionAutoCompleteRow,
    },
  } = makeStyles()(() => ({
    audienceRowFlexGroup: {
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 16,
    },
    audienceRowPrefixTitle: {
      height: 'min-content',
      marginRight: 10,
      width: 70,
    },
    autocompleteBox: {
      paddingBottom: 5,
      paddingTop: '30px !important',
    },
    autoCompleteRoot: {
      '& > * + *': {
        marginTop: 24,
      },
      width: '100%',
    },
    autocompleteTag: {
      background: 'rgba(255, 255, 255, 0.16)',
      color: 'white',
      // @ts-ignore
      fontWeight: '500',
    },
    chipDeleteIcon: {
      color: '#FAFAFA',
    },
    customErrorHelperText: {
      color: '#F4645D',
      marginLeft: '14px !important',
      marginTop: '3px !important',
    },
    customHelperText: {
      marginLeft: '14px !important',
      marginTop: '3px !important',
    },
    genderDisclosureForEU: {
      opacity: 0.7,
      paddingLeft: 90,
      width: '100%',
    },
    inputBaseRootOverride: {
      '& .MuiInputBase-root': {
        margin: '0 !important',
        minHeight: '0 !important',
        padding: '10px !important',
      },
      '& .MuiOutlinedInput-root': {
        margin: '0 !important',
        minHeight: '0 !important',
        padding: '10px !important',
      },
    },
    lineBreakFlexRow: {
      flexBasis: '100%',
      height: 0,
    },
    regionAutoCompleteRow: {
      marginTop: 16,
    },
  }))();

  const {
    coreCountryOverrideCodeList,
    coreRegionCodeList,
    strategicRegionCodeList,
    videoMinBidMappingsMicroUsd,
  } = useAppStore((state: AppStoreType) => state.appData);

  const [regionInputSearchText, setRegionInputSearchText] = useState('');
  const [expandedRegions, setExpandedRegions] = useState<TODOFIXANY>({});

  const disableGenderTargeting = u18UserIsTarget || u13UserIsTarget;
  const disableDeviceTargeting = u13UserIsTarget;
  const restrictAgeTargetingForSelectedAdFormat =
    formikInfo.values.adSetRestrictedMaturity &&
    isRestrictedExperienceTargetingAdFormat(formikInfo.values.adType);

  const handleAgeBucketsChange = (ev: TODOFIXANY) => {
    const currentCheckedValues = formikInfo.values.adSetAgeBucketTargeting.ageBuckets;
    const checkboxValue = ev.target.value;
    const currentlyChecked = currentCheckedValues.includes(checkboxValue);

    const applicableBucketCount = getApplicableAgeBucketCount(isU13TargetingApplicable());
    const currentlyAllChecked = currentCheckedValues.length === applicableBucketCount;
    let newValuesToSet;

    if (currentlyAllChecked) {
      newValuesToSet = currentCheckedValues.filter((value: AgeBucketType) => {
        return value !== checkboxValue;
      });

      formikInfo.setFieldValue(createCampaignWizardModel.formField.adSetAgeBucketTargeting.name, {
        ageBuckets: newValuesToSet,
      });
    } else if (currentlyChecked) {
      newValuesToSet = currentCheckedValues.filter((value: AgeBucketType) => {
        return value !== checkboxValue;
      });
      formikInfo.setFieldValue(createCampaignWizardModel.formField.adSetAgeBucketTargeting.name, {
        ageBuckets: newValuesToSet,
      });
    } else {
      newValuesToSet = currentCheckedValues.concat(checkboxValue);
      formikInfo.setFieldValue(createCampaignWizardModel.formField.adSetAgeBucketTargeting.name, {
        ageBuckets: newValuesToSet,
      });
    }

    setTimeout(() => {
      formikInfo.validateField(createCampaignWizardModel.formField.adSetAgeBucketTargeting.name);
    }, 0);

    setNewAdsetName({
      adSetNameEdited,
      formikInfo,
      isU13Applicable: isU13TargetingApplicable(),
      newAgeBuckets: {
        ageBuckets: newValuesToSet,
      },
    });
  };

  // De-select 5-12 if restricted (18+) experience is selected
  if (
    restrictAgeTargetingForSelectedAdFormat &&
    formikInfo.values?.adSetAgeBucketTargeting?.ageBuckets?.includes(
      AgeBucketType.AGE_BUCKET_TYPE_5_TO_12,
    )
  ) {
    const newValuesToSet = formikInfo.values?.adSetAgeBucketTargeting?.ageBuckets?.filter(
      (value: AgeBucketType) => {
        return value !== AgeBucketType.AGE_BUCKET_TYPE_5_TO_12;
      },
    );
    formikInfo.setFieldValue(createCampaignWizardModel.formField.adSetAgeBucketTargeting.name, {
      ageBuckets: newValuesToSet,
    });

    setTimeout(() => {
      formikInfo.validateField(createCampaignWizardModel.formField.adSetAgeBucketTargeting.name);
    }, 0);

    setNewAdsetName({
      adSetNameEdited,
      formikInfo,
      isU13Applicable: isU13TargetingApplicable(),
      newAgeBuckets: {
        ageBuckets: newValuesToSet,
      },
    });
  }

  // De-select 13-17 if restricted (18+) is selected and objective is visits
  if (
    restrictAgeTargetingForSelectedAdFormat &&
    formikInfo.values?.adSetAgeBucketTargeting?.ageBuckets?.includes(
      AgeBucketType.AGE_BUCKET_TYPE_13_TO_17,
    )
  ) {
    const newValuesToSet = formikInfo.values?.adSetAgeBucketTargeting?.ageBuckets?.filter(
      (value: AgeBucketType) => {
        return value !== AgeBucketType.AGE_BUCKET_TYPE_13_TO_17;
      },
    );
    formikInfo.setFieldValue(createCampaignWizardModel.formField.adSetAgeBucketTargeting.name, {
      ageBuckets: newValuesToSet,
    });

    setTimeout(() => {
      formikInfo.validateField(createCampaignWizardModel.formField.adSetAgeBucketTargeting.name);
    }, 0);

    setNewAdsetName({
      adSetNameEdited,
      formikInfo,
      isU13Applicable: isU13TargetingApplicable(),
      newAgeBuckets: {
        ageBuckets: newValuesToSet,
      },
    });
  }

  const getDeviceTypeFromDeviceFormOptions = (deviceObj: FormInputObj) => deviceObj.value;
  const allDeviceValues = devices.map(getDeviceTypeFromDeviceFormOptions);
  const allDeviceValuesMinusTheAllOption = allDeviceValues.filter(
    (val) => val !== DeviceType.DEVICE_TYPE_ALL,
  );

  const handleDevicesChange = (ev: TODOFIXANY) => {
    const currentCheckedValues = formikInfo.values.adSetDeviceTargeting.devices;
    const checkboxValue = ev.target.value;
    const currentlyChecked = currentCheckedValues.includes(checkboxValue);

    if (checkboxValue === DeviceType.DEVICE_TYPE_ALL) {
      if (currentlyChecked) {
        formikInfo.setFieldValue(createCampaignWizardModel.formField.adSetDeviceTargeting.name, {
          devices: [],
        });
      } else {
        formikInfo.setFieldValue(createCampaignWizardModel.formField.adSetDeviceTargeting.name, {
          devices: allDeviceValues,
        });
      }
      return;
    }

    const currentlyAllChecked = currentCheckedValues.length === devices.length;

    if (currentlyAllChecked) {
      const newlyCheckedDevices = currentCheckedValues.filter((value: DeviceType) => {
        return value !== DeviceType.DEVICE_TYPE_ALL && value !== checkboxValue;
      });

      formikInfo.setFieldValue(createCampaignWizardModel.formField.adSetDeviceTargeting.name, {
        devices: newlyCheckedDevices,
      });
      return;
    }

    if (currentlyChecked) {
      formikInfo.setFieldValue(createCampaignWizardModel.formField.adSetDeviceTargeting.name, {
        devices: currentCheckedValues.filter((value: DeviceType) => {
          return value !== checkboxValue;
        }),
      });
    } else {
      let newlyCheckedDevices = currentCheckedValues.concat(checkboxValue);

      if (arrayHasSameMembers(newlyCheckedDevices, allDeviceValuesMinusTheAllOption)) {
        newlyCheckedDevices = allDeviceValues;
      }

      formikInfo.setFieldValue(createCampaignWizardModel.formField.adSetDeviceTargeting.name, {
        devices: newlyCheckedDevices,
      });
    }
  };

  const flattenedLocationOptions = useMemo(() => {
    return getFlattenedLocationOptions(formikInfo.values.adSetMixedRegionAndCountryTargeting);
  }, [formikInfo.values.adSetMixedRegionAndCountryTargeting]);

  const allLocationsSelected = () => {
    return formikInfo.values.adSetMixedRegionAndCountryTargeting.regions.some(
      (locationObj: TODOFIXANY) => locationObj.regionCode === 'All',
    );
  };

  const allNonEUStandAloneCountries = regionsAndCountriesSortedAlph.filter(
    (locationObj) => locationObj.nonEU && !locationObj.parentRegion && !locationObj.superGroup,
  );

  const allNonEURegionsMixedRegionAndCountries = regionsAndCountriesSortedAlph.filter(
    (locationObj) => locationObj.nonEU && locationObj.parentRegion && !locationObj.superGroup,
  );

  const regionToCountryMap: TODOFIXANY = {};

  regionsAndCountriesSortedAlph.forEach((locationObj: RegionsAndLocationsFormInputObj) => {
    const { countryCode, regionCode } = locationObj;
    const foundRegionMapping = regionToCountryMap[regionCode];

    if (countryCode) {
      if (foundRegionMapping) {
        foundRegionMapping.push(locationObj);
      } else {
        regionToCountryMap[regionCode] = [locationObj];
      }
    } else {
      regionToCountryMap[regionCode] = [];
    }
  });

  const regionToChildrenCountryComposite: TODOFIXANY = {};

  Object.entries(regionToCountryMap).forEach(([key, val]: [TODOFIXANY, TODOFIXANY]) => {
    regionToChildrenCountryComposite[key] = val
      .map((obj: RegionsAndLocationsFormInputObj) => obj.countryCode)
      .sort()
      .join('');
  });

  const allRegions = regionsAndCountriesSortedAlph.filter(
    (locationObj) => locationObj.parentRegion,
  );

  const allRegionsCompositeKey = allRegions
    .map((obj: RegionsAndLocationsFormInputObj) => obj.regionCode)
    .sort()
    .join('');

  const dedupeArray = (arr: TODOFIXANY[]) => {
    const arrayAsSet = new Set(arr);
    return Array.from(arrayAsSet);
  };

  const mergeCountriesIntoRegions = (listOfCountryObjs: RegionsAndLocationsFormInputObj[]) => {
    let finalCountries: RegionsAndLocationsFormInputObj[] = [];
    const finalRegions: RegionsAndLocationsFormInputObj[] = [];
    const groupedCountries: TODOFIXANY = {};

    listOfCountryObjs.forEach((locationObj: RegionsAndLocationsFormInputObj) => {
      const { regionCode } = locationObj;
      groupedCountries[regionCode] = [];
    });

    listOfCountryObjs.forEach((locationObj: RegionsAndLocationsFormInputObj) => {
      const { countryCode, regionCode } = locationObj;
      if (countryCode) {
        groupedCountries[regionCode].push(locationObj);
      }
    });

    Object.entries(groupedCountries).forEach(([regionCode, selectedCountries]) => {
      const countriesCompositeKey = (selectedCountries as RegionsAndLocationsFormInputObj[])
        .map((obj: RegionsAndLocationsFormInputObj) => obj.countryCode)
        .sort()
        .join('');
      if (regionToChildrenCountryComposite[regionCode] === countriesCompositeKey) {
        const parentRegion = regionsAndCountriesSortedAlph.find(
          (locationObj) => locationObj.regionCode === regionCode && locationObj.parentRegion,
        );
        if (parentRegion) {
          finalRegions.push(parentRegion);
        }
      } else {
        finalCountries = finalCountries.concat(
          selectedCountries as RegionsAndLocationsFormInputObj[],
        );
      }
    });

    return {
      countries: finalCountries,
      regions: finalRegions,
    };
  };

  const getRowType = (locationInfo: RegionsAndLocationsFormInputObj) => {
    if (locationInfo.superGroup) {
      return 'SUPER_GROUP';
    }
    if (locationInfo.parentRegion) {
      return 'REGION';
    }
    return 'COUNTRY';
  };

  const getCheckboxState = (locationInfo: RegionsAndLocationsFormInputObj) => {
    const isCountry = !locationInfo.parentRegion && !locationInfo.superGroup;
    const isRegion = locationInfo.parentRegion;

    const inSelectedRegions = formikInfo.values.adSetMixedRegionAndCountryTargeting?.regions?.some(
      (regionObj: TODOFIXANY) => {
        return regionObj.value === locationInfo.value;
      },
    );

    const inSelectedCountries =
      formikInfo.values.adSetMixedRegionAndCountryTargeting?.countries?.some(
        (countryObj: TODOFIXANY) => {
          return countryObj.value === locationInfo.value;
        },
      );

    const childCountriesSelected =
      formikInfo.values.adSetMixedRegionAndCountryTargeting?.countries?.some(
        (countryObj: TODOFIXANY) => {
          return isRegion && countryObj.regionCode === locationInfo.regionCode;
        },
      );

    const isCountryUnderSelectedRegion =
      formikInfo.values.adSetMixedRegionAndCountryTargeting?.regions?.some(
        (regionObj: TODOFIXANY) => {
          return regionObj.regionCode === locationInfo.regionCode;
        },
      );

    if (allLocationsSelected() || (isRegion && inSelectedRegions) || isCountryUnderSelectedRegion) {
      return 'CHECKED';
    }

    // Only region rows can show indeterminate
    if (isRegion && !inSelectedRegions && childCountriesSelected) {
      return 'PARTIAL';
    }

    if (isCountry && inSelectedCountries) {
      return 'CHECKED';
    }

    // TODO: Special case for non-eu countries
    return 'UNCHECKED';
  };

  const getExpandedState = (locationInfo: RegionsAndLocationsFormInputObj) => {
    if (expandedRegions[locationInfo.regionCode]) {
      return true;
    }
    return false;
  };

  const toggleExpandedState = (locationInfo: RegionsAndLocationsFormInputObj) => {
    const newExpandedRegions = { ...expandedRegions };
    if (expandedRegions[locationInfo.regionCode]) {
      delete newExpandedRegions[locationInfo.regionCode];
      setExpandedRegions(newExpandedRegions);
    } else {
      newExpandedRegions[locationInfo.regionCode] = true;
      setExpandedRegions(newExpandedRegions);
    }
  };

  const locationExistsInArr = (
    locationObjs: RegionsAndLocationsFormInputObj[],
    locationObj: RegionsAndLocationsFormInputObj,
  ) => {
    if (
      locationObjs.some((item: RegionsAndLocationsFormInputObj) => {
        return item.value === locationObj.value;
      })
    ) {
      return true;
    }
    return false;
  };

  const getTotalSelectedLocations = (locationTargeting: TODOFIXANY) => {
    const countryCount = locationTargeting?.countries?.length || 0;
    const regionCount = locationTargeting?.regions?.length || 0;
    return regionCount + countryCount;
  };

  const calculateLocationsTargetingAfterToggle = (
    previousValues: TODOFIXANY,
    newValue: TODOFIXANY,
  ) => {
    const useAllLocationsSpecialCase = allLocationsSelected();
    const isCountry = !newValue.parentRegion && !newValue.superGroup;
    const isRegion = newValue.parentRegion;
    if (useAllLocationsSpecialCase) {
      const isAllRegions = newValue.regionCode === 'All';
      if (isAllRegions) {
        return {
          countries: [],
          regions: [],
        };
      }
      if (isRegion) {
        return {
          countries: [],
          regions: allRegions.filter(
            (locationObj) => locationObj.regionCode !== newValue.regionCode,
          ),
        };
      }

      if (isCountry) {
        return {
          countries: regionToCountryMap[newValue.regionCode].filter(
            (locationObj: TODOFIXANY) => locationObj.value !== newValue.value,
          ),
          regions: allRegions.filter(
            (locationObj) => locationObj.regionCode !== newValue.regionCode,
          ),
        };
      }
    }

    let selectedRegions: RegionsAndLocationsFormInputObj[] = Array.from(previousValues.regions);
    let selectedCountries: RegionsAndLocationsFormInputObj[] = Array.from(previousValues.countries);

    if (newValue.regionCode === 'AllNonEU') {
      selectedRegions = allNonEURegionsMixedRegionAndCountries;
      selectedCountries = allNonEUStandAloneCountries;
    } else if (newValue.regionCode === 'All') {
      if (locationExistsInArr(selectedRegions, newValue)) {
        selectedRegions = [];
        selectedCountries = [];
      } else {
        selectedRegions = [newValue];
        selectedCountries = [];
      }
    } else if (newValue.parentRegion) {
      if (locationExistsInArr(selectedRegions, newValue)) {
        selectedRegions = selectedRegions.filter((regionObj) => regionObj.value !== newValue.value);
      } else if (
        selectedCountries.some((countryObj) => countryObj.regionCode === newValue.regionCode)
      ) {
        selectedRegions = selectedRegions.concat([newValue]);
        selectedCountries = selectedCountries.filter(
          (countryObj) => countryObj.regionCode !== newValue.regionCode,
        );
      } else {
        selectedRegions.push(newValue);
      }
    } else if (locationExistsInArr(selectedCountries, newValue)) {
      selectedCountries = selectedCountries.filter(
        (countryObj) => countryObj.value !== newValue.value,
      );
    } else if (
      selectedRegions.some((locationObj) => locationObj.regionCode === newValue.regionCode)
    ) {
      selectedRegions = selectedRegions.filter(
        (regionObj) => regionObj.regionCode !== newValue.regionCode,
      );

      selectedCountries = selectedCountries
        .concat(regionToCountryMap[newValue.regionCode])
        .filter((locationObj) => locationObj.value !== newValue.value);
    } else {
      selectedCountries.push(newValue);
    }

    const { countries: finalCountries, regions: augmentedRegions } = mergeCountriesIntoRegions(
      dedupeArray(selectedCountries),
    );

    let finalRegions = dedupeArray(selectedRegions.concat(augmentedRegions));

    const finalRegionsCompositeKey = finalRegions
      .map((obj: RegionsAndLocationsFormInputObj) => obj.regionCode)
      .sort()
      .join('');

    if (
      allRegionsCompositeKey === finalRegionsCompositeKey ||
      (finalRegions.length && finalRegions.every((locationObj) => locationObj.regionCode === 'All'))
    ) {
      finalRegions = [allLocationsObj];
    } else {
      finalRegions = finalRegions.filter((locationObj) => locationObj.regionCode !== 'All');
    }

    return {
      countries: dedupeArray(finalCountries),
      regions: finalRegions,
    };
  };

  const onToggleAttempt = (previousValues: TODOFIXANY, newValue: TODOFIXANY) => {
    const targetingAfterToggle = calculateLocationsTargetingAfterToggle(previousValues, newValue);
    const resultWouldBeGreaterThan15Selections =
      getTotalSelectedLocations(targetingAfterToggle) > 15;
    if (resultWouldBeGreaterThan15Selections) {
      // noop
    } else {
      formikInfo.setFieldTouched(
        createCampaignWizardModel.formField.adSetMixedRegionAndCountryTargeting.name,
        true,
        true,
      );

      setTimeout(() => {
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.adSetMixedRegionAndCountryTargeting.name,
          targetingAfterToggle,
        );

        const convertedToParentRegions = convertAdSetMixedRegionAndCountryTargetingIntoRegions(
          targetingAfterToggle || [],
        );

        if (convertedToParentRegions?.length) {
          // Update the max bid so user can continue with the submit with no additional interaction

          const defaultBidValue = getDefaultBidValue(
            formikInfo.values[createCampaignWizardModel.formField.adSetBidType.name],
            formikInfo.values[createCampaignWizardModel.formField.adSetAuctionType.name],
            formikInfo.values[createCampaignWizardModel.formField.adType.name],
            // @ts-ignore
            convertedToParentRegions.map((regionObj) => regionObj.value),
            targetingAfterToggle?.countries || [],
            coreRegionCodeList,
            strategicRegionCodeList,
            coreCountryOverrideCodeList,
            { videoMinBidMappingsMicroUsd },
          );

          if (
            !formikInfo.touched[createCampaignWizardModel.formField.adSetBidValueUsd.name] ||
            defaultBidValue >
              formikInfo.values[createCampaignWizardModel.formField.adSetBidValueUsd.name]
          ) {
            formikInfo.setFieldValue(
              createCampaignWizardModel.formField.adSetBidValueUsd.name,
              defaultBidValue,
            );
          }
        }

        setNewAdsetName({
          adSetNameEdited,
          formikInfo,
          isU13Applicable: isU13TargetingApplicable(),
          newLocations: {
            regions: [
              ...targetingAfterToggle.regions,
              ...dedupeArray(targetingAfterToggle.countries),
            ],
          },
        });
        setTimeout(() => {
          formikInfo.validateField(
            createCampaignWizardModel.formField.adSetMixedRegionAndCountryTargeting.name,
          );
        }, 100);
      }, 0);
    }
  };

  const RegionAutocomplete = (
    <AutocompleteWrapperWithRightAlignedHelperText
      helperTextValue={`${
        Object.values(formikInfo.values.adSetMixedRegionAndCountryTargeting).flat().length
      } / 15`}>
      <Autocomplete
        ChipProps={{ classes: { deleteIcon: chipDeleteIcon } }}
        classes={{ inputRoot: autocompleteBox, root: inputBaseRootOverride, tag: autocompleteTag }}
        data-testid='region-autocomplete'
        disableCloseOnSelect
        disabled={disableInputs}
        filterOptions={(options, state) => {
          const { inputValue } = state;
          if (inputValue) {
            return options.filter(({ title }) => {
              const regionContainsSearchText = title
                .toLowerCase()
                .includes(regionInputSearchText.toLowerCase());
              return regionContainsSearchText;
            });
          }
          // TODO: Show rows if matching search regardless if it should be expanded and mix with filter below
          // return options.filter(({ title }) =>
          //   title.toLowerCase().includes(regionInputSearchText.toLowerCase())
          // );
          // Hiding elements when parent regions are not expanded
          return options.filter(
            ({ parentRegion, regionCode, superGroup }) =>
              parentRegion || superGroup || expandedRegions[regionCode],
          );
        }}
        getOptionLabel={(option) => {
          return option?.title;
        }}
        id={createCampaignWizardModel.formField.adSetMixedRegionAndCountryTargeting.name}
        isOptionEqualToValue={(option, value) => option?.value === value?.value}
        limitTags={15}
        multiple
        onChange={(
          _event: ChangeEvent<object>,
          _newFlatLocationValues: TODOFIXANY,
          action: string,
          optionToRemove: TODOFIXANY,
        ) => {
          if (action === 'clear') {
            formikInfo.setFieldTouched(
              createCampaignWizardModel.formField.adSetMixedRegionAndCountryTargeting.name,
              true,
              true,
            );
            formikInfo.setFieldValue(
              createCampaignWizardModel.formField.adSetMixedRegionAndCountryTargeting.name,
              {
                countries: [],
                regions: [],
              },
            );
          }
          if (optionToRemove) {
            onToggleAttempt(
              formikInfo.values.adSetMixedRegionAndCountryTargeting,
              optionToRemove.option,
            );
          }
        }}
        onInputChange={(_ev, newVal) => {
          setRegionInputSearchText(newVal);
        }}
        options={regionsAndCountriesSortedAlph.filter(
          (region) => region.regionCode !== allNonEULocationsObj.regionCode,
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            error={
              formikInfo.touched.adSetMixedRegionAndCountryTargeting &&
              Boolean(formikInfo.errors.adSetMixedRegionAndCountryTargeting)
            }
            helperText={
              formikInfo.touched.adSetMixedRegionAndCountryTargeting &&
              formikInfo.errors.adSetMixedRegionAndCountryTargeting
            }
            label={createCampaignWizardModel.formField.adSetMixedRegionAndCountryTargeting.label}
            name={createCampaignWizardModel.formField.adSetMixedRegionAndCountryTargeting.name}
            onBlur={formikInfo.handleBlur}
            placeholder='Add Location'
          />
        )}
        renderOption={(_el, option) => {
          return (
            <ExpandingRegionAndCountrySelectionRow
              carrotExpanded={getExpandedState(option)}
              checkboxState={getCheckboxState(option)}
              locationInfo={option}
              onCarrotClick={toggleExpandedState}
              onRowToggle={() =>
                onToggleAttempt(formikInfo.values.adSetMixedRegionAndCountryTargeting, option)
              }
              regionToCountryMap={regionToCountryMap}
              rowType={getRowType(option)}
              showTooltipOnhover={
                getTotalSelectedLocations(
                  calculateLocationsTargetingAfterToggle(
                    formikInfo.values.adSetMixedRegionAndCountryTargeting,
                    option,
                  ),
                ) > 15
              }
            />
          );
        }}
        value={flattenedLocationOptions}
      />
    </AutocompleteWrapperWithRightAlignedHelperText>
  );

  return (
    <>
      <div className={autoCompleteRoot}>
        <Typography variant='h4'>Audience</Typography>
      </div>
      {
        <div>
          {creatingNewCampaign && (
            <CampaignWizardBanner
              textAfterLink={
                <span>
                  {' — now with '}
                  <b>advanced targeting options</b> you control. Most advertisers are already seeing
                  stronger results than with the classic version.
                </span>
              }
              textBeforeLink='Try the new '
            />
          )}
          <div className={regionAutoCompleteRow}>{RegionAutocomplete}</div>
          <div className={audienceRowFlexGroup}>
            <span className={audienceRowPrefixTitle}>Genders</span>
            <Field name={createCampaignWizardModel.formField.adSetGenderTargeting.name}>
              {({
                field, // { name, value, onChange, onBlur }
                meta,
              }: TODOFIXANY) => {
                return (
                  <>
                    {genders.map((genderObj) => {
                      return (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={
                                field.value?.gender === genderObj.value ||
                                field.value?.gender === Gender.GENDER_ANY
                              }
                              color='primary'
                              data-testid={`gender-checkbox-${genderObj.value}`}
                              disabled={disableInputs || disableGenderTargeting}
                              key={genderObj.value}
                              onChange={(ev) =>
                                handleGenderChange(
                                  ev,
                                  formikInfo,
                                  adSetNameEdited,
                                  isU13TargetingApplicable(),
                                )
                              }
                              role='checkbox'
                              size='medium'
                              value={genderObj.value}
                            />
                          }
                          key={genderObj.value}
                          label={genderObj.label}
                        />
                      );
                    })}
                    {meta.error && (
                      <FormHelperText classes={{ root: customErrorHelperText }}>
                        {meta.error}
                      </FormHelperText>
                    )}
                  </>
                );
              }}
            </Field>
            {disableGenderTargeting && (
              <Typography className={genderDisclosureForEU} italics variant='smallLabel2'>
                {(() => {
                  if (u13UserIsTarget && u18UserIsTarget) {
                    return "Gender can't be targeted when advertising to users ages 5-12 or 13-17";
                  }
                  if (u13UserIsTarget) {
                    return "Gender can't be targeted when advertising to users ages 5-12";
                  }
                  return "Gender can't be targeted when advertising to users ages 13-17";
                })()}
              </Typography>
            )}
          </div>
          <div className={audienceRowFlexGroup}>
            <span className={audienceRowPrefixTitle}>Ages</span>
            <Field name={createCampaignWizardModel.formField.adSetAgeBucketTargeting.name}>
              {({ field, meta }: TODOFIXANY) => {
                return (
                  <>
                    {isU13TargetingApplicable() && (
                      <Tooltip
                        disableHoverListener={!restrictAgeTargetingForSelectedAdFormat}
                        title='Ad Set must only target 18+ users for the experience type selected.'>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.value.ageBuckets?.includes(u13AgeBucket.value)}
                              color='primary'
                              data-testid='age-bucket-checkbox-5-12'
                              disabled={disableInputs || restrictAgeTargetingForSelectedAdFormat}
                              onChange={handleAgeBucketsChange}
                              size='medium'
                              value={u13AgeBucket.value}
                            />
                          }
                          label={u13AgeBucket.label}
                        />
                      </Tooltip>
                    )}
                    {ageBuckets.map((ageBucketObj) => {
                      if (
                        isRestrictedExperienceTargetingAdFormat(formikInfo.values.adType) &&
                        ageBucketObj.value === AgeBucketType.AGE_BUCKET_TYPE_13_TO_17
                      ) {
                        // 13-17 bucket should be disabled when the selected ad format targets a restricted (18+) experience.
                        return (
                          <Tooltip
                            disableHoverListener={!restrictAgeTargetingForSelectedAdFormat}
                            key={ageBucketObj.value}
                            title='Ad Set must only target 18+ users for the experience type selected.'>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={field.value.ageBuckets?.includes(ageBucketObj.value)}
                                  color='primary'
                                  data-testid='age-bucket-checkbox-restricted'
                                  disabled={
                                    disableInputs || restrictAgeTargetingForSelectedAdFormat
                                  }
                                  key={ageBucketObj.value}
                                  onChange={handleAgeBucketsChange}
                                  size='medium'
                                  value={ageBucketObj.value}
                                />
                              }
                              label={ageBucketObj.label}
                            />
                          </Tooltip>
                        );
                      }
                      return (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.value.ageBuckets?.includes(ageBucketObj.value)}
                              color='primary'
                              data-testid={`age-bucket-checkbox-${ageBucketObj.value}`}
                              disabled={disableInputs}
                              key={ageBucketObj.value}
                              onChange={handleAgeBucketsChange}
                              size='medium'
                              value={ageBucketObj.value}
                            />
                          }
                          key={ageBucketObj.value}
                          label={ageBucketObj.label}
                        />
                      );
                    })}
                    {meta.error && (
                      <FormHelperText classes={{ root: customErrorHelperText }}>
                        {meta.error}
                      </FormHelperText>
                    )}
                  </>
                );
              }}
            </Field>
          </div>
          <div className={audienceRowFlexGroup}>
            <span className={audienceRowPrefixTitle}>Devices</span>
            <Field name={createCampaignWizardModel.formField.adSetDeviceTargeting.name}>
              {({
                field, // { name, value, onChange, onBlur }
                meta,
              }: TODOFIXANY) => {
                return (
                  <>
                    {devices.map((deviceObj) => {
                      return (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={
                                field.value?.devices?.includes(deviceObj.value) ||
                                field.value?.devices?.includes(DeviceType.DEVICE_TYPE_ALL)
                              }
                              color='primary'
                              data-testid={`devices-checkbox-${deviceObj.value}`}
                              disabled={disableInputs || disableDeviceTargeting}
                              key={deviceObj.value}
                              onChange={handleDevicesChange}
                              size='medium'
                              value={deviceObj.value}
                            />
                          }
                          key={deviceObj.value}
                          label={deviceObj.label}
                        />
                      );
                    })}
                    {meta.error && (
                      <FormHelperText classes={{ root: customErrorHelperText }}>
                        {meta.error}
                      </FormHelperText>
                    )}
                  </>
                );
              }}
            </Field>
            {disableDeviceTargeting && (
              <Typography className={genderDisclosureForEU} italics variant='smallLabel2'>
                Device targeting can&apos;t be applied when advertising to users ages 5-12
              </Typography>
            )}
          </div>
        </div>
      }
    </>
  );
};

export const AdSetBiddingFormGroup = ({
  creatingNewCampaign = false,
  disableAuctionInput,
  disableBidInput,
  disableBillableViewDurationInput,
  disableFrequencyInput,
  formikInfo,
  isAdAccountInternal,
  isAdAccountManaged,
}: {
  creatingNewCampaign?: boolean;
  disableAuctionInput: boolean;
  disableBidInput: boolean;
  disableBillableViewDurationInput: boolean;
  disableFrequencyInput: boolean;
  formikInfo: TODOFIXANY;
  isAdAccountInternal: boolean;
  isAdAccountManaged: boolean;
}) => {
  const {
    classes: {
      auctionTypeRadioContainer,
      auctionTypeRadioInput,
      biddingRowFlexGroup,
      biddingSection,
      biddingSubtitle,
      biddingTitle,
      billableDurationContainer,
      configureAdSetInput,
      customHelperText,
      frequencyCappingSection,
      frequencyCappingTitle,
      tooltip,
    },
  } = makeStyles()(() => ({
    auctionTypeRadioContainer: {
      marginRight: 20,
      width: 'fit-content',
    },
    auctionTypeRadioInput: {
      paddingLeft: 0,
    },
    biddingRowFlexGroup: {
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 10,
    },
    biddingSection: {
      marginBottom: 10,
      marginTop: 20,
    },
    biddingSubtitle: {
      marginTop: 12,
    },
    biddingTitle: {
      alignItems: 'center',
      display: 'flex',
    },
    billableDurationContainer: { marginBottom: 12, width: '100%' },
    configureAdSetInput: {
      width: '100%',
    },
    customHelperText: {
      color: '#f8d063',
      marginLeft: '14px !important',
      marginTop: '3px !important',
    },
    frequencyCappingSection: {
      marginBottom: 10,
      marginTop: 20,
    },
    frequencyCappingTitle: {
      alignItems: 'center',
      display: 'flex',
    },
    lineBreakFlexRow: {
      flexBasis: '100%',
      height: 0,
    },
    tooltip: {
      height: 24,
      marginBottom: '-2px',
      marginLeft: 4,
      width: 24,
    },
  }))();

  const getAdSetBidHeadingTooltipText = () => {
    if (formikInfo.values.adSetBidType === AdSetBidType.FIXED_COST_PER_TELEPORT) {
      return GetTooltipText(biddingTooltip);
    }

    if (
      formikInfo.values.adSetBidType === AdSetBidType.COST_PER_MILLE ||
      formikInfo.values.adSetBidType === AdSetBidType.FIXED_COST_PER_MILLE
    ) {
      return GetTooltipText(bidTypeCPMTooltip);
    }

    if (formikInfo.values.adSetBidType === AdSetBidType.CPV15) {
      return GetTooltipText(bidTypeCPV15Tooltip);
    }

    if (formikInfo.values.adSetBidType === AdSetBidType.COST_PER_CLICK) {
      return GetTooltipText(bidTypeCPCTooltip);
    }

    return '';
  };

  const handleAdSetBidChange = (value: TODOFIXANY) => {
    formikInfo.setFieldValue(
      createCampaignWizardModel.formField.adSetBidValueUsd.name,
      value.floatValue,
    );
  };

  const handleAdSetFrequencyCapValueChange = (value: TODOFIXANY) => {
    formikInfo.setFieldValue(
      createCampaignWizardModel.formField.adSetFrequencyCapValue.name,
      value.floatValue,
    );
  };

  const getAdSetFrequencyCapLabelText = () => {
    if (formikInfo.values.adSetBidType === AdSetBidType.FIXED_COST_PER_TELEPORT) {
      return 'Teleports Per Day/Unique User';
    }

    if (formikInfo.values.adSetBidType === AdSetBidType.COST_PER_MILLE) {
      // Should not be reachable yet. Not going to allow users in Q4 to use this.
      return 'Impressions Per Day/Unique User';
    }

    if (formikInfo.values.adSetBidType === AdSetBidType.FIXED_COST_PER_MILLE) {
      return 'Impressions Per Day/Unique User';
    }

    return '';
  };

  const getAuctionTypeName = (value: AdSetAuctionType) => {
    if (value === AdSetAuctionType.AUCTION_TYPE_FIRST_PRICE) {
      return 'Normal Bid';
    }
    if (value === AdSetAuctionType.AUCTION_TYPE_FIRST_PRICE_PRIORITY) {
      return 'Priority Bid';
    }
    return '';
  };

  const getInternalAccountFirstAuctionTypeChoice = () => {
    return AdSetAuctionType.AUCTION_TYPE_FIRST_PRICE;
  };

  const getInternalAccountSecondAuctionTypeChoice = () => {
    return AdSetAuctionType.AUCTION_TYPE_FIRST_PRICE_PRIORITY;
  };

  const shouldShowFreqCapUI = () => {
    const isCpmVideo =
      (formikInfo.values.adSetBidType === AdSetBidType.COST_PER_MILLE ||
        formikInfo.values.adSetBidType === AdSetBidType.FIXED_COST_PER_MILLE) &&
      formikInfo.values.adType === AdFormatType.VIDEO;
    const isValidAdType =
      formikInfo.values.adType === AdFormatType.PORTAL ||
      formikInfo.values.adType === AdFormatType.DISPLAY ||
      isCpmVideo;
    return (isAdAccountManaged || isAdAccountInternal) && isValidAdType;
  };

  const showBillableViewDuration = formikInfo.values.adSetBidType === AdSetBidType.CPV15;

  return (
    <>
      <div className={biddingSection}>
        <h4>
          <div className={biddingTitle}>
            <Typography variant='h4'>Bidding</Typography>
            <InfoTooltip classesToAdd={{ root: tooltip }} text={getAdSetBidHeadingTooltipText()} />
          </div>
          {creatingNewCampaign && (
            <CampaignWizardBanner
              textAfterLink=' — now with fractional bidding, most advertisers see lower Cost Per Play (CPP), even below the classic minimum bid.'
              textBeforeLink='Try the new '
            />
          )}
          <div className={biddingSubtitle}>
            <Typography variant='smallLabel2'>
              The minimum bid price depends on your selected target audience and Ad Format.
            </Typography>
          </div>
        </h4>

        {showBillableViewDuration && (
          <Select
            classes={{
              root: billableDurationContainer,
            }}
            disabled={disableBillableViewDurationInput}
            error={false}
            helperText='Charges apply when your audiences view a full-screen, unmuted video ad for 15 seconds. A reward may be used as incentive to watch the ad.'
            label={createCampaignWizardModel.formField.billableViewDuration.label}
            name={createCampaignWizardModel.formField.billableViewDuration.name}
            onBlur={formikInfo.handleBlur}
            onChange={noop}
            value={formikInfo.values.billableViewDuration}>
            <MenuItem value={BillableViewDurationType.FIFTEEN_SECONDS}>
              <div>
                <div>
                  <Typography variant='body1'>15-second full-screen, audio unmuted</Typography>
                </div>
              </div>
            </MenuItem>
          </Select>
        )}

        {isAdAccountInternal && (
          <RadioGroup
            classes={{ root: biddingRowFlexGroup }}
            data-testid='auction-type-checkbox'
            defaultValue={
              formikInfo.values[createCampaignWizardModel.formField.adSetAuctionType.name]
            }
            name={createCampaignWizardModel.formField.adSetAuctionType.name}
            onChange={formikInfo.handleChange}
            value={formikInfo.values[createCampaignWizardModel.formField.adSetAuctionType.name]}>
            <label
              className={auctionTypeRadioContainer}
              htmlFor={createCampaignWizardModel.formField.adSetAuctionType.name}>
              <Radio
                aria-label={getInternalAccountFirstAuctionTypeChoice()}
                classes={{ root: auctionTypeRadioInput }}
                color='primary'
                disabled={disableAuctionInput}
                id={getInternalAccountFirstAuctionTypeChoice()}
                size='medium'
                value={getInternalAccountFirstAuctionTypeChoice()}
              />
              <span>{getAuctionTypeName(getInternalAccountFirstAuctionTypeChoice())}</span>
            </label>
            <label
              className={auctionTypeRadioContainer}
              htmlFor={createCampaignWizardModel.formField.adSetAuctionType.name}>
              <Radio
                aria-label={getInternalAccountSecondAuctionTypeChoice()}
                classes={{ root: auctionTypeRadioInput }}
                color='primary'
                disabled={disableAuctionInput}
                id={getInternalAccountSecondAuctionTypeChoice()}
                size='medium'
                value={getInternalAccountSecondAuctionTypeChoice()}
              />
              <span>{getAuctionTypeName(getInternalAccountSecondAuctionTypeChoice())}</span>
            </label>
          </RadioGroup>
        )}

        <NumericFormat
          classes={{
            root: configureAdSetInput,
          }}
          color='primary'
          customInput={TextField}
          decimalScale={2}
          disabled={disableBidInput}
          error={Boolean(formikInfo.errors.adSetBidValueUsd)}
          fixedDecimalScale
          FormHelperTextProps={{ classes: { root: customHelperText } }}
          helperText={formikInfo.errors.adSetBidValueUsd}
          id={createCampaignWizardModel.formField.adSetBidValueUsd.name}
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                {getEndUserBidInfoDisplay(
                  formikInfo.values.adSetBidType,
                  formikInfo.values.campaignPaymentMethod,
                )}
              </InputAdornment>
            ),
          }}
          label={createCampaignWizardModel.formField.adSetBidValueUsd.label}
          margin='none'
          name={createCampaignWizardModel.formField.adSetBidValueUsd.name}
          onBlur={formikInfo.handleBlur}
          onValueChange={handleAdSetBidChange}
          thousandSeparator=','
          thousandsGroupStyle='thousand'
          value={formikInfo.values.adSetBidValueUsd}
        />
      </div>

      {shouldShowFreqCapUI() && (
        <div className={frequencyCappingSection}>
          <h4>
            <div className={frequencyCappingTitle}>
              <Typography variant='h4'>Frequency Cap</Typography>
              <InfoTooltip
                classesToAdd={{ root: tooltip }}
                text={GetTooltipText(adSetFrequencyCapTooltip)}
              />
            </div>
          </h4>

          <Switch
            aria-label='Toggle Frequency Cap'
            checked={formikInfo.values.adSetFrequencyCapOn}
            data-testid='freq-cap-checkbox'
            disabled={disableFrequencyInput}
            name={createCampaignWizardModel.formField.adSetFrequencyCapOn.name}
            onChange={formikInfo.handleChange}
          />
          <span>Set User Frequency Cap</span>

          {formikInfo.values.adSetFrequencyCapOn && (
            <NumericFormat
              allowNegative={false}
              classes={{
                root: configureAdSetInput,
              }}
              color='primary'
              customInput={TextField}
              decimalScale={0}
              disabled={disableFrequencyInput}
              error={
                formikInfo.touched.adSetFrequencyCapValue &&
                Boolean(formikInfo.errors.adSetFrequencyCapValue)
              }
              fixedDecimalScale
              helperText={
                (formikInfo.touched.adSetFrequencyCapValue &&
                  formikInfo.errors.adSetFrequencyCapValue) ||
                'This cannot be updated later.'
              }
              id={createCampaignWizardModel.formField.adSetFrequencyCapValue.name}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>{getAdSetFrequencyCapLabelText()}</InputAdornment>
                ),
              }}
              label=''
              margin='none'
              name={createCampaignWizardModel.formField.adSetFrequencyCapValue.name}
              onBlur={formikInfo.handleBlur}
              onValueChange={handleAdSetFrequencyCapValueChange}
              thousandSeparator=','
              thousandsGroupStyle='thousand'
              value={formikInfo.values.adSetFrequencyCapValue}
            />
          )}
        </div>
      )}
    </>
  );
};

export const AdSetNameFormGroup = ({
  disableInputs,
  formikInfo,
  onInputKeyPress,
}: {
  disableInputs: boolean;
  formikInfo: TODOFIXANY;
  onInputKeyPress: TODOFIXANY;
}) => {
  const {
    classes: { adSetNameHeader, configureAdSetInput },
  } = makeStyles()(() => ({
    adSetNameHeader: {
      marginBottom: 16,
      marginTop: 30,
    },
    configureAdSetInput: {
      width: '100%',
    },
  }))();
  return (
    <div>
      <div className={adSetNameHeader}>
        <Typography variant='h4'>Ad Set Name</Typography>
      </div>

      <InputWrapperWithRightAlignedHelperText
        helperTextValue={`${formikInfo.values.adSetName.length} / 128`}
        topOffset='55px'>
        <TextField
          classes={{
            root: configureAdSetInput,
          }}
          data-testid='ad-set-name'
          disabled={disableInputs}
          error={formikInfo.touched.adSetName && Boolean(formikInfo.errors.adSetName)}
          helperText={formikInfo.touched.adSetName && formikInfo.errors.adSetName}
          id={createCampaignWizardModel.formField.adSetName.name}
          label={createCampaignWizardModel.formField.adSetName.label}
          margin='none'
          name={createCampaignWizardModel.formField.adSetName.name}
          onBlur={formikInfo.handleBlur}
          onChange={formikInfo.handleChange}
          onKeyPress={onInputKeyPress}
          value={formikInfo.values.adSetName}
        />
      </InputWrapperWithRightAlignedHelperText>
    </div>
  );
};

interface CreateAdSetConfigurationFormProps {
  campaignToPopulate?: string;
  disableInputs: boolean;
  formikInfo: TODOFIXANY;
  isAdAccountInternal: boolean;
  isAdAccountManaged: boolean;
  setEstimate?: TODOFIXANY;
}

export const CreateAdSetConfigurationForm = ({
  campaignToPopulate,
  disableInputs = false,
  formikInfo,
  isAdAccountInternal,
  isAdAccountManaged,
  setEstimate = noop,
}: CreateAdSetConfigurationFormProps) => {
  const { setModalConfigData, setModalOpen } = useModalStore();
  const [pageLoading, setPageLoading] = useState(true);
  const [adSetNameEdited, setAdSetNameEdited] = useState(false);

  // Blocked ad formats based on engine type. Revisits after Kevel is deprecated.
  const [blockedAdFormats] = useState<AdFormatType[]>([]);
  const {
    coreCountryOverrideCodeList,
    coreRegionCodeList,
    showAudienceEstimate,
    strategicRegionCodeList,
    videoMinBidMappingsMicroUsd,
  } = useAppStore((state: AppStoreType) => state.appData);

  const configurationValues = {
    coreCountryOverrideCodeList,
    coreRegionCodeList,
    strategicRegionCodeList,
    videoMinBidMappingsMicroUsd,
  };

  const { universesCanAccess = [] } = useContext(CreateCampaignMetadataContext);

  const includesU18 = () => {
    // Default to true if no age buckets are selected
    if (!formikInfo.values.adSetAgeBucketTargeting?.ageBuckets) {
      return true;
    }
    return formikInfo.values.adSetAgeBucketTargeting?.ageBuckets?.includes(
      AgeBucketType.AGE_BUCKET_TYPE_13_TO_17,
    );
  };

  const [u18UserIsTarget, setU18UserIsTarget] = useState(includesU18());

  useEffect(() => {
    setU18UserIsTarget(includesU18());
  }, [formikInfo.values.adSetAgeBucketTargeting.ageBuckets]);

  useEffect(() => {
    if (u18UserIsTarget) {
      if (formikInfo.values.adSetGenderTargeting.gender !== Gender.GENDER_ANY) {
        formikInfo.setFieldValue(createCampaignWizardModel.formField.adSetGenderTargeting.name, {
          gender: Gender.GENDER_ANY,
        });
      }
    }
  }, [u18UserIsTarget, formikInfo.values.adType]);

  const { isAge5To12TargetingEnabled } = useAppStore(
    (state: AppStoreType) => state.appMetadataState.data,
  );

  const isU13TargetingApplicableForCurrentAdType = isU13TargetingApplicableForFormat(
    formikInfo.values.adType,
    isAge5To12TargetingEnabled,
  );
  const restrictAgeTargetingForCurrentAdType =
    formikInfo.values.adSetRestrictedMaturity &&
    isRestrictedExperienceTargetingAdFormat(formikInfo.values.adType);

  const isU13TargetingApplicable = () => isU13TargetingApplicableForCurrentAdType;

  const includesU13 = () => {
    if (!isU13TargetingApplicable()) return false;
    if (!formikInfo.values.adSetAgeBucketTargeting?.ageBuckets) return false;
    return formikInfo.values.adSetAgeBucketTargeting?.ageBuckets?.includes(
      AgeBucketType.AGE_BUCKET_TYPE_5_TO_12,
    );
  };

  const [u13UserIsTarget, setU13UserIsTarget] = useState(includesU13());

  useEffect(() => {
    setU13UserIsTarget(includesU13());
    // adType is implicit in isU13TargetingApplicableForCurrentAdType (derived from it).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formikInfo.values.adSetAgeBucketTargeting.ageBuckets,
    isU13TargetingApplicableForCurrentAdType,
  ]);

  useEffect(() => {
    if (u13UserIsTarget) {
      if (formikInfo.values.adSetGenderTargeting.gender !== Gender.GENDER_ANY) {
        formikInfo.setFieldValue(createCampaignWizardModel.formField.adSetGenderTargeting.name, {
          gender: Gender.GENDER_ANY,
        });
      }
    }
  }, [u13UserIsTarget]);

  useEffect(() => {
    if (u13UserIsTarget) {
      const deviceTypeFromDeviceFormOptions = (deviceObj: FormInputObj) => deviceObj.value;
      const allDeviceValuesForReset = devices.map(deviceTypeFromDeviceFormOptions);
      if (!formikInfo.values.adSetDeviceTargeting.devices?.includes(DeviceType.DEVICE_TYPE_ALL)) {
        formikInfo.setFieldValue(createCampaignWizardModel.formField.adSetDeviceTargeting.name, {
          devices: allDeviceValuesForReset,
        });
      }
    }
  }, [u13UserIsTarget]);

  // Sync the 5-12 age bucket out of form values when the user or placement is not eligible.
  useEffect(() => {
    const currentBuckets: AgeBucketType[] =
      formikInfo.values.adSetAgeBucketTargeting?.ageBuckets || [];
    const has5to12 = currentBuckets.includes(AgeBucketType.AGE_BUCKET_TYPE_5_TO_12);
    if (
      (!isU13TargetingApplicableForCurrentAdType || restrictAgeTargetingForCurrentAdType) &&
      has5to12
    ) {
      const newAgeBuckets = currentBuckets.filter(
        (bucket) => bucket !== AgeBucketType.AGE_BUCKET_TYPE_5_TO_12,
      );
      formikInfo.setFieldValue(createCampaignWizardModel.formField.adSetAgeBucketTargeting.name, {
        ageBuckets: newAgeBuckets,
      });
      setNewAdsetName({
        adSetNameEdited,
        formikInfo,
        isU13Applicable: isU13TargetingApplicableForCurrentAdType,
        newAgeBuckets: {
          ageBuckets: newAgeBuckets,
        },
      });
    }
    // Only re-run when the eligibility flips or the buckets change to include 5-12 while
    // ineligible. adSetNameEdited is read as a snapshot for the rename and shouldn't retrigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formikInfo.values.adSetAgeBucketTargeting?.ageBuckets,
    formikInfo.values.adType,
    formikInfo.values.adSetRestrictedMaturity,
    isU13TargetingApplicableForCurrentAdType,
    restrictAgeTargetingForCurrentAdType,
  ]);

  const getDefaultAdType = (campaignObjective: string): AdFormatType => {
    if (campaignObjective === CampaignObjectiveType.AWARENESS) {
      return AdFormatType.DISPLAY;
    }

    // For Visit Campaign Objective Portal is the only available ad format in the Classic Ads Manager
    return AdFormatType.PORTAL;
  };

  const fetchCampaignsCurrentUserHasAccessToAndPopulateFormState = useCallback(async () => {
    const campaignFetchedInfo = (await getCampaignV2(campaignToPopulate || '')) || {};
    const campaignInfo = campaignFetchedInfo.campaign;

    if (campaignInfo) {
      if (campaignInfo.end_timestamp_ms > 0 && campaignInfo.end_timestamp_ms < Date.now()) {
        setModalConfigData({
          dialogContent: 'You cannot add an ad set to a completed campaign',
          handleClose: (_: TODOFIXANY, reason: string) => {
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
              return;
            }
            setModalOpen(false);
          },
          title: 'Error',
        });
        setModalOpen(true);
        return;
      }

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignId.name,
        campaignInfo!.id,
      );

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignName.name,
        campaignInfo!.name,
      );

      const campaignObjective = ServerToClient.getFromServerCampaignObjective(campaignInfo);

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignObjective.name,
        campaignObjective,
      );

      const defaultAdType = getDefaultAdType(campaignObjective);
      formikInfo.setFieldValue(createCampaignWizardModel.formField.adType.name, defaultAdType);

      const paymentType = convertPaymentTypeServerToClient(campaignInfo?.payment_type);
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignPaymentMethod.name,
        paymentType,
      );

      // @ts-ignore
      const newAdSetBidType = getAdSetBidTypeFromCampaignTypeAndPaidAccessSelection(
        campaignObjective,
        formikInfo.values.adSetPaidAccess,
      );
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.adSetBidType.name,
        newAdSetBidType,
      );

      // Only set the new default if this isn't already set by the ad set loaded on the add ad to ad set flow
      if (!formikInfo.values[createCampaignWizardModel.formField.adSetBidValueUsd.name]) {
        // @ts-ignore

        const regionCodes = (
          convertAdSetMixedRegionAndCountryTargetingIntoRegions(
            formikInfo?.values?.adSetMixedRegionAndCountryTargeting || [],
          ) || []
        ).map((r: TODOFIXANY) => r.value);
        const countries = formikInfo?.values?.adSetMixedRegionAndCountryTargeting?.countries || [];

        const defaultBidValue = getDefaultBidValue(
          newAdSetBidType,
          formikInfo.adSetAuctionType,
          defaultAdType,
          regionCodes,
          countries,
          coreRegionCodeList,
          strategicRegionCodeList,
          coreCountryOverrideCodeList,
          { videoMinBidMappingsMicroUsd },
        );
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.adSetBidValueUsd.name,
          defaultBidValue,
        );
        setTimeout(() => formikInfo.validateForm(), 0);
      }

      const { budgetType, budgetUsd } =
        ServerToClient.getFromServerCampaignBudgetInfo(campaignInfo);

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignBudgetType.name,
        budgetType,
      );

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignBudgetCapUsd.name,
        budgetUsd,
      );

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignStartDate.name,
        campaignInfo!.start_timestamp_ms,
      );

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignEndDate.name,
        campaignInfo!.end_timestamp_ms,
      );

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignStartTime.name,
        campaignInfo!.start_timestamp_ms,
      );

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignEndTime.name,
        campaignInfo!.end_timestamp_ms,
      );

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignStartTimestampMs.name,
        campaignInfo!.start_timestamp_ms,
      );

      if (campaignInfo!.end_timestamp_ms) {
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.campaignEndTimestampMs.name,
          campaignInfo!.end_timestamp_ms,
        );

        formikInfo.setFieldValue(createCampaignWizardModel.formField.campaignHasEndDate.name, true);
      } else {
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.campaignHasEndDate.name,
          false,
        );
      }

      if (campaignObjective === CampaignObjectiveType.VISITS) {
        const { universe_id } = campaignInfo;
        if (universe_id) {
          const foundDestination: UniverseShapeType = universesCanAccess.find(
            (destination) => destination.universe_id === universe_id,
          );
          if (foundDestination) {
            handlePortalDestinationChange(
              convertServerUniverseToAutocompletOption(foundDestination),
              formikInfo,
              configurationValues,
            );
          }
        }
      }

      if (campaignObjective === CampaignObjectiveType.VIDEO_VIEWS) {
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.billableViewDuration.name,
          BillableViewDurationType.FIFTEEN_SECONDS,
        );

        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.adSetBidType.name,
          AdSetBidType.CPV15,
        );

        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.adType.name,
          AdFormatType.VIDEO,
        );
      }
    }
  }, [campaignToPopulate]);

  const updateEstimate = async () => {
    if (!showAudienceEstimate) {
      return;
    }
    let errored: boolean;
    const estimateInfo = ClientToServer.convertFormikDataToAudienceEstimateInfo(formikInfo.values);

    const formErrors = await formikInfo.validateForm();
    if (!isEmpty(formErrors)) {
      setEstimate({
        estimateLowerBound: 0,
        estimateNum: 0,
        estimateStatus: AudienceEstimateEnum.Audience_Estimate_Undefined,
        estimateUpperBound: 0,
        showAudienceGenreDisclaimer: false,
      });
      return;
    }

    getAudienceEstimate(estimateInfo)
      .then((resp) => {
        errored = !resp.ok;
        return resp.json();
      })
      .then((resp_json) => {
        if (errored) {
          throw new Error(
            'Invalid Audience Estimate Request: '.concat(resp_json['error']['message']),
          );
        } else if (
          resp_json['estimate_audience_lower_bound'] &&
          resp_json['estimate_audience_upper_bound']
        ) {
          setEstimate({
            estimateLowerBound: resp_json['estimate_audience_lower_bound'],
            estimateStatus: AudienceEstimateEnum.Audience_Estimate_Present,
            estimateUpperBound: resp_json['estimate_audience_upper_bound'],
            showAudienceGenreDisclaimer: false,
          });
        } else if (resp_json['estimate_audience_num']) {
          setEstimate({
            estimateNum: resp_json['estimate_audience_num'],
            estimateStatus: AudienceEstimateEnum.Audience_Estimate_Present,
          });
        } else {
          throw new Error(
            "Invalid Audience Estimate Response: field 'estimate_audience_lower_bound' or 'estimate_audience_upper_bound' missing",
          );
        }
      })
      .catch((e) => {
        setEstimate({
          estimateLowerBound: 0,
          estimateNum: 0,
          estimateStatus: AudienceEstimateEnum.Audience_Estimate_Error,
          estimateUpperBound: 0,
          showAudienceGenreDisclaimer: false,
        });
        CaptureException(e);
      });
  };

  const updateEstimateRef = useRef(updateEstimate);

  const debouncedUpdateEstimate = useMemo(() => {
    const func = () => {
      updateEstimateRef.current?.();
    };
    return debounce(func, 1000);
  }, []);

  useEffect(() => {
    updateEstimateRef.current = updateEstimate;
    setEstimate({
      estimateLowerBound: 0,
      estimateNum: 0,
      estimateStatus: AudienceEstimateEnum.Audience_Estimate_Loading,
      estimateUpperBound: 0,
    });
    debouncedUpdateEstimate();
  }, [
    formikInfo.values.adSetAgeTargeting,
    formikInfo.values.adSetAgeBucketTargeting,
    formikInfo.values.adSetDeviceTargeting,
    formikInfo.values.adSetGenderTargeting,
    formikInfo.values.adSetLanguageTargeting,
    formikInfo.values.adSetMixedRegionAndCountryTargeting,
    formikInfo.values.adType,
    formikInfo.values.adSetBrandSuitabilityType,
    formikInfo.values.adSetGenreTargeting,
  ]);

  useEffect(() => {
    if (campaignToPopulate) {
      fetchCampaignsCurrentUserHasAccessToAndPopulateFormState()
        // TODO: Show an error modal if any of these calls fail
        .catch(CaptureException)
        .finally(() => {
          setPageLoading(false);
        });
    } else {
      setPageLoading(false);
    }
  }, [fetchCampaignsCurrentUserHasAccessToAndPopulateFormState]);
  const {
    classes: { campaignNameInput, campaignToPopulateDropdown, column, loadingContainer },
  } = makeStyles()(() => ({
    campaignNameInput: {
      marginBottom: 16,
      width: '100%',
    },
    campaignToPopulateDropdown: {
      paddingTop: 24,
    },
    column: {
      display: 'flex',
      flex: '1',
      flexBasis: '100%',
      flexDirection: 'column',
    },
    loadingContainer: {
      alignItems: 'center',
      display: 'flex',
      height: '30rem',
      justifyContent: 'center',
      width: '100%',
    },
  }))();

  return (
    <>
      {pageLoading && (
        <div className={loadingContainer}>
          <CustomCircularProgress />
        </div>
      )}

      {!pageLoading && (
        <>
          {Boolean(campaignToPopulate) && (
            <div className={campaignToPopulateDropdown}>
              <Select
                classes={{ root: campaignNameInput }}
                disabled
                label='Selected Campaign'
                value={formikInfo.values.campaignName}>
                <MenuItem value={formikInfo.values.campaignName}>
                  {formikInfo.values.campaignName}
                </MenuItem>
              </Select>
            </div>
          )}

          <FormikProvider value={formikInfo}>
            <AdSetAdPlacementGroup
              adSetNameEdited={adSetNameEdited}
              blockedAdFormats={blockedAdFormats}
              disableInputs={disableInputs}
              formikInfo={formikInfo}
            />

            <div>
              <div className={column}>
                <AdSetAudienceTargetingFormGroup
                  adSetNameEdited={adSetNameEdited}
                  creatingNewCampaign={!campaignToPopulate}
                  disableInputs={disableInputs}
                  formikInfo={formikInfo}
                  isU13TargetingApplicable={isU13TargetingApplicable}
                  u13UserIsTarget={u13UserIsTarget}
                  u18UserIsTarget={u18UserIsTarget}
                />
              </div>
            </div>

            {formikInfo.values.adType !== AdFormatType.TILE && (
              <AdSetBrandSuitabilityGroup disableInputs={disableInputs} formikInfo={formikInfo} />
            )}

            <AdSetGenreTargetingFormGroup disableInputs={disableInputs} formikInfo={formikInfo} />

            <AdSetBiddingFormGroup
              creatingNewCampaign={!campaignToPopulate}
              disableAuctionInput={disableInputs}
              disableBidInput={disableInputs}
              disableBillableViewDurationInput
              disableFrequencyInput={disableInputs}
              formikInfo={formikInfo}
              isAdAccountInternal={isAdAccountInternal}
              isAdAccountManaged={isAdAccountManaged}
            />

            <AdSetNameFormGroup
              disableInputs={disableInputs}
              formikInfo={formikInfo}
              onInputKeyPress={() => {
                setAdSetNameEdited(true);
                formikInfo.setFieldTouched(
                  createCampaignWizardModel.formField.adSetName.name,
                  true,
                  true,
                );
              }}
            />
          </FormikProvider>
        </>
      )}
    </>
  );
};
