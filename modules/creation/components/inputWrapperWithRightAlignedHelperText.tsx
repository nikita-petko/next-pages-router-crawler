import { FormHelperText, makeStyles } from '@rbx/ui';
import { ReactNode } from 'react';

import { TODOFIXANY } from 'app/shared/types';

interface InputWrapperWithRightAlignedHelperTextProps {
  children: ReactNode;
  helperTextValue: string;
  topOffset?: string;
}

export const InputWrapperWithRightAlignedHelperText = ({
  children,
  helperTextValue,
  topOffset,
}: InputWrapperWithRightAlignedHelperTextProps) => {
  const rightAlignedAbsoluteChildCSS: TODOFIXANY = {
    position: 'absolute',
    right: 0,
  };

  if (topOffset) {
    rightAlignedAbsoluteChildCSS.top = topOffset;
  } else {
    rightAlignedAbsoluteChildCSS.bottom = 0;
  }

  const {
    classes: { positionRelativeContainer, rightAlignedAbsoluteChild },
  } = makeStyles()(() => ({
    positionRelativeContainer: {
      position: 'relative',
    },

    rightAlignedAbsoluteChild: rightAlignedAbsoluteChildCSS,
  }))();

  return (
    <div className={positionRelativeContainer}>
      {children}
      <FormHelperText classes={{ root: rightAlignedAbsoluteChild }}>
        {helperTextValue}
      </FormHelperText>
    </div>
  );
};
