import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo } from 'react';
import type { SinglePieSeries } from '@rbx/analytics-ui';
import { ChartColor, ChartStyleMode, PieChart } from '@rbx/analytics-ui';
import type { RobloxUsersApiGetUserResponse } from '@rbx/client-users/v1';
import { useTranslation } from '@rbx/intl';
import { useAuthentication } from '@modules/authentication/providers';
import type { TGroup } from '@modules/authentication/types';
import { groupPayoutColor } from '../constants/payoutsConstants';
import type { PayoutsBase } from '../interface/PayoutsFormType';
import { truncateString } from '../utils/payoutsUtils';

const PAYOUTS_DONUT_INNER_SIZE = '70%';
const PAYOUTS_CHART_HEIGHT = 360;
const PAYOUTS_CHART_BORDER_WIDTH = 2.5;

export type PayoutsChartProps = {
  payouts: PayoutsBase[];
  group: TGroup;
  groupPayoutPercentage: number;
  getUserInfo: (creatorId: string) => RobloxUsersApiGetUserResponse | null | undefined;
  getColor: (creatorId: string) => ChartColor | null | undefined;
  showLabels?: boolean;
  borderColor?: string;
  useOtherLabel?: boolean;
};

const PayoutsChart: FunctionComponent<PayoutsChartProps> = ({
  payouts,
  group,
  groupPayoutPercentage,
  getUserInfo,
  getColor,
  showLabels = false,
  borderColor,
  useOtherLabel,
}) => {
  const { translate } = useTranslation();
  const { user: currentUser } = useAuthentication();

  const sliceCount = payouts.length + (groupPayoutPercentage > 0 ? 1 : 0);

  const series = useMemo((): SinglePieSeries<string, number> => {
    const dataPoints: Array<[string, number]> = [];
    const dataPointColors: SinglePieSeries<string, number>['dataPointColors'] = [];

    if (groupPayoutPercentage > 0) {
      dataPoints.push([
        useOtherLabel ? translate('Label.Other') : group.name,
        groupPayoutPercentage,
      ]);
      dataPointColors.push(groupPayoutColor);
    }

    payouts
      .filter(
        (payout) => !Number.isNaN(payout.percentage) && Number.parseInt(payout.percentage, 10) > 0,
      )
      .forEach((payout) => {
        const userInfo = getUserInfo(payout.creatorId);
        const payoutColor = getColor(payout.creatorId) ?? ChartColor.Blue2;
        const showUserDetails = !useOtherLabel || payout.creatorId === currentUser?.id.toString();
        const userName = userInfo?.displayName ?? userInfo?.name ?? '';
        const seriesDataName = showUserDetails ? userName : translate('Label.Other');

        dataPoints.push([seriesDataName, Number.parseInt(payout.percentage, 10)]);
        dataPointColors.push(payoutColor);
      });

    return {
      name: translate('Label.Split'),
      dataPoints,
      dataPointColors,
    };
  }, [
    group.name,
    groupPayoutPercentage,
    payouts,
    getUserInfo,
    getColor,
    currentUser?.id,
    translate,
    useOtherLabel,
  ]);

  const tooltipFormatters = useMemo(
    () => ({
      formatSeriesKeyForSlice: ({ sliceName }: { sliceName: string }) => sliceName,
      formatSeriesValueForSlice: ({ percentage }: { percentage: number }) =>
        `${Math.round(percentage)}%`,
    }),
    [],
  );

  const formatDataLabel = useCallback(
    ({ category, percentage }: { category: string; percentage?: number }) =>
      `${truncateString(category)}\n${Math.round(percentage ?? 0)}%`,
    [],
  );

  return (
    <div className='relative margin-large'>
      <PieChart
        data={{ series }}
        tooltipFormatters={tooltipFormatters}
        formatDataLabel={showLabels ? formatDataLabel : undefined}
        dataLabelsOutside={showLabels}
        borderColor={borderColor}
        borderWidth={PAYOUTS_CHART_BORDER_WIDTH}
        chartStyleMode={ChartStyleMode.Minimal}
        height={PAYOUTS_CHART_HEIGHT}
        donut={{
          innerSize: PAYOUTS_DONUT_INNER_SIZE,
          centerLabel: String(sliceCount),
          centerSubLabel: translate('Title.TotalSplits'),
        }}
      />
    </div>
  );
};
export default React.memo(PayoutsChart);
