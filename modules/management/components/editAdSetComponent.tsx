import { Button, makeStyles, Typography } from '@rbx/ui';
import { useEffect, useState } from 'react';

import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import { ServerPaymentType } from '@constants/campaign';
import { EntityType } from '@constants/entity';
import { AgeBucketType } from '@modules/clients/ads/adsClientTypes';
import {
  convertPaymentTypeServerToClient,
  roundFloatDownToTwoDecimals,
} from '@modules/clients/ads/serverClientTransformationUtilities';
import {
  AdSetAdPlacementGroup,
  AdSetAudienceTargetingFormGroup,
  AdSetBiddingFormGroup,
  AdSetBrandSuitabilityGroup,
  AdSetGenreTargetingFormGroup,
  AdSetNameFormGroup,
} from '@modules/creation/components/createAdSetConfigurationForm';
import { editAdSetComponentModel } from '@modules/management/models/editAdSetComponentModel';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { AdFormatType } from '@type/ad';
import { ConvertEntityTypeEnumToString } from '@utils/enumToString';
import { TODOFIXANY } from 'app/shared/types';

interface EditAdSetComponentProps {
  disableEdit: boolean;
  formikInfo: TODOFIXANY;
  onCancelClick: TODOFIXANY;
  paymentType: number;
}

export const EditAdSetComponent = ({
  disableEdit,
  formikInfo,
  onCancelClick,
  paymentType,
}: EditAdSetComponentProps) => {
  const {
    classes: { buttonContainer, cancelButton, mainContainer, titleContainer, warningContainer },
  } = makeStyles()(() => ({
    buttonContainer: {
      display: 'flex',
      justifyContent: 'flex-end',
    },

    cancelButton: {
      marginRight: 16,
    },

    mainContainer: {
      margin: 32,
    },

    titleContainer: {
      margin: '32px 0px',
    },

    warningContainer: {
      marginBottom: 32,
    },
  }))();
  const [initialAdSetName, setInitialAdSetName] = useState('');
  const [initialMaxBid, setInitialMaxBid] = useState('');
  const [u18UserIsTarget, setU18UserIsTarget] = useState(true);
  const [u13UserIsTarget, setU13UserIsTarget] = useState(false);

  const adAccountIsExternalManaged = useAppStore(
    (state: AppStoreType) => state.adAccountIsExternalManaged,
  );
  const adAccountIsInternalManaged = useAppStore(
    (state: AppStoreType) => state.adAccountIsInternalManaged,
  );

  useEffect(() => {
    setInitialMaxBid(formikInfo.values.adSetBidValueUsd);
    setInitialAdSetName(formikInfo.values.adSetName);
    formikInfo.setFieldValue(
      editAdSetComponentModel.formField.adSetGenderTargeting.name,
      formikInfo.values.adSetGenderTargeting,
    );
    formikInfo.setFieldValue(
      editAdSetComponentModel.formField.adSetAgeTargeting.name,
      formikInfo.values.adSetAgeTargeting,
    );
    formikInfo.setFieldValue(
      editAdSetComponentModel.formField.adSetDeviceTargeting.name,
      formikInfo.values.adSetDeviceTargeting,
    );
    formikInfo.setFieldValue(
      editAdSetComponentModel.formField.adSetLanguageTargeting.name,
      formikInfo.values.adSetLanguageTargeting,
    );
    formikInfo.setFieldValue(
      editAdSetComponentModel.formField.adSetBidType.name,
      formikInfo.values.adSetBidType,
    );
    formikInfo.setFieldValue(
      editAdSetComponentModel.formField.adSetBidValueUsd.name,
      formikInfo.values.adSetBidValueUsd,
    );
    formikInfo.setFieldValue(
      editAdSetComponentModel.formField.adSetName.name,
      formikInfo.values.adSetName,
    );
    formikInfo.setFieldValue(
      editAdSetComponentModel.formField.campaignPaymentMethod.name,
      convertPaymentTypeServerToClient(paymentType),
    );
    formikInfo.setFieldValue(
      editAdSetComponentModel.formField.adSetFrequencyCapOn.name,
      formikInfo.values.adSetFrequencyCapOn,
    );
    formikInfo.setFieldValue(
      editAdSetComponentModel.formField.adSetFrequencyCapValue.name,
      formikInfo.values.adSetFrequencyCapValue,
    );

    // Validate entire form on page load (so if we change validation it shows what fields are now invalid that were previously saved)
    // If the min bid increases after the ad set is created - we want to show the user they cannot save because the bid is too low on page load
    setTimeout(() => {
      Object.values(editAdSetComponentModel.formField).forEach((value) => {
        formikInfo.setFieldTouched(value.name);
      });
      formikInfo.validateForm();
    }, 0);
  }, []);

  useEffect(() => {
    const includesU18 = formikInfo.values?.adSetAgeBucketTargeting?.ageBuckets?.includes(
      AgeBucketType.AGE_BUCKET_TYPE_13_TO_17,
    );
    setU18UserIsTarget(includesU18);
  }, [formikInfo.values.adSetAgeBucketTargeting.ageBuckets]);

  const { isAge5To12TargetingEnabled } = useAppStore(
    (state: AppStoreType) => state.appMetadataState.data,
  );

  const isU13TargetingApplicable = () => {
    if (!isAge5To12TargetingEnabled) return false;
    const { adType } = formikInfo.values;
    return (
      adType === AdFormatType.DISPLAY ||
      adType === AdFormatType.VIDEO ||
      adType === AdFormatType.PORTAL
    );
  };

  useEffect(() => {
    const includesU13 =
      isU13TargetingApplicable() &&
      formikInfo.values?.adSetAgeBucketTargeting?.ageBuckets?.includes(
        AgeBucketType.AGE_BUCKET_TYPE_5_TO_12,
      );
    setU13UserIsTarget(!!includesU13);
  }, [formikInfo.values.adSetAgeBucketTargeting.ageBuckets, formikInfo.values.adType]);

  const isAdSetInfoUnchanged = () => {
    const isNameUnchanged = formikInfo.values.adSetName === initialAdSetName;
    const isBidValueUnchanged =
      roundFloatDownToTwoDecimals(formikInfo.values.adSetBidValueUsd).toFixed(2) ===
      roundFloatDownToTwoDecimals(parseFloat(initialMaxBid)).toFixed(2);
    return isNameUnchanged && isBidValueUnchanged;
  };

  return (
    <div className={mainContainer}>
      <div className={buttonContainer}>
        <Button className={cancelButton} color='primary' onClick={onCancelClick} variant='outlined'>
          Cancel
        </Button>
        <Button
          color='primaryBrand'
          disabled={!formikInfo.isValid || disableEdit || isAdSetInfoUnchanged()}
          onClick={(e) => {
            e.preventDefault();
            formikInfo.handleSubmit(e);
            unifiedLogger.logClickEvent({
              eventName: EventName.SubmitEditButtonClicked,
              parameters: {
                entityType: ConvertEntityTypeEnumToString(EntityType.ENTITY_TYPE_AD_SET),
              },
            });
          }}
          variant='contained'>
          Save
        </Button>
      </div>
      <div className={titleContainer}>
        <Typography variant='h2'>
          {disableEdit ? '' : 'Edit '} {initialAdSetName}
        </Typography>
      </div>
      {disableEdit && (
        <div className={warningContainer}>
          <Typography color='warning' variant='body2'>
            Cannot edit completed ad set.
          </Typography>
        </div>
      )}

      <AdSetAdPlacementGroup
        adSetNameEdited={false}
        blockedAdFormats={[]}
        disableInputs
        formikInfo={formikInfo}
      />

      <AdSetAudienceTargetingFormGroup
        adSetNameEdited={false}
        disableInputs
        formikInfo={formikInfo}
        isU13TargetingApplicable={isU13TargetingApplicable}
        u13UserIsTarget={u13UserIsTarget}
        u18UserIsTarget={u18UserIsTarget}
      />

      <AdSetBrandSuitabilityGroup disableInputs formikInfo={formikInfo} />

      <AdSetGenreTargetingFormGroup disableInputs formikInfo={formikInfo} />

      <AdSetBiddingFormGroup
        disableAuctionInput
        disableBidInput={paymentType === ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT || disableEdit}
        disableBillableViewDurationInput
        disableFrequencyInput
        formikInfo={formikInfo}
        isAdAccountInternal={adAccountIsInternalManaged()}
        isAdAccountManaged={adAccountIsExternalManaged()}
      />

      <AdSetNameFormGroup
        disableInputs={disableEdit}
        formikInfo={formikInfo}
        onInputKeyPress={() => {}}
      />
    </div>
  );
};
