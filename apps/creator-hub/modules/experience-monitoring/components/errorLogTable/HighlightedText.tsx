import React, { FC } from 'react';
import { Typography } from '@rbx/ui';
import useErrorLogTableRowStyles from './ErrorLogTableRow.styles';

type HighlightedTextProps = {
  text: string;
  sentinelStart?: string;
  sentinelEnd?: string;
};

const HighlightedText: FC<HighlightedTextProps> = ({
  text,
  sentinelStart = '<|highlight|>',
  sentinelEnd = '</|highlight|>',
}) => {
  const {
    classes: { highlightContent },
  } = useErrorLogTableRowStyles();

  const parts = text.split(sentinelEnd).map((part, i) => {
    // Split each part by the sentinelStart to isolate the highlighted text
    const [start, highlight] = part.split(sentinelStart);
    return (
      <span key={`${part + i}`}>
        {start}
        {highlight && <span className={highlightContent}>{highlight}</span>}
      </span>
    );
  });

  return <Typography>{parts}</Typography>;
};

export default HighlightedText;
