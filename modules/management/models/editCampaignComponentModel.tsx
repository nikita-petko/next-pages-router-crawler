import * as Yup from 'yup';

import { CampaignObjectiveType } from '@constants/campaignBuilder';
import { convertPaymentTypeServerToClient } from '@modules/clients/ads/serverClientTransformationUtilities';
import { TODOFIXANY } from 'app/shared/types';

import { BudgetType } from '../../clients/ads/adsClientTypes';
import { getCampaignValidationSchemaBase } from '../../creation/wizard/models/createCampaignWizard/createCampaignWizardModel';

export const editCampaignComponentModel = {
  formField: {
    campaignAdvertiserName: {
      label: 'Advertiser Name',
      name: 'campaignAdvertiserName',
      requiredErrorMsg: 'Advertiser name is required',
    },
    // used to check if advertiser name has error
    campaignAdvertiserNameError: {
      name: 'campaignAdvertiserNameError',
    },
    campaignBudgetCapUsd: {
      // Needs to be Daily or Lifetime
      label: 'Daily Budget',
      name: 'campaignBudgetCapUsd',
      requiredErrorMsg: 'Campaign budget is required',
    },
    campaignBudgetType: {
      label: 'Campaign Budget Type',
      name: 'campaignBudgetType',
    },
    // hold info for start date picker
    // time will be stored as 12:00am for the date
    campaignEndDate: {
      label: 'End Date',
      name: 'campaignEndDate',
      requiredErrorMsg: 'End date is required',
    },
    // hold info for start time picker
    campaignEndTime: {
      name: 'campaignEndTime',
      requiredErrorMsg: 'End time is required',
    },
    // final end time sent to server
    campaignEndTimestampMs: {
      label: 'End Date',
      name: 'campaignEndTimestampMs',
      requiredErrorMsg: 'End date is required',
    },
    // used to check if user picks datetime in the past
    campaignFormOpenedTime: {
      name: 'campaignFormOpenedTime',
    },
    // used to determine if user has set end date for campaign
    campaignHasEndDate: {
      name: 'campaignHasEndDate',
    },
    // used to hold original state of campaignHasEndDate
    campaignHasEndDateBeforeChange: {
      name: 'campaignHasEndDateBeforeChange',
    },
    // Not used when creating a new campaign
    campaignId: {
      label: 'Campaign Id',
      name: 'campaignId',
    },
    campaignName: {
      label: 'Campaign Name',
      name: 'campaignName',
      requiredErrorMsg: 'Campaign name is required',
    },
    campaignObjective: {
      label: 'Campaign Objective',
      name: 'campaignObjective',
      requiredErrorMsg: 'Campaign objective is required',
    },
    // type of payment used to create and run the campaign
    campaignPaymentMethod: {
      label: 'Payment Method',
      name: 'campaignPaymentMethod',
      requiredErrorMsg: 'Campaign Payment Method is required',
    },
    // hold info for start date picker
    // time will be stored as 12:00am for the date
    campaignStartDate: {
      label: 'Start Date',
      name: 'campaignStartDate',
      requiredErrorMsg: 'Start date is required',
    },
    // hold info for start time picker
    campaignStartTime: {
      name: 'campaignStartTime',
      requiredErrorMsg: 'Start time is required',
    },
    // final start time sent to server
    campaignStartTimestampMs: {
      label: 'Start Date',
      name: 'campaignStartTimestampMs',
      requiredErrorMsg: 'Start date is required',
    },
  },
  formId: 'editCampaignComponent',
};

const {
  formField: {
    campaignAdvertiserName,
    campaignAdvertiserNameError,
    campaignBudgetCapUsd,
    campaignBudgetType,
    campaignEndTimestampMs,
    campaignHasEndDate,
    campaignHasEndDateBeforeChange,
    campaignId,
    campaignName,
    campaignObjective,
    campaignPaymentMethod,
    campaignStartTimestampMs,
  },
} = editCampaignComponentModel;

interface EditCampaignComponentInitialValuesType {
  campaignAdvertiserName: string;
  campaignAdvertiserNameError: string;
  campaignBudgetCapUsd: number;
  campaignBudgetType: BudgetType;
  campaignEndDate: number;
  campaignEndTime: number;
  campaignEndTimestampMs: number;
  campaignHasEndDate: boolean;
  campaignHasEndDateBeforeChange: boolean;
  campaignId: string;
  campaignName: string;
  campaignObjective: CampaignObjectiveType;
  campaignPaymentMethod: number;
  campaignStartDate: number;
  campaignStartTime: number;
  campaignStartTimestampMs: number;
}

export function getEditCampaignInitialValues(
  row: TODOFIXANY,
): Partial<EditCampaignComponentInitialValuesType> {
  let campaignObjectiveVal;
  switch (row.objective.toUpperCase()) {
    case CampaignObjectiveType.VISITS:
      campaignObjectiveVal = CampaignObjectiveType.VISITS;
      break;
    case 'VIDEO VIEWS':
      campaignObjectiveVal = CampaignObjectiveType.VIDEO_VIEWS;
      break;
    case CampaignObjectiveType.AWARENESS:
    default:
      campaignObjectiveVal = CampaignObjectiveType.AWARENESS;
      break;
  }

  return {
    [campaignAdvertiserName.name]: row.advertiser_name,
    [campaignAdvertiserNameError.name]: '',
    [campaignBudgetCapUsd.name]: row.budgetUsd,
    [campaignBudgetType.name]:
      row.budget.daily_budget_micro_usd > 0 ? BudgetType.DAILY : BudgetType.LIFETIME,
    [campaignEndTimestampMs.name]: row.end_timestamp_ms,
    [campaignHasEndDate.name]: row.end_timestamp_ms > 0,
    [campaignHasEndDateBeforeChange.name]: row.end_timestamp_ms > 0,
    [campaignId.name]: row.id,
    [campaignName.name]: row.name,
    [campaignObjective.name]: campaignObjectiveVal,
    [campaignPaymentMethod.name]: convertPaymentTypeServerToClient(row.payment_type),
    [campaignStartTimestampMs.name]: row.start_timestamp_ms,
  };
}

export function getEditCampaignValidationSchema(
  dailyMaxBudgetUsd: number,
  isAdAccountManaged: boolean,
  isAdAccountInternal: boolean,
  campaignMinimumDailyBudgetUsd: number,
  timeZone: string,
) {
  return Yup.object().shape({
    ...getCampaignValidationSchemaBase(
      dailyMaxBudgetUsd,
      isAdAccountManaged,
      isAdAccountInternal,
      campaignMinimumDailyBudgetUsd,
      timeZone,
    ),
  });
}
