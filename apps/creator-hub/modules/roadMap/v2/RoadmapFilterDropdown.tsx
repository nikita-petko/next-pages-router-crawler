import { useEffect, useRef, useState } from 'react';
import { Chip, Icon } from '@rbx/foundation-ui';

export type RoadmapFilterOption = {
  /** Stable identifier used as the value — kept untranslated so it can drive filtering later. */
  value: string;
  /** Translated, user-facing label. */
  label: string;
};

type RoadmapFilterDropdownProps = {
  options: RoadmapFilterOption[];
  /** Selected value — display only for now; selecting does not filter the timeline yet. */
  value: string;
  onSelect: (value: string) => void;
};

// Copied from the changelog filter menu (ChangelogTab.styles.ts) — no Foundation shadow token exists.
const MENU_SHADOW =
  '0 2px 4px -0.5px rgba(4, 4, 8, 0.25), 0 10px 20px -0.75px rgba(4, 4, 8, 0.25), 0 16px 32px -1px rgba(4, 4, 8, 0.25), 0 48px 56px -1.5px rgba(4, 4, 8, 0.25)';

const MENU_ITEM =
  'flex items-center justify-between self-stretch gap-medium padding-y-xsmall padding-x-medium cursor-pointer content-default text-body-small [border:none] [background:transparent] [appearance:none] hover:bg-[var(--color-state-hover)]';

/** Filter dropdown mirroring the changelog filter: a Chip trigger toggling a custom menu of options. */
function RoadmapFilterDropdown({ options, value, onSelect }: RoadmapFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const { target } = event;
      if (!(target instanceof Node)) {
        return;
      }
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? options[0]?.label;

  return (
    <div className='relative flex items-center' ref={wrapperRef}>
      <Chip
        variant='Standard'
        size='Medium'
        text={selectedLabel}
        isChecked={isOpen}
        onCheckedChange={setIsOpen}
        trailingIconName='icon-filled-chevron-large-down'
      />
      {isOpen && (
        <div
          className='absolute [left:0px] [top:28px] flex flex-col items-start gap-xsmall padding-xsmall radius-medium bg-surface-200 stroke-standard stroke-default [min-width:118px] [width:max-content] [z-index:1]'
          style={{ boxShadow: MENU_SHADOW }}>
          {options.map((option) => {
            const isActive = option.value === value;
            return (
              <button
                key={option.value}
                type='button'
                className={MENU_ITEM}
                onClick={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}>
                <span className='text-no-wrap'>{option.label}</span>
                {isActive && (
                  <Icon name='icon-filled-check-large' size='XSmall' className='content-default' />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RoadmapFilterDropdown;
