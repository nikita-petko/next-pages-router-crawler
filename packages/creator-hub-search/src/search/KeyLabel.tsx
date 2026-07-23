import React from 'react';
import { Button } from '@rbx/foundation-ui';
import useKeyLabelStyles from './KeyLabel.styles';

interface KeyLabelProps {
  keys: string[];
}

const KeyLabel: React.FC<KeyLabelProps> = ({ keys }) => {
  const { classes } = useKeyLabelStyles();

  if (keys.length === 0) {
    return null;
  }

  return (
    <span className={classes.container}>
      {keys.map((key) => (
        <Button
          key={key}
          variant='Standard'
          size='XSmall'
          className={`text-caption-small ${classes.key}`}
          tabIndex={-1}
          aria-hidden>
          {key}
        </Button>
      ))}
    </span>
  );
};

export default KeyLabel;
