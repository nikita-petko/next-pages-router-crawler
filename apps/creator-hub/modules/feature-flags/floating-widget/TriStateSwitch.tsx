import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useThemeMode } from '@rbx/settings';
import cn from './strictly';

export type OverrideState = 'off' | 'auto' | 'on';

interface TriStateSwitchProps {
  value: OverrideState;
  onChange?: (value: OverrideState) => void;
  disabled?: boolean;
}

// Theme-aware color tokens
const themeColors = {
  light: {
    trackBg: '#ffffff',
    trackBorder: '#cbd5e1',
    trackShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
    knobOff: '#f87171',
    knobOn: '#4ade80',
  },
  dark: {
    trackBg: '#374151',
    trackBorder: '#4b5563',
    trackShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
    knobOff: '#ef4444',
    knobOn: '#22c55e',
  },
};

const stateTooltips: Record<OverrideState, string> = {
  off: 'Override to false',
  auto: 'Reset to no override',
  on: 'Override to true',
};

const TriStateSwitch: React.FC<TriStateSwitchProps> = ({ value, onChange, disabled }) => {
  const { themeMode } = useThemeMode();
  const isDark = themeMode === 'dark';
  const colors = isDark ? themeColors.dark : themeColors.light;

  const [hoveredState, setHoveredState] = useState<OverrideState | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const states: OverrideState[] = ['off', 'auto', 'on'];

  const handleMouseEnter = useCallback((e: React.MouseEvent, state: OverrideState) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
    setHoveredState(state);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredState(null);
  }, []);

  const getKnobPosition = () => {
    switch (value) {
      case 'off':
        return 0;
      case 'auto':
        return 16;
      case 'on':
        return 32;
      default:
        return 16;
    }
  };

  const getKnobColor = () => {
    switch (value) {
      case 'off':
        return colors.knobOff;
      case 'on':
        return colors.knobOn;
      case 'auto':
      default:
        return 'transparent';
    }
  };

  return (
    <div className={cn('flex', 'items-center', 'relative')} style={{ width: 48, height: 16 }}>
      {/* Track */}
      <div
        className={cn('absolute')}
        style={{
          inset: 0,
          backgroundColor: colors.trackBg,
          borderRadius: 8,
          border: `1px solid ${colors.trackBorder}`,
          boxShadow: colors.trackShadow,
        }}
      />
      {/* Knob */}
      <div
        className={cn('absolute')}
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: getKnobColor(),
          border: `1px solid ${colors.trackBorder}`,
          transform: `translateX(${getKnobPosition()}px)`,
          transition: 'all 0.3s ease-in-out',
        }}
      />
      {/* Clickable areas */}
      {!disabled &&
        states.map((state, index) => (
          <button
            key={state}
            type='button'
            className={cn('absolute')}
            onClick={() => onChange?.(state)}
            onMouseEnter={(e) => handleMouseEnter(e, state)}
            onMouseLeave={handleMouseLeave}
            aria-label={`Set override to ${state}`}
            style={{
              left: index * 16,
              width: 16,
              height: 16,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          />
        ))}
      {hoveredState &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              left: tooltipPos.x,
              top: tooltipPos.y - 6,
              transform: 'translate(-50%, -100%)',
              zIndex: 99999,
              backgroundColor: isDark ? '#1e1e1e' : '#1a1a1a',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 12,
              lineHeight: '16px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}>
            {stateTooltips[hoveredState]}
          </div>,
          document.body,
        )}
    </div>
  );
};

export default TriStateSwitch;
