import { Icon } from '@rbx/foundation-ui';

// Lock affordance for published / non-removable creative tiles. Sits directly on
// the creative thumbnail, so it pins to the dark-mode scrim and glyph in both
// themes rather than using a Foundation `Badge` variant, which would resolve to
// a light chip that disappears against a bright creative.
const CreativeLockBadge = () => (
  <span className='absolute right-[8px] bottom-[8px] pointer-events-none flex items-center justify-center radius-circle height-600 width-600 bg-[var(--dark-mode-common-backdrop)]'>
    <Icon
      className='content-[var(--dark-mode-content-emphasis)]'
      name='icon-filled-lock-closed'
      size='XSmall'
    />
  </span>
);

export default CreativeLockBadge;
