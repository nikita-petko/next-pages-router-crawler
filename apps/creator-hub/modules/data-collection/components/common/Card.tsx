import type { FunctionComponent } from 'react';
import React from 'react';
import type { TCardProps as TUICardProps } from '@rbx/ui';
import { makeStyles, Card as UICard } from '@rbx/ui';

type TCardProps = {
  classes?: Partial<{ root: string }>;
  variant?: TUICardProps['variant'];
};

const useStyles = makeStyles<TCardProps>()((theme, { variant }) => ({
  root: {
    backgroundColor: variant !== 'outlined' ? theme.palette.background.paper : undefined,
    '&:hover': {
      border: variant === 'outlined' ? `1px solid ${theme.palette.action.active}` : undefined,
    },
  },
}));

export const Card: FunctionComponent<React.PropsWithChildren<TCardProps>> = ({
  classes,
  variant,
  children,
}) => {
  const {
    classes: { root },

    cx,
  } = useStyles({ variant });
  return (
    <UICard classes={{ root: cx(root, classes?.root) }} variant={variant}>
      {children}
    </UICard>
  );
};

export default Card;
