import React, { useState } from 'react';
import { Button, Icon, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { COMPACT_TRANSITION_DURATION } from '../../layout/constants';
import { useRailContext } from '../../layout/providers/RailProvider';

/**
 * Collapse: label out → width shrinks to hover size → bg out / icon in.
 * Expand: icon out / bg in at hover size → width grows → label in.
 */
const TIME_50_MS = 50;
const FADE_DELAY_MS = COMPACT_TRANSITION_DURATION - TIME_50_MS;
const EXPAND_LABEL_DELAY_MS = TIME_50_MS + FADE_DELAY_MS;

const EASE_STANDARD_OUT = 'var(--ease-standard-out)';
const TIME_50 = 'var(--time-50)';

/** Delay before showing tooltip on hover to match rest of primary rail*/
const TOOLTIP_SHOW_DELAY_MS = 100;

type TUnauthSignInTransitionProps = {
  enableAnimation: boolean;
  onClick: () => void;
};

const UnauthSignInTransition: React.FC<TUnauthSignInTransitionProps> = ({
  enableAnimation,
  onClick,
}) => {
  const { iconOnly, isReady, shouldAnimate } = useRailContext();
  const { translate } = useTranslation();
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const expandedLabel = translate('Action.LogInAllTools');
  const collapsedLabel = translate('Action.LogIn');
  const showCollapsedChrome = iconOnly && !shouldAnimate;
  const showTooltip = showCollapsedChrome;

  // Clear hover-open when tooltips are disabled so expand doesn't leave it stuck open.
  if (!showTooltip && tooltipOpen) {
    setTooltipOpen(false);
  }

  // Sequenced delays use rail 225ms timing; easing + 50ms steps use Foundation tokens.
  const fillTransition = enableAnimation
    ? iconOnly
      ? `width ${FADE_DELAY_MS}ms ${EASE_STANDARD_OUT}, opacity ${TIME_50} ${EASE_STANDARD_OUT} ${FADE_DELAY_MS}ms`
      : `width ${FADE_DELAY_MS}ms ${EASE_STANDARD_OUT} ${TIME_50}, opacity ${TIME_50} ${EASE_STANDARD_OUT}`
    : 'none';
  const iconTransition = enableAnimation
    ? iconOnly
      ? `opacity ${TIME_50} ${EASE_STANDARD_OUT} ${FADE_DELAY_MS}ms`
      : `opacity ${TIME_50} ${EASE_STANDARD_OUT}`
    : 'none';
  const labelTransition = isReady
    ? iconOnly
      ? `opacity ${TIME_50} ${EASE_STANDARD_OUT}`
      : `opacity ${TIME_50} ${EASE_STANDARD_OUT} ${EXPAND_LABEL_DELAY_MS}ms`
    : 'none';

  const buttonEl = (
    <div className='relative width-full min-height-1000'>
      <div
        aria-hidden
        className={`absolute top-[0] left-[0] [z-index:0] height-1000 bg-action-standard radius-medium pointer-events-none ${
          iconOnly ? 'width-1000' : 'width-full'
        }`}
        style={{
          opacity: iconOnly ? 0 : 1,
          transition: fillTransition,
        }}
      />
      <Button
        variant='Standard'
        size='Medium'
        onClick={onClick}
        aria-label={iconOnly ? collapsedLabel : undefined}
        className='relative [z-index:1] width-full min-height-1000 height-1000 min-width-0 padding-none clip bg-none hover:bg-none active:bg-none'>
        <span
          aria-hidden
          className='absolute left-[var(--size-250)] top-[50%] size-500 [z-index:1] [transform:translateY(-50%)] flex items-center justify-center content-emphasis pointer-events-none'
          style={{
            opacity: iconOnly ? 1 : 0,
            transition: iconTransition,
          }}>
          <Icon name='icon-regular-arrow-right-to-portrait-rectangle' size='Medium' />
        </span>
        <span
          className={`relative [z-index:1] block width-full padding-x-medium text-label-medium text-truncate-end text-no-wrap content-action-standard ${
            iconOnly ? 'text-align-x-left' : 'text-align-x-center'
          }`}
          style={{
            opacity: iconOnly ? 0 : 1,
            transition: labelTransition,
          }}>
          {expandedLabel}
        </span>
      </Button>
    </div>
  );

  return (
    <div
      className={`flex width-full min-height-1000 items-center radius-medium ${
        showCollapsedChrome ? 'hover:bg-shift-200 active:bg-shift-300 content-emphasis' : ''
      }`}>
      {/* Keep Tooltip mounted so expand/collapse does not remount and drop CSS transitions. */}
      <Tooltip
        position='right-center'
        title={collapsedLabel}
        delayDurationMs={TOOLTIP_SHOW_DELAY_MS}
        hasBeak
        open={showTooltip && tooltipOpen}
        onOpenChange={(open) => {
          if (showTooltip) {
            setTooltipOpen(open);
          }
        }}>
        <TooltipTrigger asChild>{buttonEl}</TooltipTrigger>
      </Tooltip>
    </div>
  );
};

export default UnauthSignInTransition;
