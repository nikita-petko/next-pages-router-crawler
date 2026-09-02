import type { FunctionComponent } from 'react';
import { Divider, Link } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Typography, RobuxIcon, Tooltip, InfoOutlinedIcon } from '@rbx/ui';
import type { DevexWatermarkAllocation } from '@modules/devex/global/cashOut/utils/devexWatermarkUtil';
import { formatUsdPerRobuxRate } from '@modules/devex/global/cashOut/utils/devexWatermarkUtil';
import { RATE_DIVISOR, devexHelpUrl } from '../constants/payoutsConstants';

const formatRateTooltip = (rate: number) => (
  <span className='items-center gap-xsmall inline-flex'>
    <RobuxIcon className='size-350' />
    {`${RATE_DIVISOR.toLocaleString()} = $${Math.round(rate * RATE_DIVISOR)} USD`}
  </span>
);

export interface GroupFundsWatermarkBreakdownProps {
  allocation: DevexWatermarkAllocation;
  showO18: boolean;
}

const GroupFundsWatermarkBreakdown: FunctionComponent<GroupFundsWatermarkBreakdownProps> = ({
  allocation,
  showO18,
}) => {
  const { translate } = useTranslation();

  const o18Bucket = allocation.buckets.find((b) => b.key === 'O18');
  const r35Bucket = allocation.buckets.find((b) => b.key === 'R35');
  const r38Bucket = allocation.buckets.find((b) => b.key === 'R38');

  const hasO18 = showO18 && o18Bucket != null && o18Bucket.robux > 0;
  const hasR35 = r35Bucket != null && r35Bucket.robux > 0;
  const hasR38 = r38Bucket != null && r38Bucket.robux > 0;
  const hasStandard = hasR35 || hasR38;

  return (
    <div className='margin-top-medium flex flex-col gap-medium radius-medium padding-medium stroke-standard stroke-default'>
      <div className='flex flex-col gap-xsmall'>
        <Typography variant='h6'>{translate('Title.EarnedRates')}</Typography>
        <Typography variant='body2' color='secondary'>
          {translate('Description.EarnedRatesExplanation')}
        </Typography>
      </div>

      {hasO18 && (
        <div className='flex flex-col gap-small'>
          <Typography variant='h6'>{translate('Label.US18PlusRate')}</Typography>
          <div className='flex flex-col'>
            <span className='flex items-center gap-xsmall'>
              <Typography variant='body2'>
                {translate('Label.EligibleAtRate', {
                  rate: formatUsdPerRobuxRate(o18Bucket.rate),
                })}
              </Typography>
              <Tooltip title={formatRateTooltip(o18Bucket.rate)} placement='right'>
                <InfoOutlinedIcon className='content-muted size-350' />
              </Tooltip>
            </span>
            <span className='flex items-center gap-xsmall'>
              <RobuxIcon className='size-400' />
              <Typography variant='smallLabel2'>
                {Math.round(o18Bucket.robux).toLocaleString()}
              </Typography>
            </span>
          </div>
        </div>
      )}

      {hasStandard && (
        <div className='flex flex-col gap-small'>
          <Typography variant='h6'>{translate('Label.StandardRates')}</Typography>

          {hasR35 && (
            <div className='flex flex-col'>
              <span className='flex items-center gap-xsmall'>
                <Typography variant='body2'>
                  {translate('Label.EligibleAtRate', {
                    rate: formatUsdPerRobuxRate(r35Bucket.rate),
                  })}
                </Typography>
                <Tooltip title={formatRateTooltip(r35Bucket.rate)} placement='right'>
                  <InfoOutlinedIcon className='content-muted size-350' />
                </Tooltip>
              </span>
              <span className='flex items-center gap-xsmall'>
                <RobuxIcon className='size-400' />
                <Typography variant='smallLabel2'>
                  {Math.round(r35Bucket.robux).toLocaleString()}
                </Typography>
              </span>
              {hasR38 && (
                <span className='flex items-center gap-xsmall'>
                  <InfoOutlinedIcon className='content-muted size-400' />
                  <Typography variant='caption' color='secondary'>
                    {translate('Description.CashedOutBeforeRate', {
                      rate: formatUsdPerRobuxRate(r38Bucket.rate),
                    })}
                  </Typography>
                </span>
              )}
            </div>
          )}

          {hasR38 && (
            <div className='flex flex-col'>
              <span className='flex items-center gap-xsmall'>
                <Typography variant='body2'>
                  {translate('Label.EligibleAtRate', {
                    rate: formatUsdPerRobuxRate(r38Bucket.rate),
                  })}
                </Typography>
                <Tooltip title={formatRateTooltip(r38Bucket.rate)} placement='right'>
                  <InfoOutlinedIcon className='content-muted size-350' />
                </Tooltip>
              </span>
              <span className='flex items-center gap-xsmall'>
                <RobuxIcon className='size-400' />
                <Typography variant='smallLabel2'>
                  {Math.round(r38Bucket.robux).toLocaleString()}
                </Typography>
              </span>
            </div>
          )}
        </div>
      )}

      <div className='flex flex-col gap-medium'>
        <Divider />
        <span className='flex items-center gap-xsmall'>
          <InfoOutlinedIcon className='content-muted size-400' />
          <Typography variant='caption' color='secondary'>
            {translate('Description.EligibleRatesDisclaimer')}{' '}
            <Link
              href={devexHelpUrl}
              target='_blank'
              underline='always'
              color='Standard'
              isExternal={false}>
              {translate('Action.LearnMore')}
            </Link>
          </Typography>
        </span>
      </div>
    </div>
  );
};

export default GroupFundsWatermarkBreakdown;
