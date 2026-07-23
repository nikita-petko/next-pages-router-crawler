import { FormHelperText, makeStyles } from '@rbx/ui';
import { ReactNode } from 'react';

import { TODOFIXANY } from 'app/shared/types';

interface AutocompleteWrapperWithRightAlignedHelperTextProps {
  children: ReactNode;
  helperTextValue: string;
}

export const AutocompleteWrapperWithRightAlignedHelperText = ({
  children,
  helperTextValue,
}: AutocompleteWrapperWithRightAlignedHelperTextProps) => {
  const rightAlignedAbsoluteChildCSS: TODOFIXANY = {
    left: '96.1%',
    position: 'relative',
  };

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
