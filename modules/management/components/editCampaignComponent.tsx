import { Button, makeStyles, Typography } from '@rbx/ui';
import { noop } from 'lodash';
import { useEffect, useState } from 'react';

import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import { ServerPaymentType } from '@constants/campaign';
import { EntityType } from '@constants/entity';
import {
  CampaignAdvertiserNameFormGroup,
  CampaignBudgetAndScheduleFormGroup,
  CampaignNameFormGroup,
  CampaignObjectiveFormGroup,
  getTimeDiffMs,
} from '@modules/creation/components/createCampaignConfigurationForm';
import { editCampaignComponentModel } from '@modules/management/models/editCampaignComponentModel';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { ToFixedNoRounding } from '@utils/currency';
import { GetTimezoneOffsetMs } from '@utils/date';
import { ConvertEntityTypeEnumToString } from '@utils/enumToString';
import { GetTimezoneObjFromEnum } from '@utils/timezone';
import { TODOFIXANY } from 'app/shared/types';

interface EditCampaignComponentProps {
  disableEdit: boolean;
  disableStartDateInput: boolean;
  formikInfo: TODOFIXANY;
  onCancelClick: TODOFIXANY;
  paymentType: number;
}

export const EditCampaignComponent = ({
  disableEdit,
  disableStartDateInput,
  formikInfo,
  onCancelClick,
  paymentType,
}: EditCampaignComponentProps) => {
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

  const {
    adCreditBalance = 0,
    isDefaultBillingTier = false,
    organizationInfo = {},
    paymentProfiles = [],
  } = useAppStore((state: AppStoreType) => state.appData);

  const isBusinessOrganization = useAppStore((state: AppStoreType) => state.organizationIsBusiness);

  const adAccountIsInternalManaged = useAppStore(
    (state: AppStoreType) => state.adAccountIsInternalManaged,
  );
  const adAccountIsExternalManaged = useAppStore(
    (state: AppStoreType) => state.adAccountIsExternalManaged,
  );

  const [initialCampaignName, setInitialCampaignName] = useState('');
  const [initialCampaignAdvertiserName, setInitialCampaignAdvertiserName] = useState('');
  const [initialCampaignBudget, setInitialCampaignBudget] = useState<number | undefined>();
  const [initialCampaignStartTimestamp, setInitialCampaignStartTimestamp] = useState('');
  const [initialCampaignEndTimestamp, setInitialCampaignEndTimestamp] = useState('');
  const [initialCampaignHasEnddate, setInitialCampaignHasEnddate] = useState('');

  const { timezoneDbName } = GetTimezoneObjFromEnum(organizationInfo.time_zone);

  useEffect(() => {
    setInitialCampaignName(formikInfo.values.campaignName);
    setInitialCampaignAdvertiserName(formikInfo.values.campaignAdvertiserName);
    setInitialCampaignBudget(parseInt(formikInfo.values.campaignBudgetCapUsd, 10));
    setInitialCampaignHasEnddate(formikInfo.values.campaignHasEndDate);
    const startDate = new Date(
      new Date(formikInfo.values.campaignStartTimestampMs).getTime() +
        GetTimezoneOffsetMs(timezoneDbName),
    );
    formikInfo.setFieldValue(
      editCampaignComponentModel.formField.campaignStartTimestampMs.name,
      startDate,
    );
    formikInfo.setFieldValue(
      editCampaignComponentModel.formField.campaignStartTime.name,
      startDate,
    );
    formikInfo.setFieldValue(
      editCampaignComponentModel.formField.campaignStartDate.name,
      formikInfo.values.campaignStartTimestampMs - getTimeDiffMs(startDate),
    );
    formikInfo.setFieldValue(
      editCampaignComponentModel.formField.campaignFormOpenedTime.name,
      Date.now(),
    );
    let endDate = new Date(
      new Date(formikInfo.values.campaignEndTimestampMs).getTime() +
        GetTimezoneOffsetMs(timezoneDbName),
    );
    setInitialCampaignEndTimestamp(formikInfo.values.campaignEndTimestampMs);
    if (formikInfo.values.campaignEndTimestampMs === 0) {
      // when user click the checkbox to set end date, we want to assign a valid default value
      endDate = new Date(Date.now());
      endDate.setHours(endDate.getHours() + 24);
    }
    formikInfo.setFieldValue(
      editCampaignComponentModel.formField.campaignEndTimestampMs.name,
      endDate,
    );
    formikInfo.setFieldValue(editCampaignComponentModel.formField.campaignEndTime.name, endDate);
    formikInfo.setFieldValue(
      editCampaignComponentModel.formField.campaignEndDate.name,
      new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()),
    );
    setInitialCampaignStartTimestamp(formikInfo.values.campaignStartTimestampMs);
    setInitialCampaignEndTimestamp(formikInfo.values.campaignEndTimestampMs);
  }, []);

  const isPaymentTypeAdCredit = paymentType === ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT;

  const isCampaignInfoUnchanged = () => {
    const isNameUnchanged = formikInfo.values.campaignName === initialCampaignName;
    const isAdvertiserNameUnchanged =
      formikInfo.values.campaignAdvertiserName === initialCampaignAdvertiserName;

    let isBudgetValueUnchanged = false;

    if (initialCampaignBudget) {
      isBudgetValueUnchanged =
        ToFixedNoRounding(formikInfo.values.campaignBudgetCapUsd, 2).toString() ===
        ToFixedNoRounding(initialCampaignBudget, 2).toString();
    }

    const parsedCampaignStartTimestamp = new Date(
      formikInfo.values.campaignStartTimestampMs,
    ).getTime();
    const parsedInitialCampaignStartTimestamp = new Date(initialCampaignStartTimestamp).getTime();
    const isStartTimestampUnchanged =
      parsedCampaignStartTimestamp === parsedInitialCampaignStartTimestamp;

    let isEndTimestampUnchanged;
    if (initialCampaignHasEnddate && formikInfo.values.campaignHasEndDate) {
      const parsedCampaignEndTimestamp = new Date(
        formikInfo.values.campaignEndTimestampMs,
      ).getTime();
      const parsedInitialCampaignEndTimestamp = new Date(initialCampaignEndTimestamp).getTime();
      isEndTimestampUnchanged = parsedCampaignEndTimestamp === parsedInitialCampaignEndTimestamp;
    } else {
      isEndTimestampUnchanged = !initialCampaignHasEnddate && !formikInfo.values.campaignHasEndDate;
    }

    const isUnchanged =
      isNameUnchanged &&
      isBudgetValueUnchanged &&
      isStartTimestampUnchanged &&
      isEndTimestampUnchanged &&
      isAdvertiserNameUnchanged;

    return isUnchanged;
  };

  useEffect(() => {
    // There's some timing contention between this check running and the formik validation running.
    // This setTimeout ensures AFTER values are changed one more check is done to validate all the fields
    setTimeout(() => {
      formikInfo.validateForm();
    }, 0);
  }, [formikInfo.values]);

  let shouldDisableSave = !formikInfo.isValid || disableEdit || isCampaignInfoUnchanged();
  if (isBusinessOrganization()) {
    shouldDisableSave = shouldDisableSave || formikInfo.values.campaignAdvertiserNameError !== '';
  }

  // We don't want to show the advertiser name field if the advertiser name was
  // not set for the campaign.
  const campaignHasAdvertiserName = formikInfo.values.campaignAdvertiserName !== '';

  // Disable cpv15 campaign end date update if CPV15 feature is disabled
  const shouldDisableEndDateInput = formikInfo.values.campaignObjective === 'VIDEO_VIEWS';

  return (
    <div className={mainContainer}>
      <div className={buttonContainer}>
        <Button className={cancelButton} color='primary' onClick={onCancelClick} variant='outlined'>
          Cancel
        </Button>
        <Button
          color='primaryBrand'
          disabled={shouldDisableSave}
          onClick={(e) => {
            e.preventDefault();
            formikInfo.handleSubmit(e);
            unifiedLogger.logClickEvent({
              eventName: EventName.SubmitEditButtonClicked,
              parameters: {
                entityType: ConvertEntityTypeEnumToString(EntityType.ENTITY_TYPE_CAMPAIGN),
              },
            });
          }}
          variant='contained'>
          Save
        </Button>
      </div>
      <div className={titleContainer}>
        <Typography variant='h2'>
          {disableEdit ? '' : 'Edit '}
          {initialCampaignName}
        </Typography>
      </div>
      {disableEdit && (
        <div className={warningContainer}>
          <Typography color='warning' variant='body2'>
            Cannot edit completed or auto-completed campaign.
          </Typography>
        </div>
      )}
      <CampaignObjectiveFormGroup
        disableInputs
        formikInfo={formikInfo}
        helperText=''
        onInputChange={noop}
      />
      <CampaignBudgetAndScheduleFormGroup
        adCreditBalance={adCreditBalance}
        creditCardPrechargeForAccountRequired={false} // TODO, can switch payment type? This is to make build work.
        disableBudgetSelection
        disableEndDateInput={isPaymentTypeAdCredit || disableEdit || shouldDisableEndDateInput}
        disableInputs={isPaymentTypeAdCredit || disableEdit}
        disablePaymentMethodInput
        disableStartDateInput={isPaymentTypeAdCredit || disableStartDateInput}
        enableBudgetWarning
        formikInfo={formikInfo}
        isAdAccountInternalOrManaged={adAccountIsInternalManaged() || adAccountIsExternalManaged()}
        isDefaultBillingTier={isDefaultBillingTier}
        organizationInfo={organizationInfo}
        paymentProfiles={paymentProfiles}
      />
      {isBusinessOrganization() && campaignHasAdvertiserName && (
        <CampaignAdvertiserNameFormGroup
          disableInputs={disableEdit}
          formikInfo={formikInfo}
          onInputKeyPress={() => {
            formikInfo.setFieldTouched(
              editCampaignComponentModel.formField.campaignAdvertiserName.name,
              true,
              true,
            );
          }}
        />
      )}
      <CampaignNameFormGroup
        disableInputs={disableEdit}
        formikInfo={formikInfo}
        onInputKeyPress={() => {
          formikInfo.setFieldTouched(
            editCampaignComponentModel.formField.campaignName.name,
            true,
            true,
          );
        }}
      />
    </div>
  );
};
