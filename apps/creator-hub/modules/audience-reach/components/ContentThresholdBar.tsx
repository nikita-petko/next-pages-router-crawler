import { useEffect, useState, type FC } from 'react';
import { Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { ContentThresholdMaxScore } from '../constants/audienceReachConstants';
import { ThresholdBarColor } from '../types/audienceReach';

interface ContentThresholdBarProps {
  score: number;
  barColor: ThresholdBarColor;
}

const BarColorClasses: Record<ThresholdBarColor, string> = {
  [ThresholdBarColor.Green]: 'bg-system-success',
  [ThresholdBarColor.Yellow]: 'bg-system-warning',
  [ThresholdBarColor.Muted]: 'bg-system-neutral',
  [ThresholdBarColor.Blue]: 'bg-system-emphasis',
};

// Delay before opening the tooltip so Radix anchors after the percentage-width
// bar (and any surrounding layout) has fully settled on first paint.
const TooltipLayoutSettleDelayMs = 1000;

const ContentThresholdBar: FC<ContentThresholdBarProps> = ({ score, barColor }) => {
  const percentage = Math.min((score / ContentThresholdMaxScore) * 100, 100);

  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  useEffect(() => {
    const handle = setTimeout(() => setIsTooltipOpen(true), TooltipLayoutSettleDelayMs);
    return () => clearTimeout(handle);
  }, []);

  return (
    <div className='gap-xsmall margin-top-medium'>
      <div className='bg-surface-200 radius-small flex items-left w-full' style={{ height: '4px' }}>
        <div
          data-testid='threshold-bar-fill'
          data-color={barColor}
          className={`height-full radius-small ${BarColorClasses[barColor]}`}
          style={{ width: `${percentage}%` }}
        />
        <Tooltip
          open={isTooltipOpen}
          position='top-center'
          title={
            score >= ContentThresholdMaxScore ? `${ContentThresholdMaxScore}+` : String(score)
          }>
          <TooltipTrigger className='margin-none padding-none size-0 stroke-none'>
            <span />
          </TooltipTrigger>
        </Tooltip>
      </div>
      <div className='flex justify-between grow-0 shrink-0 padding-top-small'>
        <span className='text-body-medium'>0</span>
        <span className='text-body-medium'>{ContentThresholdMaxScore}</span>
      </div>
    </div>
  );
};

export default ContentThresholdBar;
