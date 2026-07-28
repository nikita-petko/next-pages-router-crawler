import type { FC } from 'react';
import React from 'react';

export interface AskQuestionOptionRowProps {
  /** 1-based number shown in the leading badge (doubles as the keyboard shortcut). */
  badgeNumber: number;
  label: string;
  description?: string;
  isSelected: boolean;
  isReadOnly?: boolean;
  onSelect: () => void;
}

// The badge sits a touch below the label's cap height to line up with the text, per design.
const BADGE_CLASSNAME =
  'flex shrink-0 items-center justify-center size-600 radius-small text-label-small margin-top-[2px] bg-surface-300 content-emphasis';

const AskQuestionOptionRow: FC<AskQuestionOptionRowProps> = ({
  badgeNumber,
  label,
  description,
  isSelected,
  isReadOnly = false,
  onSelect,
}) => {
  // Rows match the core background when idle, lighten on hover, and fill when selected.
  const rowStateClassName = isSelected
    ? 'bg-surface-300'
    : isReadOnly
      ? 'bg-surface-100'
      : 'bg-surface-100 hover:bg-surface-200';

  return (
    <button
      type='button'
      onClick={onSelect}
      disabled={isReadOnly}
      aria-pressed={isSelected}
      className={`flex width-full items-start gap-medium padding-medium radius-medium stroke-none text-align-x-left ${rowStateClassName}`}>
      <span className={BADGE_CLASSNAME}>{badgeNumber}</span>
      <span className='flex flex-col gap-xxsmall'>
        <span className='text-title-small content-emphasis'>{label}</span>
        {description ? <span className='text-body-small content-muted'>{description}</span> : null}
      </span>
    </button>
  );
};

export default AskQuestionOptionRow;
