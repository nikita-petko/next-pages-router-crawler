import type { ChangeEvent, KeyboardEvent } from 'react';
import React, { forwardRef } from 'react';
import { Button, TextInput } from '@rbx/foundation-ui';

const ENTER_KEY = 'Enter';

export interface AskQuestionOtherRowProps {
  /** 1-based number shown in the leading badge, or omitted for a free-text-only question. */
  badgeNumber?: number;
  value: string;
  placeholder: string;
  skipLabel: string;
  ariaLabel: string;
  isReadOnly?: boolean;
  onChange: (text: string) => void;
  onSkip: () => void;
  /** Fired on Enter within the field (e.g. submit a single free-text question). */
  onEnter?: () => void;
}

const BADGE_CLASSNAME =
  'flex shrink-0 items-center justify-center size-600 radius-small text-label-small bg-surface-300 content-emphasis';

const AskQuestionOtherRow = forwardRef<HTMLInputElement, AskQuestionOtherRowProps>(
  (
    {
      badgeNumber,
      value,
      placeholder,
      skipLabel,
      ariaLabel,
      isReadOnly = false,
      onChange,
      onSkip,
      onEnter,
    },
    ref,
  ) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === ENTER_KEY && onEnter) {
        event.preventDefault();
        onEnter();
      }
    };

    // padding-x matches the option rows' padding-medium so the badge lines up with them.
    return (
      <div className='flex items-center gap-medium padding-x-medium'>
        {badgeNumber !== undefined ? <span className={BADGE_CLASSNAME}>{badgeNumber}</span> : null}
        <div className='grow'>
          <TextInput
            size='Medium'
            value={value}
            placeholder={placeholder}
            aria-label={ariaLabel}
            isDisabled={isReadOnly}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            ref={ref}
          />
        </div>
        {!isReadOnly ? (
          <div className='shrink-0'>
            <Button variant='Utility' size='Medium' onClick={onSkip}>
              {skipLabel}
            </Button>
          </div>
        ) : null}
      </div>
    );
  },
);

AskQuestionOtherRow.displayName = 'AskQuestionOtherRow';

export default AskQuestionOtherRow;
