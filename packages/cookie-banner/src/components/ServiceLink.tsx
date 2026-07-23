import React from 'react';
import { Button, OpenInNewIcon, buttonClasses, makeStyles } from '@rbx/ui';

const useStyles = makeStyles()(() => ({
  button: {
    paddingLeft: 5,
    [`&.${buttonClasses.root}`]: {
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: 'transparent',
      },
      '&:focus': {
        backgroundColor: 'transparent',
      },
      '&:active': {
        backgroundColor: 'transparent',
      },
    },
  },
}));

const ServiceLink = ({ href, text }: { href: string; text: string }) => {
  const { classes } = useStyles();

  return (
    <div>
      <Button
        className={classes.button}
        variant='text'
        component='a'
        color='primary'
        href={href}
        rel='noreferrer'
        endIcon={<OpenInNewIcon />}
        size='small'
        target='_blank'
        disableRipple>
        {text}
      </Button>
    </div>
  );
};

export default ServiceLink;
