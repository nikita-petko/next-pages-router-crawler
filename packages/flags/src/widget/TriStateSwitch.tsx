import React, { type CSSProperties, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from 'motion/react';
import { clsx } from '@rbx/foundation-ui';

const overrideStates = ['off', 'auto', 'on'] as const;
export type OverrideState = (typeof overrideStates)[number];

type TriStateSwitchProps = {
  value: OverrideState;
  onChange?: (value: OverrideState) => void;
  disabled?: boolean;
};

type TooltipState = {
  state: OverrideState;
  x: number;
  y: number;
};

const TRACK_WIDTH = 48;
const TRACK_HEIGHT = 16;
// Inset the knob slightly so it sits inside the track instead of bulging over
// the top/bottom edges. The knob uses border-box sizing so its 1px border does
// not add to the rendered height.
const KNOB_SIZE = 12;
const KNOB_INSET = (TRACK_HEIGHT - KNOB_SIZE) / 2;
const KNOB_TRAVEL = (TRACK_WIDTH - KNOB_SIZE) / 2 - KNOB_INSET;

// A sliding knob is essentially a mini drawer, so it settles best with the
// iOS-style drawer curve rather than a generic ease-in-out.
const KNOB_SLIDE_TRANSITION = 'transform 140ms cubic-bezier(0.23, 1, 0.32, 1)';
const KNOB_COLOR_TRANSITION = 'background-color 120ms ease, border-color 120ms ease';
const TOOLTIP_ENTER_TRANSITION =
  'opacity 140ms ease-out, transform 140ms cubic-bezier(0.23, 1, 0.32, 1)';

const trackColors = {
  background: '#ffffff',
  border: '#cbd5e1',
  shadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
  off: '#f87171',
  on: '#4ade80',
};

const stateTooltips: Record<OverrideState, string> = {
  off: 'Override to false',
  auto: 'Reset to no override',
  on: 'Override to true',
};

const containerStyle: CSSProperties = {
  width: TRACK_WIDTH,
  height: TRACK_HEIGHT,
};

const trackStyle: CSSProperties = {
  inset: 0,
  backgroundColor: trackColors.background,
  borderRadius: TRACK_HEIGHT / 2,
  border: `1px solid ${trackColors.border}`,
  boxShadow: trackColors.shadow,
};

const hitTargetStyle: CSSProperties = {
  width: TRACK_WIDTH / overrideStates.length,
  height: TRACK_HEIGHT,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
};

const getKnobPosition = (value: OverrideState): number => {
  if (value === 'off') {
    return 0;
  }
  if (value === 'on') {
    return KNOB_TRAVEL * 2;
  }
  return KNOB_TRAVEL;
};

const getKnobColor = (value: OverrideState): string => {
  if (value === 'off') {
    return trackColors.off;
  }
  if (value === 'on') {
    return trackColors.on;
  }
  return 'transparent';
};

function useTooltipState() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [tooltipReady, setTooltipReady] = useState(false);

  const handleMouseEnter = useCallback((event: React.MouseEvent, state: OverrideState) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({ state, x: rect.left + rect.width / 2, y: rect.top });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  useEffect(() => {
    if (tooltip === null) {
      setTooltipReady(false);
      return undefined;
    }

    // Two frames, not one: the first lets the hidden initial styles paint, the
    // second flips to the visible state so the CSS transition has two distinct
    // states to interpolate. A single frame can land in the same paint as the
    // mount, making the tooltip pop in at full size instead of animating.
    let innerRaf = 0;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => setTooltipReady(true));
    });

    return () => {
      cancelAnimationFrame(outerRaf);
      cancelAnimationFrame(innerRaf);
    };
  }, [tooltip]);

  return { tooltip, tooltipReady, handleMouseEnter, handleMouseLeave };
}

function TooltipPortal({
  tooltip,
  ready,
  reduceMotion,
}: {
  tooltip: TooltipState | null;
  ready: boolean;
  reduceMotion: boolean | null;
}) {
  if (tooltip === null || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: tooltip.x,
        top: tooltip.y - 6,
        transformOrigin: 'bottom center',
        transform: `translate(-50%, -100%) scale(${ready || reduceMotion ? 1 : 0.96})`,
        opacity: ready ? 1 : 0,
        transition: reduceMotion ? 'opacity 140ms ease-out' : TOOLTIP_ENTER_TRANSITION,
        zIndex: 99999,
        backgroundColor: '#1a1a1a',
        color: '#fff',
        padding: '4px 8px',
        borderRadius: 4,
        fontSize: 12,
        lineHeight: '16px',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
      }}>
      {stateTooltips[tooltip.state]}
    </div>,
    document.body,
  );
}

const TriStateSwitch: React.FC<TriStateSwitchProps> = ({ value, onChange, disabled }) => {
  const reduceMotion = useReducedMotion();
  const { tooltip, tooltipReady, handleMouseEnter, handleMouseLeave } = useTooltipState();

  const knobTransition = reduceMotion
    ? KNOB_COLOR_TRANSITION
    : `${KNOB_SLIDE_TRANSITION}, ${KNOB_COLOR_TRANSITION}`;

  const knobStyle = useMemo<CSSProperties>(
    () => ({
      width: KNOB_SIZE,
      height: KNOB_SIZE,
      top: KNOB_INSET,
      left: KNOB_INSET,
      boxSizing: 'border-box',
      borderRadius: KNOB_SIZE / 2,
      backgroundColor: getKnobColor(value),
      border: `1px solid ${trackColors.border}`,
      transform: `translate3d(${getKnobPosition(value)}px, 0, 0)`,
      transition: knobTransition,
      // Keep the knob on its own GPU layer so the slide stays smooth even when
      // the main thread is busy (e.g. the widget's expand animation running as
      // you hover in to toggle).
      willChange: reduceMotion ? undefined : 'transform',
      backfaceVisibility: 'hidden',
    }),
    [knobTransition, reduceMotion, value],
  );

  const handleStateClick = useCallback(
    (state: OverrideState) => {
      if (disabled || onChange === undefined || state === value) {
        return;
      }

      onChange(state);
    },
    [disabled, onChange, value],
  );

  return (
    <div className={clsx('flex', 'items-center', 'relative')} style={containerStyle}>
      <div className={clsx('absolute')} style={trackStyle} />
      <div className={clsx('absolute')} style={knobStyle} />
      {!disabled &&
        overrideStates.map((state, index) => (
          <button
            key={state}
            type='button'
            className={clsx('absolute')}
            onClick={() => handleStateClick(state)}
            onMouseEnter={(event) => handleMouseEnter(event, state)}
            onMouseLeave={handleMouseLeave}
            aria-label={`Set override to ${state}`}
            style={{
              ...hitTargetStyle,
              left: index * (TRACK_WIDTH / overrideStates.length),
            }}
          />
        ))}
      <TooltipPortal tooltip={tooltip} ready={tooltipReady} reduceMotion={reduceMotion} />
    </div>
  );
};

export default TriStateSwitch;
