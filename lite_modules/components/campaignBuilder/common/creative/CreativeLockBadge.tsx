import { Icon } from '@rbx/foundation-ui';

// Lock affordance for published / non-removable creative tiles. Uses an
// explicit dark scrim chip + light glyph instead of a Foundation `Badge`
// variant, which resolves to a light chip on the drawer's dark surface.
const CreativeLockBadge = () => (
  <span className='absolute right-[8px] bottom-[8px] pointer-events-none flex items-center justify-center radius-circle height-600 width-600 bg-[rgba(0,0,0,0.6)]'>
    <Icon
      className='content-[var(--dark-mode-content-emphasis)]'
      name='icon-filled-lock-closed'
      size='XSmall'
    />
  </span>
);

export default CreativeLockBadge;
