import { AxiosError } from 'axios';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { ServerCampaignStatusType } from '@constants/campaign';
import DateFilteringTimePeriod from '@constants/dateFilteringTimePeriod';
import ReportingViewType from '@constants/reportingViewType';
import { getDateFilteredCampaigns } from '@services/ads/getEntitiesService';
import { Campaign } from '@type/campaign';
import { AutoReloadData } from '@type/payment';
import { NUMBER_OF_MS_IN_A_DAY } from '@utils/date';
import { CaptureException } from '@utils/error';
import { GetInitialRequestState, RequestStateType } from '@utils/zustandUtils';

const computeAutoReloadData = (campaigns: Campaign[]): AutoReloadData =>
  campaigns.reduce(
    (acc: AutoReloadData, campaign: Campaign) => {
      if (
        campaign.is_auto_reload_ad_credit_enabled &&
        campaign.status === ServerCampaignStatusType.ENABLED &&
        (campaign.end_timestamp_ms === 0 || campaign.end_timestamp_ms > Date.now())
      ) {
        let effectiveDailyBudget = 0;
        if (campaign.budget.daily_budget_micro_usd) {
          effectiveDailyBudget = campaign.budget.daily_budget_micro_usd;
        } else if (campaign.budget.lifetime_budget_micro_usd) {
          const durationInDays =
            (campaign.end_timestamp_ms - campaign.start_timestamp_ms) / NUMBER_OF_MS_IN_A_DAY;
          effectiveDailyBudget = campaign.budget.lifetime_budget_micro_usd / durationInDays;
        }
        return {
          num_auto_reload_campaigns: acc.num_auto_reload_campaigns + 1,
          total_daily_reload_amount: acc.total_daily_reload_amount + effectiveDailyBudget,
        };
      }
      return acc;
    },
    { num_auto_reload_campaigns: 0, total_daily_reload_amount: 0 },
  );

interface PaymentSettingsStoreStateType {
  autoReloadData: RequestStateType<AutoReloadData>;
  groupAutoReloadDataByGroupId: Record<number, RequestStateType<AutoReloadData>>;
}

interface PaymentSettingsStoreActionType {
  getAutoReloadData: (groupId?: number) => void;
}

interface PaymentSettingsStoreType
  extends PaymentSettingsStoreStateType, PaymentSettingsStoreActionType {}

export const usePaymentSettingsStore = create<PaymentSettingsStoreType>()(
  immer((set) => ({
    autoReloadData: GetInitialRequestState<AutoReloadData>({} as AutoReloadData),
    getAutoReloadData: async (groupId?: number) => {
      const setRequestState = (
        partial: Partial<RequestStateType<AutoReloadData>>,
        targetGroupId?: number,
      ) => {
        set((draft) => {
          if (targetGroupId !== undefined) {
            draft.groupAutoReloadDataByGroupId[targetGroupId] ??=
              GetInitialRequestState<AutoReloadData>({} as AutoReloadData);
            Object.assign(draft.groupAutoReloadDataByGroupId[targetGroupId], partial);
            return;
          }
          Object.assign(draft.autoReloadData, partial);
        });
      };

      try {
        setRequestState({ isError: false, isLoading: true }, groupId);
        const requestTimestamp = new Date().toISOString();

        const fetchedCampaigns = await getDateFilteredCampaigns({
          groupId,
          reportingView: ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT,
          requestTimestamp,
          timePeriod: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_TODAY,
        });

        let nextSerialCursor = fetchedCampaigns.next_cursor;
        let allCampaigns = fetchedCampaigns.campaigns || [];

        /* eslint-disable no-await-in-loop */
        while (nextSerialCursor) {
          const nextFetchedCampaigns = await getDateFilteredCampaigns({
            groupId,
            paginationOptions: { cursor: nextSerialCursor },
            reportingView: ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT,
            requestTimestamp,
            timePeriod: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_TODAY,
          });
          nextSerialCursor = nextFetchedCampaigns.next_cursor;
          allCampaigns = allCampaigns.concat(nextFetchedCampaigns.campaigns || []);
          if (!nextSerialCursor) {
            break;
          }
        }

        const data = computeAutoReloadData(allCampaigns);
        setRequestState({ data, isError: false, isLoading: false }, groupId);
      } catch (error) {
        setRequestState({ isError: true }, groupId);
        if (!(error instanceof AxiosError && error.response?.data?.error?.code)) {
          CaptureException(error as Error);
        }
      } finally {
        setRequestState({ isLoading: false }, groupId);
      }
    },

    groupAutoReloadDataByGroupId: {},
  })),
);
