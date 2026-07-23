import { noop } from 'lodash';
import { createContext, ReactNode, useState } from 'react';

import { CampaignObjectiveType } from '@constants/campaignBuilder';
import { getCreateCampaignWizardInitialValues } from '@modules/creation/wizard/models/createCampaignWizard/createCampaignWizardModel';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { AdFormatType } from '@type/ad';
import { AdSetBidType } from '@type/adSet';
import { TODOFIXANY } from 'app/shared/types';

import {
  AgeCriteria,
  BudgetType,
  DeviceCriteria,
  DisplayAdMetadataBase,
  GenderCriteria,
  LanguageCriteria,
  PortalAdMetadataBase,
} from '../../clients/ads/adsClientTypes';

interface CreateCampaignMetadataStateType {
  activeStep: number;
  adAccountPrepaidBalance: number;
  adMetaData?: PortalAdMetadataBase | DisplayAdMetadataBase;
  adName: string;
  adSetAuctionType: number;
  adSetBidType: AdSetBidType;
  adSetBidValueUsd: number;
  adSetName: string;
  adSetTargetingRelationsAge: AgeCriteria;
  adSetTargetingRelationsDevice: DeviceCriteria;
  adSetTargetingRelationsGender: GenderCriteria;
  adSetTargetingRelationsLanguage: LanguageCriteria;
  adType: AdFormatType;
  campaignBudgetCapUsd: number;
  campaignBudgetType: BudgetType;
  campaignEndTimestampMs?: number;
  campaignName: string;
  campaignObjective: CampaignObjectiveType;
  campaignStartTimestampMs: number;
  destinationInfoToPreselect: TODOFIXANY;
  formErrors: { [key: string]: string };
  isCreditCardPrechargeForAccountRequired: boolean;
  isSubmitting: boolean;
  setActiveStep: TODOFIXANY | ((prevActiveStep: number) => number);
  setAdAccountPrepaidBalance: TODOFIXANY;
  setAdMetaData: TODOFIXANY;
  setAdName: TODOFIXANY;
  setAdSetAuctionType: TODOFIXANY;
  setAdSetBidType: TODOFIXANY;
  setAdSetBidValueUsd: TODOFIXANY;
  setAdSetName: TODOFIXANY;
  setadSetTargetingRelationsAge: TODOFIXANY;
  setadSetTargetingRelationsDevice: TODOFIXANY;
  setadSetTargetingRelationsGender: TODOFIXANY;
  setadSetTargetingRelationsLanguage: TODOFIXANY;
  setadSetTargetingRelationsLocation: TODOFIXANY;
  setAdType: TODOFIXANY;
  setCampaignBudgetCapUsd: TODOFIXANY;
  setCampaignBudgetType: TODOFIXANY;
  setCampaignEndTimestampMs: TODOFIXANY;
  setCampaignName: TODOFIXANY;
  setCampaignObjective: TODOFIXANY;
  setCampaignStartTimestampMs: TODOFIXANY;
  setDestinationInfoToPreselect: TODOFIXANY;
  setFormErrors: TODOFIXANY;
  setIsCreditCardPrechargeForAccountRequired: TODOFIXANY;
  setIsSubmitting: TODOFIXANY;
  setUniversesCanAccess: TODOFIXANY;
  setUploadedImage: TODOFIXANY;
  setUploadedVideo: TODOFIXANY;
  setVideoDuration: TODOFIXANY;
  steps: string[];
  universesCanAccess: TODOFIXANY[];
  uploadedImage: TODOFIXANY;
  uploadedVideo: TODOFIXANY;
  videoDuration: TODOFIXANY;
}

const DEFAULT_CREATE_CAMPAIGN_CONTEXT: Partial<CreateCampaignMetadataStateType> = {
  activeStep: 0,
  setActiveStep: () => 0,
  setUploadedImage: noop,
  setUploadedVideo: noop,
  setVideoDuration: noop,
  steps: ['Campaign', 'Ad Set', 'Ad'],
  universesCanAccess: [],
  uploadedImage: undefined,
  uploadedVideo: undefined,
  videoDuration: 0,
};

export const CreateCampaignMetadataContext = createContext(DEFAULT_CREATE_CAMPAIGN_CONTEXT);

interface CreateCampaignMetadataContextProviderProps {
  children?: ReactNode;
}

export const CreateCampaignMetadataContextProvider = ({
  children,
}: CreateCampaignMetadataContextProviderProps) => {
  const { adCreditActivated, campaignMinimumDailyBudgetUsd, organizationInfo, paymentProfiles } =
    useAppStore((state: AppStoreType) => state.appData);
  const { adAccountIsExternalManaged, adAccountIsInternalManaged } = useAppStore(
    (state: AppStoreType) => state,
  );

  // High Level Form Data
  const [activeStep, setActiveStep] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Campaign Data
  const createCampaignWizardInitialValues = getCreateCampaignWizardInitialValues(
    adAccountIsInternalManaged(),
    adAccountIsExternalManaged(),
    campaignMinimumDailyBudgetUsd!,
    paymentProfiles && paymentProfiles.length > 0,
    adCreditActivated,
    organizationInfo,
  );
  const [campaignName, setCampaignName] = useState(createCampaignWizardInitialValues.campaignName!);
  const [campaignObjective, setCampaignObjective] = useState(
    createCampaignWizardInitialValues.campaignObjective!,
  );
  const [campaignBudgetType, setCampaignBudgetType] = useState(
    createCampaignWizardInitialValues.campaignBudgetType!,
  );
  const [campaignBudgetCapUsd, setCampaignBudgetCapUsd] = useState(
    createCampaignWizardInitialValues.campaignBudgetCapUsd!,
  );
  const [campaignStartTimestampMs, setCampaignStartTimestampMs] = useState(
    createCampaignWizardInitialValues.campaignStartTimestampMs!,
  );
  const [campaignEndTimestampMs, setCampaignEndTimestampMs] = useState(
    createCampaignWizardInitialValues.campaignEndTimestampMs!,
  );

  // Ad Set Data
  const [adSetName, setAdSetName] = useState(createCampaignWizardInitialValues.adSetName!);
  const [adSetBidType, setAdSetBidType] = useState(createCampaignWizardInitialValues.adSetBidType!);
  const [adSetAuctionType, setAdSetAuctionType] = useState(
    createCampaignWizardInitialValues.adSetAuctionType!,
  );
  const [adSetBidValueUsd, setAdSetBidValueUsd] = useState(
    createCampaignWizardInitialValues.adSetBidValueUsd!,
  );
  const [adSetTargetingRelationsLanguage, setadSetTargetingRelationsLanguage] = useState(
    createCampaignWizardInitialValues.adSetLanguageTargeting!,
  );
  const [adSetTargetingRelationsGender, setadSetTargetingRelationsGender] = useState(
    createCampaignWizardInitialValues.adSetGenderTargeting!,
  );
  const [adSetTargetingRelationsAge, setadSetTargetingRelationsAge] = useState(
    createCampaignWizardInitialValues.adSetAgeTargeting!,
  );
  const [adSetTargetingRelationsDevice, setadSetTargetingRelationsDevice] = useState(
    createCampaignWizardInitialValues.adSetDeviceTargeting!,
  );

  // Ad Data
  const [adName, setAdName] = useState(createCampaignWizardInitialValues.adName!);
  const [adType, setAdType] = useState(createCampaignWizardInitialValues.adType!);
  const [adMetaData, setAdMetaData] = useState();
  const [universesCanAccess, setUniversesCanAccess] = useState([]);
  const [uploadedImage, setUploadedImage] = useState();
  const [uploadedVideo, setUploadedVideo] = useState();
  const [videoDuration, setVideoDuration] = useState(0);

  // Precharge

  const [isCreditCardPrechargeForAccountRequired, setIsCreditCardPrechargeForAccountRequired] =
    useState(false);
  const [adAccountPrepaidBalance, setAdAccountPrepaidBalance] = useState(0);
  const [destinationInfoToPreselect, setDestinationInfoToPreselect] = useState<
    TODOFIXANY | undefined
  >();

  // Context Data for Components
  // const createCampaignMetadataState: CreateCampaignMetadataStateType = {
  const createCampaignMetadataState: TODOFIXANY = {
    ...DEFAULT_CREATE_CAMPAIGN_CONTEXT,
    activeStep,
    adAccountPrepaidBalance,
    adMetaData,
    adName,
    adSetAuctionType,
    adSetBidType,
    adSetBidValueUsd,
    adSetName,
    adSetTargetingRelationsAge,
    adSetTargetingRelationsDevice,
    adSetTargetingRelationsGender,
    adSetTargetingRelationsLanguage,
    adType,
    campaignBudgetCapUsd,
    campaignBudgetType,
    campaignEndTimestampMs,
    campaignName,
    campaignObjective,
    campaignStartTimestampMs,
    destinationInfoToPreselect,
    formErrors,
    isCreditCardPrechargeForAccountRequired,
    isSubmitting,
    setActiveStep,
    setAdAccountPrepaidBalance,
    setAdMetaData,
    setAdName,
    setAdSetAuctionType,
    setAdSetBidType,
    setAdSetBidValueUsd,
    setAdSetName,
    setadSetTargetingRelationsAge,
    setadSetTargetingRelationsDevice,
    setadSetTargetingRelationsGender,
    setadSetTargetingRelationsLanguage,
    setAdType,
    setCampaignBudgetCapUsd,
    setCampaignBudgetType,
    setCampaignEndTimestampMs,
    setCampaignName,
    setCampaignObjective,
    setCampaignStartTimestampMs,
    setDestinationInfoToPreselect,
    setFormErrors,
    setIsCreditCardPrechargeForAccountRequired,
    setIsSubmitting,
    setUniversesCanAccess,
    setUploadedImage,
    setUploadedVideo,
    setVideoDuration,
    universesCanAccess,
    uploadedImage,
    uploadedVideo,
    videoDuration,
  };

  return (
    <CreateCampaignMetadataContext.Provider value={createCampaignMetadataState}>
      {children}
    </CreateCampaignMetadataContext.Provider>
  );
};
