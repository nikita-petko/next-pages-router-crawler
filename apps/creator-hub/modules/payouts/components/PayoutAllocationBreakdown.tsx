import type { FunctionComponent } from 'react';
import { numberFormatter } from '@rbx/core';
import type { TTailwindPaddingLeftClass } from '@rbx/foundation-tailwind/classes';
import { useTranslation } from '@rbx/intl';
import { Typography, RobuxIcon, InfoOutlinedIcon } from '@rbx/ui';
import type {
  NormalizedEstimatedFiat,
  DevexWatermarkAllocation,
} from '@modules/devex/global/cashOut/utils/devexWatermarkUtil';
import { formatUsdPerRobuxRate } from '@modules/devex/global/cashOut/utils/devexWatermarkUtil';

export interface PayoutAllocationBreakdownProps {
  allocation: DevexWatermarkAllocation;
  normalizedWatermarks: NormalizedEstimatedFiat;
  breakdownLayout: {
    labelGrow: number;
    robuxGrow: number;
    robuxLeftPaddingClass: TTailwindPaddingLeftClass;
  };
}

const PayoutAllocationBreakdown: FunctionComponent<PayoutAllocationBreakdownProps> = ({
  allocation,
  normalizedWatermarks,
  breakdownLayout,
}) => {
  const { translate } = useTranslation();

  const o18Bucket = allocation.buckets.find((b) => b.key === 'O18');
  const r35Bucket = allocation.buckets.find((b) => b.key === 'R35');
  const r38Bucket = allocation.buckets.find((b) => b.key === 'R38');

  const showO18 =
    normalizedWatermarks.shouldDisplayEffectiveO18Robux && o18Bucket != null && o18Bucket.robux > 0;
  const showR35 = r35Bucket != null && r35Bucket.robux > 0;
  const showR38 = r38Bucket != null && r38Bucket.robux > 0;
  const showStandard = showR35 || showR38;

  if (!showO18 && !showStandard) {
    return null;
  }

  return (
    <div className='flex flex-col gap-medium padding-medium radius-medium bg-shift-100'>
      {showO18 && (
        <div className='flex flex-col gap-xsmall'>
          <Typography variant='h6'>{translate('Label.US18PlusRate')}</Typography>
          <div className='flex width-full min-width-0 items-start gap-medium'>
            <Typography
              variant='body2'
              className='flex min-width-0 basis-0 shrink-1 flex-col items-start'
              style={{ flexGrow: breakdownLayout.labelGrow }}>
              {translate('Label.EarnedAtRate', {
                rate: formatUsdPerRobuxRate(o18Bucket.rate),
              })}
            </Typography>
            <div
              className={`flex min-width-0 basis-0 shrink-1 flex-col items-start ${breakdownLayout.robuxLeftPaddingClass}`}
              style={{ flexGrow: breakdownLayout.robuxGrow }}>
              <span className='flex items-center gap-xsmall'>
                <RobuxIcon className='size-350' />
                <Typography variant='body2'>{o18Bucket.robux.toLocaleString()}</Typography>
              </span>
              <Typography variant='caption' className='font-semibold padding-left-xlarge'>
                {String(numberFormatter(o18Bucket.usd, 'currency'))}
              </Typography>
            </div>
          </div>
        </div>
      )}

      {showStandard && (
        <div className='flex flex-col gap-xsmall'>
          <Typography variant='h6'>{translate('Label.StandardRates')}</Typography>

          {showR35 && (
            <div className='flex flex-col gap-xsmall'>
              <div className='flex width-full min-width-0 items-start gap-medium'>
                <div
                  className='flex min-width-0 basis-0 shrink-1 flex-col items-start'
                  style={{ flexGrow: breakdownLayout.labelGrow }}>
                  <Typography variant='body2'>
                    {translate('Label.EarnedAtRate', {
                      rate: formatUsdPerRobuxRate(r35Bucket.rate),
                    })}
                  </Typography>
                  {showR38 && (
                    <span className='flex min-width-0 width-full items-start gap-xsmall'>
                      <InfoOutlinedIcon className='content-muted size-350 shrink-0' />
                      <Typography
                        variant='caption'
                        color='secondary'
                        className='text-caption-small min-width-0'>
                        {translate('Description.CashedOutBeforeRate', {
                          rate: formatUsdPerRobuxRate(r38Bucket.rate),
                        })}
                      </Typography>
                    </span>
                  )}
                </div>
                <div
                  className={`flex min-width-0 basis-0 shrink-1 flex-col items-start ${breakdownLayout.robuxLeftPaddingClass}`}
                  style={{ flexGrow: breakdownLayout.robuxGrow }}>
                  <span className='flex items-center gap-xsmall'>
                    <RobuxIcon className='size-350' />
                    <Typography variant='body2'>{r35Bucket.robux.toLocaleString()}</Typography>
                  </span>
                  <Typography variant='caption' className='font-semibold padding-left-xlarge'>
                    {String(numberFormatter(r35Bucket.usd, 'currency'))}
                  </Typography>
                </div>
              </div>
            </div>
          )}

          {showR38 && (
            <div className='flex width-full min-width-0 items-start gap-medium'>
              <Typography
                variant='body2'
                className='flex min-width-0 basis-0 shrink-1 flex-col items-start'
                style={{ flexGrow: breakdownLayout.labelGrow }}>
                {translate('Label.EarnedAtRate', {
                  rate: formatUsdPerRobuxRate(r38Bucket.rate),
                })}
              </Typography>
              <div
                className={`flex min-width-0 basis-0 shrink-1 flex-col items-start ${breakdownLayout.robuxLeftPaddingClass}`}
                style={{ flexGrow: breakdownLayout.robuxGrow }}>
                <span className='flex items-center gap-xsmall'>
                  <RobuxIcon className='size-350' />
                  <Typography variant='body2'>{r38Bucket.robux.toLocaleString()}</Typography>
                </span>
                <Typography variant='caption' className='font-semibold padding-left-xlarge'>
                  {String(numberFormatter(r38Bucket.usd, 'currency'))}
                </Typography>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PayoutAllocationBreakdown;
