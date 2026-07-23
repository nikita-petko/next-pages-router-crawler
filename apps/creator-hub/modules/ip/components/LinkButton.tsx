import React from 'react';
import { Button, makeStyles } from '@rbx/ui';

const useStyles = makeStyles()(() => ({
  linkButton: {
    padding: 0,
    minWidth: 'unset',
    textTransform: 'none',
    '&:hover': {
      textDecoration: 'underline',
      backgroundColor: 'transparent',
    },
    // These values remove the built-in padding for buttons so
    // that the LinkButton renders similarly to in-line text
    marginTop: '-10px',
    marginBottom: '-10px',
    paddingBottom: '4px',
  },
}));

interface LinkButtonProps {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

/**
 * A button that looks like a link. Used when design wants something that
 * looks like a link but doesn't do any navigation.
 */
const LinkButton: React.FC<LinkButtonProps> = ({
  onClick,
  children,
  className,
  'data-testid': dataTestId,
}) => {
  const { classes } = useStyles();

  return (
    <Button
      disableRipple
      onClick={onClick}
      className={`${classes.linkButton} ${className || ''}`}
      variant='text'
      data-testid={dataTestId}>
      {children}
    </Button>
  );
};

export default LinkButton;
