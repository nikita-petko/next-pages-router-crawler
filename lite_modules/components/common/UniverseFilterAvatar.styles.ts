import { makeStyles } from '@rbx/ui';

const useUniverseFilterAvatarStyles = makeStyles()(() => ({
  // Foundation's smallest Avatar is 32px and it sets that through its own
  // `size-800` Tailwind utility. A single-class override ties on specificity,
  // so the winner depends on whether the Tailwind sheet or the emotion tag is
  // inserted last. Doubling the selector settles it regardless of order.
  avatar: {
    '&&': {
      height: 24,
      width: 24,
    },
  },
}));

export default useUniverseFilterAvatarStyles;
