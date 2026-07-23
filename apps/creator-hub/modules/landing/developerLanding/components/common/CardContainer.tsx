import type { FunctionComponent } from 'react';
import React from 'react';
import { makeStyles, Card as UICard } from '@rbx/ui';
import { alpha } from '@modules/miscellaneous/utils';

type TCardProps = {
  'data-testid'?: string;
  classes?: Partial<{ root: string }>;
};

const useStyles = makeStyles()((theme) => ({
  root: {
    backgroundColor: alpha(theme.palette.surface[300], 200),
    backdropFilter: 'blur(5px)',
  },
}));

export const CardContainer: FunctionComponent<React.PropsWithChildren<TCardProps>> = ({
  children,
  ...props
}) => {
  const {
    classes: { root },

    cx,
  } = useStyles();
  return (
    <UICard classes={{ root: cx(root, props.classes?.root) }} data-testid={props['data-testid']}>
      {children}
    </UICard>
  );
};

export default CardContainer;
