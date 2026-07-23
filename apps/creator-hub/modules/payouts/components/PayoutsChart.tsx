import React, { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact, { HighchartsReactRefObject } from 'highcharts-react-official';
import { RobloxUsersApiGetUserResponse } from '@rbx/clients/users';
import type { TGroup } from '@modules/authentication/types';
import { useAuthentication } from '@modules/authentication/providers';
import { Grid, Typography, makeStyles, useTheme } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
// eslint-disable-next-line no-restricted-imports -- using chart colors
import { PayoutsBase } from '../interface/PayoutsFormType';
import PayoutColorType from '../interface/PayoutColorType';
import { PayoutColorTypeToHexMap, groupPayoutColor } from '../constants/payoutsConstants';
import { getPayoutChartThemedColors, truncateString } from '../utils/payoutsUtils';

interface OverlayPosition {
  x: number;
  y: number;
  height: number;
  width: number;
}

const MIN_CHART_WIDTH = 175;

const usePayoutsChartStyles = makeStyles<{ overlayPositionString?: string }>()((
  theme,
  { overlayPositionString },
) => {
  const overlayPosition: OverlayPosition | undefined = overlayPositionString
    ? JSON.parse(overlayPositionString)
    : undefined;
  return {
    container: {
      position: 'relative',
      margin: 24,
    },

    overlay: {
      position: 'absolute',
      height: '100%',
      width: '100%',
    },

    overlayText: {
      position: 'absolute',
      height: overlayPosition ? overlayPosition.height : '100%',
      width: overlayPosition ? overlayPosition.width : '100%',
      top: overlayPosition ? overlayPosition.y : 0,
      left: overlayPosition ? overlayPosition.x : 0,
    },

    overlayLabel: {
      textAlign: 'center',
    },

    overlayTitle: {
      color: theme.palette.content.muted,
    },

    highchartContainer: {
      width: '100%',
    },
  };
});

export type PayoutsChartProps = {
  payouts: PayoutsBase[];
  group: TGroup;
  groupPayoutPercentage: number;
  getUserInfo: (creatorId: string) => RobloxUsersApiGetUserResponse | null | undefined;
  getColor: (creatorId: string) => PayoutColorType | null | undefined;
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
  const [overlayPositionString, setOverlayPositionString] = useState<string | undefined>();
  const {
    classes: { container, overlay, overlayText, overlayLabel, overlayTitle, highchartContainer },
    cx,
  } = usePayoutsChartStyles({ overlayPositionString });

  const { translate } = useTranslation();
  const { user: currentUser } = useAuthentication();

  const theme = useTheme();
  const { tooltipText, background } = getPayoutChartThemedColors(theme);

  const highchartsRef = useRef<HighchartsReactRefObject>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const seriesData = useMemo(() => {
    const series = [
      ...payouts
        .filter(
          (payout) =>
            !Number.isNaN(payout.percentage) && Number.parseInt(payout.percentage, 10) > 0, // Filter out invalid percentages and zeros
        )
        .map((payout) => {
          const userInfo = getUserInfo(payout.creatorId);
          const payoutColor = getColor(payout.creatorId) ?? PayoutColorType.LightBlue;

          const showUserDetails = !useOtherLabel || payout.creatorId === currentUser?.id.toString();

          const userName = userInfo?.displayName ?? userInfo?.name ?? '';
          const seriesDataName = showUserDetails ? userName : translate('Label.Other');

          return {
            name: seriesDataName,
            label: truncateString(seriesDataName),
            y: Number.parseInt(payout.percentage, 10),
            color: `#${PayoutColorTypeToHexMap.get(payoutColor)}`,
          };
        }),
    ];

    if (groupPayoutPercentage > 0) {
      // If group receives a payout, add it to the beginning of series
      series.unshift({
        name: group.name,
        label: useOtherLabel ? translate('Label.Other') : truncateString(group.name),
        y: groupPayoutPercentage,
        color: `#${PayoutColorTypeToHexMap.get(groupPayoutColor)}`,
      });
    }

    return series;
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

  const subtitle = useMemo(() => {
    return (
      <Grid
        container
        className={overlayText}
        justifyContent='center'
        align-items='center'
        direction='column'
        wrap='wrap'>
        <Typography variant='h6' className={cx(overlayLabel, overlayTitle)}>
          {translate('Title.TotalSplits')}
        </Typography>

        <Typography variant='h1' className={overlayLabel}>
          {payouts.length + (groupPayoutPercentage > 0 ? 1 : 0)}
        </Typography>
      </Grid>
    );
  }, [
    overlayText,
    cx,
    overlayLabel,
    overlayTitle,
    translate,
    payouts.length,
    groupPayoutPercentage,
  ]);

  const options: Highcharts.Options = useMemo(() => {
    return {
      chart: {
        type: 'pie',
        backgroundColor: undefined,
      },

      title: { style: { display: 'none' } },

      credits: { enabled: false },

      tooltip: {
        headerFormat: '{point.key}<br>',
        pointFormat: '{series.name}: <b>{point.percentage:.0f}%</b>',
      },

      accessibility: {
        point: {
          valueSuffix: '%',
        },
      },

      plotOptions: {
        pie: {
          allowPointSelect: true,
          borderWidth: 2.5,
          borderColor: borderColor ?? background,
          cursor: 'pointer',
          dataLabels: {
            enabled: showLabels,
            format: '<b>{point.label}</b><br>{point.percentage:.0f}%',
            style: {
              color: tooltipText,
              fontSize: '14px',
              fontWeight: '300',
              textOverflow: 'ellipsis',
              overflow: 'allow',
            },
            useHTML: true,
          },
        },
        series: {
          innerSize: '70%',
          borderRadius: 5,
          borderWidth: 1,
        },
      },

      series: [
        {
          type: 'pie',
          name: translate('Label.Split'),
          data: seriesData,
        },
      ],
    };
  }, [borderColor, background, showLabels, tooltipText, translate, seriesData]);

  const onHighchartsRender = useCallback((chartContainer: HTMLDivElement) => {
    if (!overlayRef.current || chartContainer.children.length === 0) return;

    const seriesElements = document.getElementsByClassName('highcharts-series-group');

    if (seriesElements.length === 0) return;

    const series = seriesElements[0];
    const { parentElement } = series;

    if (!parentElement) return;

    const seriesRect = series.getBoundingClientRect();
    const parentRect = parentElement.getBoundingClientRect();

    // There might be a difference between overlay parent size and highcharts container size
    // We need to offset the overlay position to center it on the pie chart
    const highchartsContainerRect = chartContainer.getBoundingClientRect();

    const overlayRect = overlayRef.current.getBoundingClientRect();
    const xDiff = overlayRect.width - highchartsContainerRect.width;
    const yDiff = overlayRect.height - highchartsContainerRect.height;
    const xOffset = xDiff / 2;
    const yOffset = yDiff / 2;

    // Calculate the positions so that they are relative to the parent element, not the entire body
    const xRelative = seriesRect.x - parentRect.x;
    const yRelative = seriesRect.y - parentRect.y;

    // Calculate the final positions
    const xPos = xRelative + xOffset;
    const yPos = yRelative + yOffset;
    const { width, height } = seriesRect;

    if (width < 1 || height < 1) return;

    // If chart is too small, do now show the overlay
    if (width < MIN_CHART_WIDTH) {
      setOverlayPositionString(undefined);
      return;
    }

    const newPosition = {
      x: xPos,
      y: yPos,
      height,
      width,
    };

    setOverlayPositionString(JSON.stringify(newPosition));
  }, []);

  // When highchart renders, we need to calculate the position of the subtitle overlay
  useEffect(() => {
    if (!highchartsRef.current?.chart || !highchartsRef.current.container.current) return () => {};

    const { chart } = highchartsRef.current;
    const { current: chartContainer } = highchartsRef.current.container;

    const callback = () => onHighchartsRender(chartContainer);

    // Bind to events that might change the chart size
    Highcharts.addEvent(chart, 'render', callback);
    Highcharts.addEvent(Highcharts.Series, 'afterAnimate', callback);
    window.addEventListener('resize', callback);

    return () => {
      Highcharts.removeEvent(chart, 'render', callback);
      Highcharts.removeEvent(Highcharts.Series, 'afterAnimate', callback);
      window.removeEventListener('resize', callback);
    };
  }, [onHighchartsRender]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!highchartsRef.current?.container.current) {
        return;
      }

      onHighchartsRender(highchartsRef.current.container.current);
    }, 1400);
    return () => {
      clearTimeout(timer);
    };
  }, [onHighchartsRender]);

  return (
    <Grid container className={container} justifyContent='center'>
      <Grid container className={overlay} ref={overlayRef}>
        {overlayPositionString !== undefined && subtitle}
      </Grid>

      <HighchartsReact
        ref={highchartsRef}
        highcharts={Highcharts}
        options={options}
        allowChartUpdate
        containerProps={{ id: 'highcharts', className: highchartContainer }}
      />
    </Grid>
  );
};
export default React.memo(PayoutsChart);
