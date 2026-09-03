import type { FunctionComponent } from 'react';
import React, { useState, useEffect, useCallback } from 'react';
import { numberFormatter } from '@rbx/core';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { Button, Grid, Typography, Link, RobuxIcon, CircularProgress } from '@rbx/ui';
import { shouldUseWatermarkFiatCalculation } from '@generated/flags/devex';
import billingClient from '@modules/clients/billing';
import type { GetDevExInfoResponse } from '@modules/clients/economy';
import {
  allocateDevexWatermarkBuckets,
  normalizeEstimatedFiatResponse,
  resolveHeadlineUsdForRobuxAmount,
  type NormalizedEstimatedFiat,
} from '../../cashOut/utils/devexWatermarkUtil';
import { SETTINGS_URL } from '../../constants/externalLinkConstants';
import { useGetDevexEligibleRobux } from '../../queries/useGetDevexEligibleRobux';
import { isCashOutBlockedBySuspension, isDevExSuspended } from '../utils/devexEligibility';
import useCashOutBoxStyles from './CashOutBox.styles';
import EarnedRatesDialog from './EarnedRatesDialog';
import ProgressCircle from './ProgressCircle';

interface CashOutBoxProps {
  userRobux?: number;
  cashoutInfo: GetDevExInfoResponse;
  onCashoutClick: () => void;
}

const CashOutBox: FunctionComponent<React.PropsWithChildren<CashOutBoxProps>> = ({
  userRobux,
  cashoutInfo,
  onCashoutClick,
}) => {
  const {
    classes: {
      root,
      leftContainer,
      robuxAmount,
      robuxAmountValueContainer,
      robuxAmountNumber,
      cashoutUsdAmountText,
      iconBig,
      iconLink,
    },
  } = useCashOutBoxStyles();

  const { translate, translateHTML } = useTranslation();

  const { data: devexEligibleData, isSuccess: isEligibleRobuxLoaded } = useGetDevexEligibleRobux();

  const [estimate, setEstimate] = useState<NormalizedEstimatedFiat | undefined>();
  const [ratesDialogOpen, setRatesDialogOpen] = useState(false);
  const openRatesDialog = useCallback(() => setRatesDialogOpen(true), []);
  const closeRatesDialog = useCallback(() => setRatesDialogOpen(false), []);

  useEffect(() => {
    if (!isEligibleRobuxLoaded) {
      return () => {};
    }

    const estimateRobuxAmount = devexEligibleData?.eligibleRobux ?? userRobux ?? 0;
    let cancelled = false;
    const fetchEstimate = async () => {
      try {
        const response = await billingClient.DevexAPI.v1EstimatedFiatGet({
          robuxAmount: estimateRobuxAmount,
        });
        const normalized = normalizeEstimatedFiatResponse(response);
        if (!cancelled) {
          setEstimate(normalized);
        }
      } catch {
        // leave estimate undefined; display falls back gracefully
      }
    };
    void fetchEstimate();
    return () => {
      cancelled = true;
    };
  }, [userRobux, devexEligibleData, isEligibleRobuxLoaded]);

  const { value: isWatermarkFiatCalculationEnabled } = useFlag(shouldUseWatermarkFiatCalculation);

  const cashoutUsdAmount = (() => {
    if (estimate === undefined) {
      return undefined;
    }
    if (isWatermarkFiatCalculationEnabled) {
      const eligibleRobux = devexEligibleData?.eligibleRobux ?? 0;
      const allocation = allocateDevexWatermarkBuckets(eligibleRobux, estimate);
      const usd = resolveHeadlineUsdForRobuxAmount(eligibleRobux, allocation);
      return String(numberFormatter(usd, 'currency'));
    }
    return String(numberFormatter(estimate.usdAmountMicro / 1_000_000, 'currency'));
  })();

  const devexEligiblePercentage =
    devexEligibleData?.eligibleRobux !== undefined
      ? Math.min(
          Math.floor(
            (devexEligibleData.eligibleRobux * 100) / (cashoutInfo?.minRobuxToCashOut ?? 30000),
          ),
          100,
        )
      : undefined;

  const getStatusMessage = () => {
    if (isDevExSuspended(cashoutInfo)) {
      return translate('Message.DevExSuspendedStatus');
    }
    if (
      cashoutInfo.canProceedToCashout &&
      (devexEligiblePercentage === undefined || devexEligiblePercentage === 100)
    ) {
      return translate('Message.CashOutEligible');
    }
    if (cashoutInfo.lastImbursementStatus === 'Completed') {
      return translate('Message.CashOutRecentRequestV2');
    }
    if (!cashoutInfo.emailIsVerified) {
      return translateHTML('Message.MissingEmail2FA', [
        {
          opening: 'settingsLinkStart',
          closing: 'settingsLinkEnd',
          // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
          // responsible for triaging issue.
          content(chunks) {
            return (
              <Link href={SETTINGS_URL} target='_blank'>
                {chunks}
              </Link>
            );
          },
        },
      ]);
    }
    if (cashoutInfo.isImbursementBlacklistUser) {
      return translate('Message.CashoutIneligibleV2');
    }
    if (
      (cashoutInfo.percentRobux !== undefined && cashoutInfo.percentRobux < 100) ||
      (devexEligiblePercentage !== undefined && devexEligiblePercentage < 100)
    ) {
      return translate('Message.CashOutInsufficientBalance');
    }
    return translate('Message.CashoutIneligibleV2');
  };

  return (
    <Grid className={root} container spacing={1} data-testid='devex-cash-out-box'>
      <Grid item className={leftContainer}>
        <ProgressCircle
          progress={devexEligiblePercentage ?? cashoutInfo.percentRobux ?? 0}
          showRing={
            (cashoutInfo.emailIsVerified &&
              cashoutInfo.lastImbursementStatus !== 'Completed' &&
              !cashoutInfo.isImbursementBlacklistUser &&
              !(cashoutInfo.percentRobux === 100 && !cashoutInfo.canProceedToCashout)) ??
            false
          }
        />
        <Grid item container direction='column'>
          <Typography variant='body1' color='secondary'>
            {getStatusMessage()}
          </Typography>
          <Grid item container className={robuxAmount}>
            <RobuxIcon className={iconBig} />
            <Grid item className={robuxAmountValueContainer}>
              {isEligibleRobuxLoaded ? (
                <>
                  <Typography variant='h3' color='primary' className={robuxAmountNumber}>
                    {translateHTML('Label.RobuxEligible', [
                      {
                        opening: 'robuxStart',
                        closing: 'robuxEnd',
                        content: () => (devexEligibleData?.eligibleRobux ?? 0).toLocaleString(),
                      },
                    ])}
                  </Typography>
                  {cashoutUsdAmount !== undefined && (
                    <Typography className={cashoutUsdAmountText}>{cashoutUsdAmount}</Typography>
                  )}
                </>
              ) : (
                <CircularProgress size={28} data-testid='devex-eligible-robux-loading' />
              )}
            </Grid>
            <Link component='button' onClick={openRatesDialog} className={iconLink}>
              <Typography color='inherit' variant='caption'>
                {translate('Label.ViewRates')}
              </Typography>
            </Link>
          </Grid>
        </Grid>
      </Grid>
      <Grid item XSmall={12} Medium='auto'>
        <Button
          fullWidth
          variant='contained'
          color='primaryBrand'
          onClick={onCashoutClick}
          disabled={!cashoutInfo.canProceedToCashout || isCashOutBlockedBySuspension(cashoutInfo)}
          data-testid='devex-form-open-button'>
          {translate('Action.CashOut')}
        </Button>
      </Grid>
      <EarnedRatesDialog
        open={ratesDialogOpen}
        onClose={closeRatesDialog}
        o18Rate={estimate?.effectiveO18ToUsdRate}
        r35Rate={estimate?.robuxAt35ToUsdRate}
        r38Rate={estimate?.robuxAt38ToUsdRate}
        showO18={estimate?.shouldDisplayEffectiveO18Robux}
      />
    </Grid>
  );
};

export default CashOutBox;
