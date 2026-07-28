import type { FC } from 'react';
import React from 'react';
import { IconButton } from '@rbx/foundation-ui';

const CHEVRON_LEFT_ICON = 'icon-filled-chevron-large-left';
const CHEVRON_RIGHT_ICON = 'icon-filled-chevron-large-right';
const CLOSE_ICON = 'icon-filled-x';

export interface AskQuestionCardHeaderProps {
  title: string;
  /** Numeric pager label (e.g. "1/3"); omit to hide it. */
  pagerLabel?: string;
  /** Whether to render the ‹ › navigation arrows. */
  showArrows: boolean;
  canPrevious: boolean;
  canNext: boolean;
  previousLabel: string;
  nextLabel: string;
  closeLabel?: string;
  onPrevious: () => void;
  onNext: () => void;
  /** When provided, renders the close (✕) control. */
  onClose?: () => void;
}

// Matches the Figma header inset (L16 R8); min-height pins the bar to the icon-button
// height (size-800) so read-only headers (no buttons) match interactive ones.
const HEADER_CLASSNAME =
  'flex items-center justify-between gap-medium padding-left-large padding-right-small min-height-800';

const AskQuestionCardHeader: FC<AskQuestionCardHeaderProps> = ({
  title,
  pagerLabel,
  showArrows,
  canPrevious,
  canNext,
  previousLabel,
  nextLabel,
  closeLabel,
  onPrevious,
  onNext,
  onClose,
}) => {
  return (
    <div className={HEADER_CLASSNAME}>
      <span className='text-title-small content-emphasis'>{title}</span>
      <div className='flex shrink-0 items-center gap-xsmall'>
        {showArrows ? (
          <>
            <IconButton
              icon={CHEVRON_LEFT_ICON}
              ariaLabel={previousLabel}
              variant='Utility'
              size='Small'
              isDisabled={!canPrevious}
              onClick={onPrevious}
            />
            {pagerLabel ? (
              <span className='text-body-small content-muted'>{pagerLabel}</span>
            ) : null}
            <IconButton
              icon={CHEVRON_RIGHT_ICON}
              ariaLabel={nextLabel}
              variant='Utility'
              size='Small'
              isDisabled={!canNext}
              onClick={onNext}
            />
          </>
        ) : null}
        {onClose && closeLabel ? (
          <IconButton
            icon={CLOSE_ICON}
            ariaLabel={closeLabel}
            variant='Utility'
            size='Small'
            onClick={onClose}
          />
        ) : null}
      </div>
    </div>
  );
};

export default AskQuestionCardHeader;
