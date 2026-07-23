import React, { forwardRef } from 'react';
import type { TCardProps as TUICardProps } from '@rbx/ui';
import { makeStyles, Card as UICard } from '@rbx/ui';

type TCardProps = {
  classes?: Partial<{ root: string }>;
  variant?: TUICardProps['variant'];
};

const useStyles = makeStyles<TCardProps>()((theme, { variant }) => ({
  root: {
    backgroundColor: variant !== 'outlined' ? theme.palette.surface[200] : undefined,
    '&:hover, &:focus-within': {
      border: variant === 'outlined' ? `1px solid ${theme.palette.states.active}` : undefined,
    },
  },
}));

const Card = forwardRef<HTMLDivElement, React.PropsWithChildren<TCardProps>>(function Card(
  { classes, variant, children },
  ref,
) {
  const {
    classes: { root },

    cx,
  } = useStyles({ variant });
  return (
    <UICard ref={ref} classes={{ root: cx(root, classes?.root) }} variant={variant}>
      {children}
    </UICard>
  );
});

export default Card;
