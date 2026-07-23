import type { FC, ReactElement } from 'react';
import React from 'react';
import type { Typography } from '@rbx/ui';
import { makeStyles } from '@rbx/ui';

const useStyles = makeStyles()(() => ({
  textContainer: {
    padding: '6px 8px',
    fontSize: '12px',
  },
}));

type TextBasedAnnotationTooltipContentProps = {
  text: string | ReactElement<typeof Typography>;
};

const TextBasedAnnotationTooltipContent: FC<TextBasedAnnotationTooltipContentProps> = ({
  text,
}) => {
  const {
    classes: { textContainer },
  } = useStyles();
  return <div className={textContainer}>{text}</div>;
};

export default TextBasedAnnotationTooltipContent;
