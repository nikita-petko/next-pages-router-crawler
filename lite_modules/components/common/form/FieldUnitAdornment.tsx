import type { ReactNode } from 'react';

interface FieldUnitAdornmentProps {
  children: ReactNode;
}

/**
 * Renders a unit such as "Ad Credit", "Calendar days" or "%" inside a Foundation
 * input's leading or trailing icon slot.
 *
 * That slot is a flex sibling of an input that asks for the full width, so a plain
 * span is free to shrink down to its longest word and a two-word unit breaks across
 * two lines. Holding the unit at its natural width keeps it on one line and lets the
 * input take whatever is left.
 */
const FieldUnitAdornment = ({ children }: FieldUnitAdornmentProps) => (
  <span className='text-body-medium content-muted shrink-0 text-no-wrap'>{children}</span>
);

export default FieldUnitAdornment;
