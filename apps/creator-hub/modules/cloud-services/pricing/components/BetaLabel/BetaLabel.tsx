import type { FunctionComponent } from 'react';
import React from 'react';
import { Label } from '@rbx/ui';
import useBetaLabelStyles from './BetaLabel.styles';

const BetaLabel: FunctionComponent<{ text: string }> = ({ text }) => {
  const {
    classes: { label },
  } = useBetaLabelStyles();
  return (
    <span className={label}>
      <Label labelText={text} />
    </span>
  );
};
export default React.memo(BetaLabel);
