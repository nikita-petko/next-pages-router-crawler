import { Select } from '@rbx/ui';

const showMenuBelowSelector: Partial<React.ComponentProps<typeof Select>['SelectProps']> = {
  MenuProps: {
    anchorOrigin: {
      vertical: 'bottom',
      horizontal: 'center',
    },
    transformOrigin: {
      vertical: 'top',
      horizontal: 'center',
    },
  },
};

export default showMenuBelowSelector;
