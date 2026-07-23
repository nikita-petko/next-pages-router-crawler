import {
  Alert,
  Checkbox,
  FormControlLabel,
  InfoOutlinedIcon,
  InputAdornment,
  makeStyles,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@rbx/ui';
import { useField, useFormikContext } from 'formik';
import moment from 'moment-timezone';
import { useRouter } from 'next/router';
import {
  ChangeEvent,
  FocusEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { NumericFormat } from 'react-number-format';

import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import CustomCircularProgress from '@components/common/CustomCircularProgress';
import PaymentMethodIcon from '@components/common/PaymentMethodIcon';
import { CampaignObjectiveType } from '@constants/campaignBuilder';
import Routes from '@constants/routes';
import {
  BillableViewDurationType,
  BudgetType,
  PaymentMethodType,
} from '@modules/clients/ads/adsClientTypes';
import { getGameThumbnailByPlaceId } from '@modules/clients/thumbnails/thumbnailsClient';
import { CampaignFormGroup } from '@modules/creation/components/campaignConfigurationComponents/campaignFormGroup';
import { KeyboardDatePickerCampaignConfiguration } from '@modules/creation/components/campaignConfigurationComponents/keyboardDatePickerCampaignConfiguration';
import {
  AutocompleteOption,
  convertServerUniverseToAutocompletOption,
  logDestinationChangeEvent,
  SelectUniverseAutocomplete,
} from '@modules/creation/components/createAdConfigurationForm/selectUniverseAutocomplete';
import { ConfigurationRadioGroup } from '@modules/creation/components/shareConfigurationComponents/configurationRadioGroup';
import { CreateCampaignMetadataContext } from '@modules/creation/contexts/createCampaignPageContext';
import {
  convertAdSetMixedRegionAndCountryTargetingIntoRegions,
  createCampaignWizardModel,
  getDefaultBidValue,
  getEndUserDisplayCurrency,
} from '@modules/creation/wizard/models/createCampaignWizard/createCampaignWizardModel';
import {
  formatDateToMMDDYYYY,
  getDurationInDays,
} from '@modules/miscellaneous/utils/dateUtilities';
import { GetTooltipText } from '@modules/miscellaneous/utils/tooltipStrings';
import { getValidateDisplayName } from '@services/ads/adAccountService';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useModalStore } from '@stores/modalStoreProvider';
import { AdFormatType } from '@type/ad';
import { AdSetBidType } from '@type/adSet';
import { MicroUsdToUsd, MicroUsdToUsdStringRoundedDown } from '@utils/currency';
import { GetTimezoneOffsetMs } from '@utils/date';
import { CaptureException } from '@utils/error';
import { GetTimezoneObjFromEnum } from '@utils/timezone';
import { TODOFIXANY } from 'app/shared/types';
import { detectSpecialCharacters, IsValidDate, removeTabsAndLeadingSpaces } from 'app/util/fns';

import { getAdFormatFromCampaignType } from './createAdConfigurationForm/createAdConfigurationForm';
import {
  getAdSetBidTypeFromCampaignTypeAndPaidAccessSelection,
  handleAdSetPaidAccessChange,
  handleAdSetRestrictedMaturityChange,
  UniverseToggleConfigurationValuesType,
} from './createAdSetConfigurationForm';
import { InputWrapperWithRightAlignedHelperText } from './inputWrapperWithRightAlignedHelperText';

const budgetTooltip = 'CreateCampaignForm.Budget';
const scheduleTooltip = 'CreateCampaignForm.Schedule';
const advertiserNameTooltip = 'CreateCampaignForm.AdvertiserName';

export const getTimeDiffMs = (date: Date) => {
  return date.getTime() - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

const getEndDateHelperText = (
  campaignBudgetType: BudgetType,
  campaignPaymentMethod: PaymentMethodType,
  isEditDisabled: boolean,
  campaignIsEnded: boolean,
): string => {
  if (campaignIsEnded) {
    return 'Cannot change after campaign already ended';
  }

  if (isEditDisabled) {
    return 'Cannot be edited';
  }

  if (
    campaignBudgetType === BudgetType.DAILY &&
    campaignPaymentMethod !== PaymentMethodType.AD_CREDIT
  ) {
    return 'Optional';
  }

  return 'Minimum 2 calendar dates are required.';
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

export const CampaignObjectiveFormGroup = ({
  disableInputs,
  formikInfo,
  helperText,
  onInputChange,
}: {
  disableInputs: boolean;
  formikInfo: TODOFIXANY;
  helperText: string;
  onInputChange: TODOFIXANY;
}) => {
  const { universesCanAccess = [] } = useContext(CreateCampaignMetadataContext);

  const {
    coreCountryOverrideCodeList,
    coreRegionCodeList,
    strategicRegionCodeList,
    videoMinBidMappingsMicroUsd,
  } = useAppStore((state: AppStoreType) => state.appData);

  const configurationValues = {
    coreCountryOverrideCodeList,
    coreRegionCodeList,
    strategicRegionCodeList,
    videoMinBidMappingsMicroUsd,
  };
  const [disablePortalObjectiveType, setDisablePortalObjectiveType] = useState(false);
  const {
    classes: { configureCampaignInput, customSelectDropdown },
  } = makeStyles()(() => ({
    '@global': {
      '#menu-campaignObjective .campaignObjectiveTitle': {
        fontWeight: 500,
      },
    },
    configureCampaignInput: {
      marginTop: 20,
      width: '100%',
    },
    customSelectDropdown: {
      '& .menuItemHelperText': {
        display: 'none',
      },
      '&[aria-expanded="true"] .menuItemHelperText': {
        display: 'block !important',
      },
    },
  }))();

  useEffect(() => {
    setDisablePortalObjectiveType(universesCanAccess.length === 0);

    const visitsObjectiveSelected =
      formikInfo.values.campaignObjective === CampaignObjectiveType.VISITS;
    if (
      universesCanAccess.length &&
      visitsObjectiveSelected &&
      !formikInfo.values[createCampaignWizardModel.formField.adPortalDestinationPlaceId.name] &&
      !disableInputs // In the edit modes this selection will be handled separately
    ) {
      handlePortalDestinationChange(
        convertServerUniverseToAutocompletOption(universesCanAccess[0]),
        formikInfo,
        configurationValues,
      );
    }
  }, [universesCanAccess, disablePortalObjectiveType]);

  return (
    <CampaignFormGroup headerText='Campaign Objective'>
      <Select
        classes={{
          root: `${configureCampaignInput} ${customSelectDropdown}`,
        }}
        data-testid='campaign-objective-dropdown'
        disabled={disableInputs}
        error={formikInfo.touched.campaignObjective && Boolean(formikInfo.errors.campaignObjective)}
        helperText={helperText}
        label={createCampaignWizardModel.formField.campaignObjective.label}
        name={createCampaignWizardModel.formField.campaignObjective.name}
        onBlur={formikInfo.handleBlur}
        onChange={onInputChange}
        value={formikInfo.values.campaignObjective}>
        <MenuItem value={CampaignObjectiveType.AWARENESS}>
          <div>
            <div>
              <Typography className='campaignObjectiveTitle' variant='body1'>
                Awareness
              </Typography>
            </div>
            <div className='menuItemHelperText'>
              <Typography variant='body2'>
                Show your image or video ads to people to increase awareness of your brand.
              </Typography>
            </div>
          </div>
        </MenuItem>
        <MenuItem disabled={disablePortalObjectiveType} value={CampaignObjectiveType.VISITS}>
          <div>
            <div>
              <Typography className='campaignObjectiveTitle' variant='body1'>
                Visits
              </Typography>
            </div>
            <div className='menuItemHelperText'>
              <Typography variant='body2'>
                Drive traffic to your Roblox experience. Available to accounts with eligible
                experiences.
              </Typography>
            </div>
          </div>
        </MenuItem>
      </Select>
    </CampaignFormGroup>
  );
};

export const CampaignBudgetAndScheduleFormGroup = ({
  adCreditBalance,
  creditCardPrechargeForAccountRequired = false,
  disableBudgetSelection = false,
  disableEndDateInput = false,
  disableInputs,
  disablePaymentMethodInput = false,
  disableStartDateInput = false,
  enableBudgetWarning = false,
  formikInfo,
  isAdAccountInternalOrManaged = false,
  isDefaultBillingTier,
  organizationInfo,
  paymentProfiles = null,
  shouldShowOneTimeCloningTreatment = false,
}: {
  adCreditBalance: number;
  creditCardPrechargeForAccountRequired: boolean | undefined;
  disableBudgetSelection: boolean;
  disableEndDateInput: boolean;
  disableInputs: boolean;
  disablePaymentMethodInput: boolean;
  disableStartDateInput: boolean;
  enableBudgetWarning: boolean;
  formikInfo: TODOFIXANY;
  isAdAccountInternalOrManaged: boolean;
  isDefaultBillingTier: boolean;
  organizationInfo: TODOFIXANY;
  paymentProfiles: TODOFIXANY;
  shouldShowOneTimeCloningTreatment?: boolean;
}) => {
  const [isEndDateChecked, setIsEndDateChecked] = useState(
    formikInfo.values[createCampaignWizardModel.formField.campaignHasEndDate.name],
  );

  const [showLowerBudgetWarning, setShowLowerBudgetWarning] = useState(false);
  const [originalBudget, _] = useState(formikInfo.values.campaignBudgetCapUsd);
  const { adCreditActivated } = useAppStore((state: AppStoreType) => state.appData);
  const dailySpendLimitMicroUsd = useAppStore(
    (state) => state.advertiserState.data?.ad_account?.daily_spend_limit_micro_usd || 0,
  );
  const dailySpendLimitUsd = MicroUsdToUsd(dailySpendLimitMicroUsd);

  const scheduleRef = useRef<HTMLDivElement>(null);
  const {
    classes: {
      alertText,
      budgetRadio,
      budgetRadioContainer,
      budgetTypeRadioGroup,
      cardNumberContainer,
      cardPaymentContainer,
      configureCampaignInput,
      configureCampaignInputDateInputsRow,
      configurePaymentMethodInput,
      dateTimePickerGroupSpace,
      dayWarning,
      endDateCheckBoxContainer,
      warningContainer,
    },
    cx,
  } = makeStyles()(() => ({
    '@global': {
      '.cardPaymentMenuItemNoWrap': {
        display: 'none',
      },
      '.cardPaymentMenuItemWrap': {
        display: 'block',
      },
      '#menu-campaignPaymentMethod .cardPaymentMenuItemNoWrap': {
        display: 'block !important',
      },
      '#menu-campaignPaymentMethod .cardPaymentMenuItemWrap': {
        display: 'none !important',
      },
      '#menu-campaignPaymentMethod .cardPaymentTitleRow': {
        fontWeight: 500,
      },
    },
    alertText: {
      fontSize: 16,
    },
    budgetRadio: {
      marginRight: 48,
    },
    budgetRadioContainer: {
      marginTop: 20,
    },
    budgetTypeRadioGroup: {
      flexDirection: 'row',
    },
    cardNumberContainer: {
      marginLeft: 8,
      marginRight: 16,
    },
    cardPaymentContainer: {
      alignItems: 'center',
      display: 'flex',
    },
    configureCampaignInput: {
      marginTop: 20,
      width: '100%',
    },
    configureCampaignInputDateInputsRow: {
      alignItems: 'flex-start',
      display: 'flex',
      gap: 4,
      marginBottom: 16,
      minHeight: 100,
    },
    configurePaymentMethodInput: {
      '& p:not(.Mui-error)': {
        color: '#f8d063',
      },
      marginTop: 20,
      width: '100%',
    },
    dateTimePickerGroupSpace: {
      marginRight: 16,
    },
    dayWarning: { alignItems: 'center', display: 'flex' },
    endDateCheckBoxContainer: {
      alignItems: 'center',
      display: 'flex',
      marginBottom: 15,
      minHeight: 56,
    },
    warningContainer: {
      marginLeft: 10,
      marginTop: 10,
    },
  }))();

  const handleCampaignPaymentMethodChange = (value: PaymentMethodType) => {
    formikInfo.setFieldValue(createCampaignWizardModel.formField.campaignPaymentMethod.name, value);

    // enforce user to set end date if payment type is ad credit
    if (value === PaymentMethodType.AD_CREDIT) {
      setIsEndDateChecked(true);
      formikInfo.setFieldValue(createCampaignWizardModel.formField.campaignHasEndDate.name, true);
    }

    // when user switch payment method we should validate budget
    formikInfo.setFieldTouched(
      createCampaignWizardModel.formField.campaignBudgetCapUsd.name,
      true,
      true,
    );

    setTimeout(
      () => formikInfo.validateField(createCampaignWizardModel.formField.campaignBudgetCapUsd.name),
      0,
    );
  };

  const { setModalConfigDataToErrorModal, setModalOpen } = useModalStore();
  const [hasTransactionFailure, setHasTransactionFailure] = useState(true);
  const getAdAccountStatus = useAppStore((state: AppStoreType) => state.getAdAccountStatus);

  const resolvePaymentStatus = useCallback(async () => {
    try {
      const { hasTransactionFailure: transactionFailure } = await getAdAccountStatus();
      if (transactionFailure) {
        handleCampaignPaymentMethodChange(PaymentMethodType.AD_CREDIT);
      }
      setHasTransactionFailure(transactionFailure);
    } catch (error) {
      CaptureException(error as Error);
      setModalConfigDataToErrorModal();
      setModalOpen(true);
    }
  }, []);

  useEffect(() => {
    resolvePaymentStatus();
    if (shouldShowOneTimeCloningTreatment && scheduleRef?.current) {
      scheduleRef?.current?.scrollIntoView();
    }
  }, []);

  const handleCampaignBudgetChange = (value: TODOFIXANY) => {
    setShowLowerBudgetWarning(enableBudgetWarning && value.floatValue < originalBudget);

    formikInfo.setFieldValue(
      createCampaignWizardModel.formField.campaignBudgetCapUsd.name,
      value.floatValue,
    );
  };

  const getPaymentMethodHelperText = (paymentMethodType: PaymentMethodType): string => {
    if (!dailySpendLimitUsd) return '';
    if (paymentMethodType === PaymentMethodType.CARD) {
      if (isDefaultBillingTier) {
        return `A $${dailySpendLimitUsd} USD spending limit is applied to your first campaign to ensure payment acceptance.`;
      }
      return `A $${dailySpendLimitUsd} USD daily spending limit is applied to your campaign to ensure payment acceptance.`;
    }
    return '';
  };

  const getCampaignBudgetHelperTextSponsoredAdEnabled = () => {
    // do not show budget helper text for edit campaign component
    if (!enableBudgetWarning) {
      return 'Budget applies to calendar dates, not a 24-hour day. All campaigns run a minimum of 2 calendar days.';
    }

    return '';
  };

  const getCampaignBudgetLabelText = () => {
    if (formikInfo.values.campaignBudgetType === BudgetType.LIFETIME) {
      return 'Lifetime Budget';
    }
    if (formikInfo.values.campaignBudgetType === BudgetType.DAILY) {
      return 'Daily Budget';
    }

    return '';
  };

  const onTimeChange = (newDate: Date | null, newValue: string | undefined, inputName: string) => {
    // this function is shared for start time and end time components
    // will need to know which component is being edited
    const isStartTime = inputName === 'campaignStartTime';

    // formik update has delay, if current component is being edited
    // we will need to use the value passed through onChange event
    let startDateTime = null;
    let endDateTime = null;

    if (newDate != null) {
      startDateTime = isStartTime
        ? new Date(new Date(formikInfo.values.campaignStartDate).getTime() + getTimeDiffMs(newDate))
        : new Date(formikInfo.values.campaignStartTimestampMs);
      endDateTime = isStartTime
        ? new Date(formikInfo.values.campaignEndTimestampMs)
        : new Date(new Date(formikInfo.values.campaignEndDate).getTime() + getTimeDiffMs(newDate));
    }

    // we want to preserve final value wether it's valid or not
    // combined date and time into one value and update the final field
    if (isStartTime) {
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignStartTimestampMs.name,
        startDateTime,
        true,
      );
      formikInfo.setFieldTouched(
        createCampaignWizardModel.formField.campaignStartDate.name,
        true,
        false,
      );
    } else {
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignEndTimestampMs.name,
        endDateTime,
        true,
      );
      formikInfo.setFieldTouched(
        createCampaignWizardModel.formField.campaignEndDate.name,
        true,
        false,
      );
    }

    // we want to reduce re-render, so value for the input component is set later in
    // the function before return
    if (!newValue) {
      formikInfo.setFieldValue(inputName, newDate, true);
      formikInfo.setFieldError(inputName, 'Required');
      return;
    }

    if (!IsValidDate(newDate)) {
      formikInfo.setFieldValue(inputName, newDate, true);
      formikInfo.setFieldError(inputName, 'Invalid time');
      return;
    }

    // pass validation, clear error
    formikInfo.setFieldValue(inputName, newDate, true);

    setTimeout(() => {
      formikInfo.validateField(createCampaignWizardModel.formField.campaignStartTime.name);
      formikInfo.validateField(createCampaignWizardModel.formField.campaignEndTime.name);
      formikInfo.validateField(createCampaignWizardModel.formField.campaignStartDate.name);
      formikInfo.validateField(createCampaignWizardModel.formField.campaignEndDate.name);

      // max limits for daily and lifetime budgets are calculated based on duration of the campaign
      formikInfo.validateField(createCampaignWizardModel.formField.campaignBudgetCapUsd.name);
    }, 0);
  };

  const onDateChange = (newDate: Date | null, inputName: string) => {
    if (!newDate) {
      return;
    }
    const isStartDate = inputName === 'campaignStartDate';
    // we need to calculate and update final value whether it is valid or not
    // get date part from newDate and time part from campaignStartTime or
    // campaignEndTime, need to handle edge case where time is null since
    // passing null to date constructor will get a valid date
    const currentTime = isStartDate
      ? new Date(
          formikInfo.values.campaignStartTime === null ? '' : formikInfo.values.campaignStartTime,
        )
      : new Date(
          formikInfo.values.campaignEndTime === null ? '' : formikInfo.values.campaignEndTime,
        );

    const currentDateTime =
      newDate === null || !IsValidDate(currentTime)
        ? null
        : new Date(
            newDate.getFullYear(),
            newDate.getMonth(),
            newDate.getDate(),
            currentTime.getHours(),
            currentTime.getMinutes(),
          );

    formikInfo.setFieldValue(
      isStartDate
        ? createCampaignWizardModel.formField.campaignStartTimestampMs.name
        : createCampaignWizardModel.formField.campaignEndTimestampMs.name,
      currentDateTime?.getTime(),
      false,
    );

    formikInfo.setFieldValue(inputName, newDate, false);

    // if editing start date, user hasn't touched the end date, and new start date
    // would be on or after end date, set end date to be day after start date
    if (
      isStartDate &&
      !formikInfo.touched.campaignEndDate &&
      !formikInfo.touched.campaignEndTime &&
      currentDateTime &&
      currentDateTime.getTime() >= formikInfo.values.campaignEndTimestampMs
    ) {
      const endDateTime = new Date(currentDateTime);
      const endDate = new Date(newDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      endDate.setDate(endDate.getDate() + 1);
      const newEndDateTimeValues = {
        ...formikInfo.values,
        [createCampaignWizardModel.formField.campaignEndDate.name]: endDate,
        [createCampaignWizardModel.formField.campaignEndTimestampMs.name]: endDateTime.getTime(),
        [createCampaignWizardModel.formField.campaignStartDate.name]: newDate,
        [createCampaignWizardModel.formField.campaignStartTimestampMs.name]:
          currentDateTime?.getTime(),
      };
      formikInfo.setValues(newEndDateTimeValues, false);
    }

    if (isStartDate) {
      formikInfo.setFieldTouched(
        createCampaignWizardModel.formField.campaignStartTime.name,
        true,
        false,
      );
    } else {
      formikInfo.setFieldTouched(
        createCampaignWizardModel.formField.campaignEndTime.name,
        true,
        false,
      );
    }

    // max limits for daily and lifetime budgets are calculated based on duration of the campaign
    formikInfo.setFieldTouched(
      createCampaignWizardModel.formField.campaignBudgetCapUsd.name,
      true,
      true,
    );

    // If start date changes to be valid - the end date error should clear and vice versa.
    setTimeout(() => {
      formikInfo.validateField(createCampaignWizardModel.formField.campaignStartDate.name);
      formikInfo.validateField(createCampaignWizardModel.formField.campaignEndDate.name);
      formikInfo.validateField(createCampaignWizardModel.formField.campaignStartTime.name);
      formikInfo.validateField(createCampaignWizardModel.formField.campaignEndTime.name);

      // max limits for daily and lifetime budgets are calculated based on duration of the campaign
      formikInfo.validateField(createCampaignWizardModel.formField.campaignBudgetCapUsd.name);
    }, 0);
  };

  const onStartDateBlur = () => {
    formikInfo.setFieldTouched(
      createCampaignWizardModel.formField.campaignStartDate.name,
      true,
      false,
    );
  };

  const onStartTimeBlur = () => {
    formikInfo.setFieldTouched(
      createCampaignWizardModel.formField.campaignStartTime.name,
      true,
      false,
    );
  };

  const onEndDateBlur = () => {
    formikInfo.setFieldTouched(
      createCampaignWizardModel.formField.campaignEndDate.name,
      true,
      false,
    );
  };

  const onEndTimeBlur = () => {
    formikInfo.setFieldTouched(
      createCampaignWizardModel.formField.campaignEndTime.name,
      true,
      false,
    );
  };

  const handleSetEndDate = (event: ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    setIsEndDateChecked(isChecked);
    formikInfo.setFieldValue(
      createCampaignWizardModel.formField.campaignHasEndDate.name,
      isChecked,
    );
  };

  const minDate = new Date(
    new Date().getTime() +
      GetTimezoneOffsetMs(GetTimezoneObjFromEnum(organizationInfo.time_zone).timezoneDbName),
  );

  const getEndDateSection = () => {
    if (formikInfo.values.campaignBudgetType === BudgetType.LIFETIME || isEndDateChecked) {
      const campaignEndDate = new Date(
        formikInfo.values[createCampaignWizardModel.formField.campaignEndTimestampMs.name],
      );

      const isCampaignOver = campaignEndDate <= new Date();

      return (
        <KeyboardDatePickerCampaignConfiguration
          dateInputName={createCampaignWizardModel.formField.campaignEndDate.name}
          disableInputs={disableInputs || disableEndDateInput}
          disablePast={false}
          formikInfo={formikInfo}
          helperText={getEndDateHelperText(
            formikInfo.values.campaignBudgetType,
            formikInfo.values.campaignPaymentMethod,
            disableEndDateInput,
            isCampaignOver,
          )}
          inputModel={createCampaignWizardModel}
          minDate={minDate}
          onDateBlurCustom={onEndDateBlur}
          onDateChangeCustom={onDateChange}
          onTimeBlurCustom={onEndTimeBlur}
          onTimeChangeCustom={onTimeChange}
          timeInputName={createCampaignWizardModel.formField.campaignEndTime.name}
        />
      );
    }
    return undefined;
  };

  const handleCampaignBudgetTypeChange = (ev: TODOFIXANY) => {
    const { value } = ev.target;

    formikInfo.setFieldValue(createCampaignWizardModel.formField.campaignBudgetType.name, value);

    if (formikInfo.values.campaignObjective === CampaignObjectiveType.AWARENESS) {
      if (value === BudgetType.LIFETIME) {
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.adSetBidType.name,
          AdSetBidType.FIXED_COST_PER_MILLE,
        );
        formikInfo.setFieldValue(createCampaignWizardModel.formField.campaignHasEndDate.name, true);
      }
      // Nobody can choose COST_PER_MILLE for now
      if (value === BudgetType.DAILY) {
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.adSetBidType.name,
          AdSetBidType.FIXED_COST_PER_MILLE,
        );
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.campaignHasEndDate.name,
          isEndDateChecked,
        );
      }
    }

    setTimeout(
      () => formikInfo.validateField(createCampaignWizardModel.formField.campaignBudgetCapUsd.name),
      0,
    );

    return '';
  };
  const showExpirationDate = (year: number, month: number) => {
    // TODO: use locale for date format
    const date = new Date(year, month - 1, 1);
    return moment(date).format('MM/YY');
  };

  const budgetHelperText = getCampaignBudgetHelperTextSponsoredAdEnabled();

  const campaignDuration = getDurationInDays(
    formikInfo.values.campaignStartTimestampMs,
    formikInfo.values.campaignEndTimestampMs,
    GetTimezoneObjFromEnum(organizationInfo.time_zone).timezoneDbName,
  );
  const prechargeAmountValue = '5.00 USD'; // TODO, fetch from AMA in future release

  return (
    <>
      <CampaignFormGroup headerText='Budget' headerTooltipText={GetTooltipText(budgetTooltip)}>
        <>
          {!isAdAccountInternalOrManaged && (
            <Tooltip
              placement='right'
              title={
                hasTransactionFailure ? (
                  <div>
                    <Typography variant='body1'>
                      Your card was declined. Visit the Payment Settings page to update your card
                      information.
                    </Typography>
                  </div>
                ) : (
                  ''
                )
              }>
              <Select
                classes={{
                  root: `${configurePaymentMethodInput}`,
                }}
                data-testid='payment-method-dropdown'
                disabled={disableInputs || disablePaymentMethodInput}
                error={
                  formikInfo.touched.campaignPaymentMethod &&
                  Boolean(formikInfo.errors.campaignPaymentMethod)
                }
                helperText={
                  formikInfo.values.campaignPaymentMethod === PaymentMethodType.CARD &&
                  creditCardPrechargeForAccountRequired
                    ? `${prechargeAmountValue} will be charged upon campaign submission for use towards your first bill.`
                    : getPaymentMethodHelperText(formikInfo.values.campaignPaymentMethod)
                }
                label={createCampaignWizardModel.formField.campaignPaymentMethod.label}
                name={createCampaignWizardModel.formField.campaignPaymentMethod.name}
                onBlur={formikInfo.handleBlur}
                onChange={(ev) =>
                  handleCampaignPaymentMethodChange(ev.target.value as PaymentMethodType)
                }
                SelectProps={{
                  onOpen: () => {
                    unifiedLogger.logClickEvent({
                      eventName: EventName.CreateCampaignPaymentMethodDropdownOpened,
                    });
                  },
                }}
                value={formikInfo.values.campaignPaymentMethod}>
                {paymentProfiles && paymentProfiles.length > 0 && (
                  // TODO: revisit the single vs double line setup in new webblox
                  <MenuItem value={PaymentMethodType.CARD}>
                    <div className='cardPaymentMenuItemWrap'>
                      <div className={cardPaymentContainer}>
                        <PaymentMethodIcon
                          largeIcon={false}
                          paymentMethodType={paymentProfiles[0].card_network}
                          smallIcon
                        />
                        <Typography
                          className={cx(cardNumberContainer, 'cardPaymentTitleRow')}
                          variant='body1'>
                          **** {paymentProfiles[0].last_four_digits}
                        </Typography>
                        <Typography variant='body1'>
                          Exp:&nbsp;
                          {showExpirationDate(
                            paymentProfiles[0].exp_year,
                            paymentProfiles[0].exp_month,
                          )}
                        </Typography>
                      </div>
                    </div>
                  </MenuItem>
                )}
                {adCreditActivated && (
                  <MenuItem value={PaymentMethodType.AD_CREDIT}>
                    <div className='adCreditMenuItem'>
                      <div>
                        <Typography className='cardPaymentTitleRow' variant='body1'>
                          Ad Credit
                        </Typography>
                      </div>
                      <div className='menuItemHelperText'>
                        <Typography variant='body2'>
                          (Balance: {MicroUsdToUsdStringRoundedDown(adCreditBalance)})
                        </Typography>
                      </div>
                    </div>
                  </MenuItem>
                )}
              </Select>
            </Tooltip>
          )}
          <div className={budgetRadioContainer}>
            <ConfigurationRadioGroup
              classes={{ root: budgetTypeRadioGroup }}
              onChange={handleCampaignBudgetTypeChange}
              radioGroupName={createCampaignWizardModel.formField.campaignBudgetType.name}
              radioGroupOptions={[
                {
                  ariaLabel: 'daily',
                  classForLabel: budgetRadio,
                  disabled: disableInputs || disableBudgetSelection,
                  displayLabel: 'Daily Budget',
                  optionId: 'campaignBudgetTypeDaily',
                  value: BudgetType.DAILY,
                },
                {
                  ariaLabel: 'lifetime',
                  classForLabel: budgetRadio,
                  disabled: disableInputs || disableBudgetSelection,
                  displayLabel: 'Lifetime Budget',
                  optionId: 'campaignBudgetTypeLifetime',
                  value: BudgetType.LIFETIME,
                },
              ]}
              value={formikInfo.values.campaignBudgetType}
            />
          </div>

          <NumericFormat
            classes={{
              root: configureCampaignInput,
            }}
            color='primary'
            customInput={TextField}
            data-testid='budget-input'
            decimalScale={2}
            disabled={disableInputs}
            error={
              formikInfo.touched.campaignBudgetCapUsd &&
              Boolean(formikInfo.errors.campaignBudgetCapUsd)
            }
            fixedDecimalScale
            helperText={
              (formikInfo.touched.campaignBudgetCapUsd && formikInfo.errors.campaignBudgetCapUsd) ||
              budgetHelperText
            }
            id={createCampaignWizardModel.formField.campaignBudgetCapUsd.name}
            InputProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  {getEndUserDisplayCurrency(formikInfo.values.campaignPaymentMethod)}
                </InputAdornment>
              ),
            }}
            label={getCampaignBudgetLabelText()}
            margin='none'
            name={createCampaignWizardModel.formField.campaignBudgetCapUsd.name}
            onBlur={formikInfo.handleBlur}
            onValueChange={handleCampaignBudgetChange}
            thousandSeparator=','
            thousandsGroupStyle='thousand'
            value={formikInfo.values.campaignBudgetCapUsd}
          />

          {showLowerBudgetWarning && !formikInfo.errors.campaignBudgetCapUsd && (
            <div className={warningContainer}>
              <Typography color='warning' variant='smallLabel1'>
                Any existing spent beyond the newly set budget will be billed based on the actual
                amount spent. If campaign already spent more than the updated budget, campaigns will
                automatically pause.
              </Typography>
            </div>
          )}
        </>
      </CampaignFormGroup>
      <CampaignFormGroup headerText='Schedule' headerTooltipText={GetTooltipText(scheduleTooltip)}>
        {shouldShowOneTimeCloningTreatment && (
          <Alert className={alertText} ref={scheduleRef} severity='warning' variant='standard'>
            Please review the start date and end date are accurate before submitting
          </Alert>
        )}
        <div className={configureCampaignInputDateInputsRow}>
          <KeyboardDatePickerCampaignConfiguration
            dateInputName={createCampaignWizardModel.formField.campaignStartDate.name}
            disableInputs={disableInputs || disableStartDateInput}
            disablePast={false}
            formikInfo={formikInfo}
            helperText={(GetTimezoneObjFromEnum(organizationInfo.time_zone) || {}).title}
            inputModel={createCampaignWizardModel}
            minDate={minDate}
            onDateBlurCustom={onStartDateBlur}
            onDateChangeCustom={onDateChange}
            onTimeBlurCustom={onStartTimeBlur}
            onTimeChangeCustom={onTimeChange}
            timeInputName={createCampaignWizardModel.formField.campaignStartTime.name}
          />
          <div className={dateTimePickerGroupSpace} />
          {getEndDateSection()}
        </div>

        {formikInfo.values.campaignBudgetType === BudgetType.DAILY &&
          formikInfo.values.campaignPaymentMethod !== PaymentMethodType.AD_CREDIT && (
            <div className={endDateCheckBoxContainer}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isEndDateChecked}
                    color='secondary'
                    disabled={disableInputs || disableEndDateInput}
                    onChange={handleSetEndDate}
                    size='medium'
                  />
                }
                label='Set End Date & Time (Optional)'
              />
            </div>
          )}

        {isEndDateChecked && (
          <div>
            <Typography classes={{ root: dayWarning }} color='warning' variant='body2'>
              <InfoOutlinedIcon
                style={{ color: 'inherit', height: 14, marginRight: 2, width: 14 }}
              />{' '}
              {`${campaignDuration} calendar dates are selected. Your budget will be applied across ${campaignDuration} selected dates.`}
            </Typography>
          </div>
        )}
      </CampaignFormGroup>
    </>
  );
};

export const CampaignNameFormGroup = ({
  disableInputs,
  formikInfo,
  onInputKeyPress,
}: {
  disableInputs: boolean;
  formikInfo: TODOFIXANY;
  onInputKeyPress: TODOFIXANY;
}) => {
  const {
    classes: { configureCampaignInput },
  } = makeStyles()(() => ({
    configureCampaignInput: {
      marginTop: 20,
      width: '100%',
    },
  }))();
  return (
    <CampaignFormGroup headerText='Campaign Name'>
      <InputWrapperWithRightAlignedHelperText
        helperTextValue={`${formikInfo.values.campaignName.length}/128`}
        topOffset='75px'>
        <TextField
          classes={{
            root: configureCampaignInput,
          }}
          data-testid='campaign-name-input'
          disabled={disableInputs}
          error={formikInfo.touched.campaignName && Boolean(formikInfo.errors.campaignName)}
          helperText={formikInfo.touched.campaignName && formikInfo.errors.campaignName}
          id={createCampaignWizardModel.formField.campaignName.name}
          label={createCampaignWizardModel.formField.campaignName.label}
          margin='none'
          name={createCampaignWizardModel.formField.campaignName.name}
          onBlur={formikInfo.handleBlur}
          onChange={formikInfo.handleChange}
          onKeyPress={onInputKeyPress}
          value={formikInfo.values.campaignName}
        />
      </InputWrapperWithRightAlignedHelperText>
    </CampaignFormGroup>
  );
};

export const CampaignAdvertiserNameFormGroup = ({
  disableInputs,
  formikInfo,
  onInputKeyPress,
}: {
  disableInputs: boolean;
  formikInfo: TODOFIXANY;
  onInputKeyPress: TODOFIXANY;
}) => {
  const {
    classes: { configureCampaignInput },
  } = makeStyles()(() => ({
    configureCampaignInput: {
      marginTop: 20,
      width: '100%',
    },
  }))();

  const [field] = useField(createCampaignWizardModel.formField.campaignAdvertiserName.name);
  const { setFieldTouched, setFieldValue } = useFormikContext();

  const validateAdvertiserName = (value: string) => {
    if (value.length === 0) {
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignAdvertiserNameError.name,
        'Advertiser name is required',
      );
      return;
    }

    if (value.length > 128) {
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignAdvertiserNameError.name,
        'Advertiser name cannot exceed 128 characters',
      );
      return;
    }

    if (removeTabsAndLeadingSpaces(value) === '') {
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignAdvertiserNameError.name,
        'Please enter something more descriptive',
      );
      return;
    }

    if (detectSpecialCharacters(value)) {
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignAdvertiserNameError.name,
        'We do not allow these characters for this field: & < > " \'',
      );
      return;
    }

    getValidateDisplayName(value).then((result) => {
      if (!result.is_valid) {
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.campaignAdvertiserNameError.name,
          'Choose a name that follows Roblox Community Standards',
        );
      } else {
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.campaignAdvertiserNameError.name,
          '',
        );
      }
    });
  };

  const handleBlur = (___: FocusEvent<HTMLInputElement>) => {
    setFieldTouched(createCampaignWizardModel.formField.campaignAdvertiserName.name, true, false);
    validateAdvertiserName(field.value);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFieldValue(createCampaignWizardModel.formField.campaignAdvertiserName.name, e.target.value);
    if (formikInfo.values.campaignAdvertiserNameError) {
      validateAdvertiserName(e.target.value);
    }
  };

  const helperText = 'Business name and advertiser name may be shown to users in ad disclosures.';

  return (
    <CampaignFormGroup
      headerText='Advertiser Name'
      headerTooltipText={GetTooltipText(advertiserNameTooltip)}>
      <InputWrapperWithRightAlignedHelperText
        helperTextValue={`${formikInfo.values.campaignAdvertiserName.length}/128`}
        topOffset='75px'>
        <TextField
          classes={{
            root: configureCampaignInput,
          }}
          disabled={disableInputs}
          error={
            formikInfo.touched.campaignAdvertiserName &&
            Boolean(formikInfo.values.campaignAdvertiserNameError)
          }
          helperText={
            (formikInfo.touched.campaignAdvertiserName &&
              formikInfo.values.campaignAdvertiserNameError) ||
            helperText
          }
          id={createCampaignWizardModel.formField.campaignAdvertiserName.name}
          label={createCampaignWizardModel.formField.campaignAdvertiserName.label}
          margin='none'
          name={createCampaignWizardModel.formField.campaignAdvertiserName.name}
          onBlur={handleBlur}
          onChange={handleChange}
          onKeyPress={onInputKeyPress}
          value={formikInfo.values.campaignAdvertiserName}
        />
      </InputWrapperWithRightAlignedHelperText>
    </CampaignFormGroup>
  );
};

const handleCampaignObjectiveChange = (
  formikInfo: TODOFIXANY,
  value: CampaignObjectiveType,
  campaignMetadata: TODOFIXANY,
) => {
  const {
    campaignNameEdited,
    coreCountryOverrideCodeList,
    coreRegionCodeList,
    strategicRegionCodeList,
    videoMinBidMappingsMicroUsd,
  } = campaignMetadata;

  formikInfo.setFieldValue(createCampaignWizardModel.formField.campaignObjective.name, value);

  const newAdFormatType = getAdFormatFromCampaignType(value);

  if (newAdFormatType) {
    formikInfo.setFieldValue(createCampaignWizardModel.formField.adType.name, newAdFormatType);
  }

  const newAdSetBidType = getAdSetBidTypeFromCampaignTypeAndPaidAccessSelection(
    value,
    formikInfo.values.adSetPaidAccess,
  );

  if (newAdFormatType) {
    formikInfo.setFieldValue(
      createCampaignWizardModel.formField.adSetBidType.name,
      newAdSetBidType,
    );
  }

  if (value === CampaignObjectiveType.VIDEO_VIEWS) {
    formikInfo.setFieldValue(
      createCampaignWizardModel.formField.billableViewDuration.name,
      BillableViewDurationType.FIFTEEN_SECONDS,
    );

    formikInfo.setFieldValue(
      createCampaignWizardModel.formField.adSetBidType.name,
      AdSetBidType.CPV15,
    );

    formikInfo.setFieldValue(createCampaignWizardModel.formField.adType.name, AdFormatType.VIDEO);
  }

  if (!campaignNameEdited) {
    let objectiveText = '';

    if (value === CampaignObjectiveType.AWARENESS) {
      objectiveText = 'Awareness';
    }

    if (value === CampaignObjectiveType.VISITS) {
      objectiveText = 'Visits';
    }

    if (value === CampaignObjectiveType.VIDEO_VIEWS) {
      objectiveText = 'Video Views';
    }

    formikInfo.setFieldValue(
      createCampaignWizardModel.formField.campaignName.name,
      `${objectiveText} - ${formatDateToMMDDYYYY(new Date())}`,
    );
  }

  const regionCodes = (
    convertAdSetMixedRegionAndCountryTargetingIntoRegions(
      formikInfo?.values?.adSetMixedRegionAndCountryTargeting || [],
    ) || []
  ).map((r: TODOFIXANY) => r.value);
  const countries = formikInfo?.values?.adSetMixedRegionAndCountryTargeting?.countries || [];

  const defaultBidValue = getDefaultBidValue(
    newAdSetBidType,
    formikInfo.values.adSetAuctionType,
    newAdFormatType,
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
};

interface CreateCampaignConfigurationFormProps {
  disableInputs: boolean;
  formikInfo: TODOFIXANY;
  isInCloneMode?: boolean;
  shouldShowOneTimeCloningTreatment?: boolean;
}

export const CreateCampaignConfigurationForm = ({
  disableInputs = false,
  formikInfo,
  isInCloneMode = false,
  shouldShowOneTimeCloningTreatment = false,
}: CreateCampaignConfigurationFormProps) => {
  const {
    classes: { experienceExtraTextContainer, loadingContainer, universePickerFormGroupClass },
  } = makeStyles()(() => ({
    experienceExtraTextContainer: {
      marginLeft: '15px',
      marginTop: '12px',
    },
    loadingContainer: {
      alignItems: 'center',
      display: 'flex',
      height: '30rem',
      justifyContent: 'center',
      width: '100%',
    },
    universePickerFormGroupClass: {
      marginTop: 16,
    },
  }))();

  const [pageLoading, setPageLoading] = useState(true);
  const { universesCanAccess = [] } = useContext(CreateCampaignMetadataContext);
  const {
    isCreditCardPrechargeForAccountRequired,
    setAdAccountPrepaidBalance,
    setIsCreditCardPrechargeForAccountRequired,
  } = useContext(CreateCampaignMetadataContext);

  const [noUniversesHelperText, setNoUniversesHelperText] = useState('');
  const [campaignNameEdited, setCampaignNameEdited] = useState(false);
  const {
    adCreditBalance,
    coreCountryOverrideCodeList,
    coreRegionCodeList,
    isDefaultBillingTier,
    organizationInfo,
    paymentProfiles,
    strategicRegionCodeList,
    videoMinBidMappingsMicroUsd,
  } = useAppStore((state: AppStoreType) => state.appData);

  const configurationValues = {
    coreCountryOverrideCodeList,
    coreRegionCodeList,
    strategicRegionCodeList,
    videoMinBidMappingsMicroUsd,
  };

  const getAdvertiser = useAppStore((state: AppStoreType) => state.getAdvertiser);

  const adAccountIsInternalManaged = useAppStore(
    (state: AppStoreType) => state.adAccountIsInternalManaged,
  );
  const adAccountIsExternalManaged = useAppStore(
    (state: AppStoreType) => state.adAccountIsExternalManaged,
  );
  const isBusinessOrganization = useAppStore((state: AppStoreType) => state.organizationIsBusiness);

  useEffect(() => {
    if (disableInputs) {
      setPageLoading(false);
      return;
    }
    // Only do on first render
    const bootstrapFormik = () => {
      // Only do on first render or when user is not in clone mode
      if (!formikInfo.dirty && !isInCloneMode) {
        if (universesCanAccess.length === 0) {
          handleCampaignObjectiveChange(formikInfo, CampaignObjectiveType.AWARENESS, {
            campaignNameEdited: false,
            coreCountryOverrideCodeList,
            coreRegionCodeList,
            strategicRegionCodeList,
            videoMinBidMappingsMicroUsd,
          });

          setNoUniversesHelperText('');
        } else {
          handleCampaignObjectiveChange(formikInfo, CampaignObjectiveType.VISITS, {
            campaignNameEdited: false,
            coreCountryOverrideCodeList,
            coreRegionCodeList,
            strategicRegionCodeList,
            videoMinBidMappingsMicroUsd,
          });
        }
      }

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignAdCreditBalanceMicro.name,
        adCreditBalance,
      );

      if (adAccountIsExternalManaged() || adAccountIsInternalManaged()) {
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.campaignPaymentMethod.name,
          PaymentMethodType.INVOICE,
        );
      }

      // For user that has default payment ad credit, we only checks if ad credit
      // is activated before they can create campaign, so we need to run another
      // validation on budget when they try to create campaign
      if (formikInfo.values.campaignPaymentMethod === PaymentMethodType.AD_CREDIT) {
        formikInfo.setFieldTouched(
          createCampaignWizardModel.formField.campaignBudgetCapUsd.name,
          true,
          true,
        );
        setTimeout(
          () =>
            formikInfo.validateField(createCampaignWizardModel.formField.campaignBudgetCapUsd.name),
          0,
        );
      }
    };

    const populatePrepaidState = async () => {
      const advertiserResponse = await getAdvertiser();
      setIsCreditCardPrechargeForAccountRequired(
        advertiserResponse?.is_credit_card_precharge_for_account_required,
      );
      setAdAccountPrepaidBalance(advertiserResponse?.ad_account_prepaid_balance);
    };

    bootstrapFormik();
    populatePrepaidState()
      .catch((err) => {
        CaptureException(err as Error);
      })
      .finally(() => {
        setPageLoading(false);
      });
  }, [universesCanAccess]);

  const router = useRouter();

  useEffect(() => {
    if (disableInputs) {
      return;
    }

    if (router.pathname !== Routes.CREATE_ADSET && router.pathname !== Routes.CREATE_AD) {
      // don't reset date fields if user has changed them
      if (
        formikInfo.touched.campaignStartTime ||
        formikInfo.touched.campaignStartDate ||
        formikInfo.touched.campaignEndTime ||
        formikInfo.touched.campaignEndDate
      ) {
        return;
      }

      // removing the seconds and milliseconds because when user change time
      // the seconds and milliseconds will not be preserved
      const now = new Date(
        new Date().getTime() +
          GetTimezoneOffsetMs(GetTimezoneObjFromEnum(organizationInfo.time_zone).timezoneDbName),
      );
      now.setSeconds(0);
      now.setMilliseconds(0);
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignStartTimestampMs.name,
        now.getTime(),
      );
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignStartTime.name,
        now.getTime(),
      );
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignStartDate.name,
        now.getTime() - getTimeDiffMs(now),
      );
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignFormOpenedTime.name,
        now.getTime(),
      );

      const endDate = new Date(now);
      endDate.setHours(endDate.getHours() + 24);
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignEndTimestampMs.name,
        endDate,
      );
      formikInfo.setFieldValue(createCampaignWizardModel.formField.campaignEndTime.name, endDate);
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignEndDate.name,
        new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()),
      );

      formikInfo.setFieldValue(createCampaignWizardModel.formField.campaignHasEndDate.name, true);
    }
  }, []);

  // Only set the new default if this isn't already set by the ad set loaded on the add ad to ad set flow
  if (!formikInfo.values[createCampaignWizardModel.formField.adSetBidValueUsd.name]) {
    const regionCodes = (
      convertAdSetMixedRegionAndCountryTargetingIntoRegions(
        formikInfo?.values?.adSetMixedRegionAndCountryTargeting || [],
      ) || []
    ).map((r: TODOFIXANY) => r.value);
    const countries = formikInfo?.values?.adSetMixedRegionAndCountryTargeting?.countries || [];

    const defaultBidValue = getDefaultBidValue(
      formikInfo.adSetBidType,
      formikInfo.adSetAuctionType,
      formikInfo.adType,
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

  const handleCampaignObjectiveChangeInForm = (ev: TODOFIXANY) => {
    handleCampaignObjectiveChange(formikInfo, ev.target?.value, {
      campaignNameEdited,
      coreCountryOverrideCodeList,
      coreRegionCodeList,
      strategicRegionCodeList,
      videoMinBidMappingsMicroUsd,
    });
  };

  const campaignObjectiveFormGroup = (
    <CampaignObjectiveFormGroup
      disableInputs={disableInputs}
      formikInfo={formikInfo}
      helperText={
        noUniversesHelperText ||
        (formikInfo.touched.campaignObjective && formikInfo.errors.campaignObjective)
      }
      onInputChange={handleCampaignObjectiveChangeInForm}
    />
  );

  const portalDestinations: AutocompleteOption[] = universesCanAccess.map(
    convertServerUniverseToAutocompletOption,
  );

  const universePickerFormGroup = (
    <div className={universePickerFormGroupClass}>
      <SelectUniverseAutocomplete
        disabled={disableInputs}
        getOptionLabelFn={(adPortalDestinationOption: AutocompleteOption) => {
          const option = portalDestinations.find((portalDestObj) => {
            return (
              portalDestObj.universeId === adPortalDestinationOption.universeId ||
              portalDestObj.rootPlaceId === adPortalDestinationOption.rootPlaceId
            );
          });
          const universeName = (option && option.universeName) || '';
          return universeName;
        }}
        id={createCampaignWizardModel.formField.adPortalDestinationPlaceId.name}
        onChange={(_event, universeObj) => {
          handlePortalDestinationChange(universeObj, formikInfo, configurationValues);
          logDestinationChangeEvent(universeObj);
        }}
        portalDestinations={portalDestinations}
        renderInputFn={(params) => {
          return (
            <TextField
              {...params}
              error={
                formikInfo.touched.adPortalDestinationPlaceId &&
                Boolean(formikInfo.errors.adPortalDestinationPlaceId)
              }
              helperText=''
              id='Destination Experience'
              label='Destination Experience'
              name={createCampaignWizardModel.formField.adPortalDestinationPlaceId.name}
            />
          );
        }}
        value={{
          rootPlaceId: formikInfo.values.adPortalDestinationPlaceId,
          universeId: formikInfo.values.adDestinationUniverseId,
          universeName: formikInfo.values.adPortalDestinationText,
        }}
      />
      {formikInfo.values[createCampaignWizardModel.formField.adSetRestrictedMaturity.name] &&
        !formikInfo.errors.adPortalDestinationPlaceId && (
          <div className={experienceExtraTextContainer}>
            <Typography color='warning' variant='smallLabel1'>
              Only <b>verified</b> 18+ users can join restricted (18+) experiences.
            </Typography>
          </div>
        )}
    </div>
  );

  const campaignBudgetAndScheduleFormGroup = (
    <CampaignBudgetAndScheduleFormGroup
      adCreditBalance={adCreditBalance}
      creditCardPrechargeForAccountRequired={isCreditCardPrechargeForAccountRequired}
      disableBudgetSelection={disableInputs}
      disableEndDateInput={disableInputs}
      disableInputs={disableInputs}
      disablePaymentMethodInput={disableInputs}
      disableStartDateInput={disableInputs}
      enableBudgetWarning={false}
      formikInfo={formikInfo}
      isAdAccountInternalOrManaged={adAccountIsInternalManaged() || adAccountIsExternalManaged()}
      isDefaultBillingTier={isDefaultBillingTier}
      organizationInfo={organizationInfo}
      paymentProfiles={paymentProfiles}
      shouldShowOneTimeCloningTreatment={shouldShowOneTimeCloningTreatment}
    />
  );

  const campaignNameFormGroup = (
    <CampaignNameFormGroup
      disableInputs={disableInputs}
      formikInfo={formikInfo}
      onInputKeyPress={() => {
        setCampaignNameEdited(true);
        formikInfo.setFieldTouched(
          createCampaignWizardModel.formField.campaignName.name,
          true,
          true,
        );
      }}
    />
  );

  const campaignAdvertiserNameFormGroup = (
    <CampaignAdvertiserNameFormGroup
      disableInputs={disableInputs}
      formikInfo={formikInfo}
      onInputKeyPress={() => {}}
    />
  );

  const visitsObjectiveSelected =
    formikInfo.values.campaignObjective === CampaignObjectiveType.VISITS;

  return (
    <div data-create-campaign-configuration-form>
      {pageLoading && (
        <div className={loadingContainer}>
          <CustomCircularProgress />
        </div>
      )}
      {!pageLoading && (
        <>
          {campaignObjectiveFormGroup}
          {visitsObjectiveSelected && universePickerFormGroup}
          {campaignBudgetAndScheduleFormGroup}
          {isBusinessOrganization() && campaignAdvertiserNameFormGroup}
          {campaignNameFormGroup}
        </>
      )}
    </div>
  );
};
