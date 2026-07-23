import { Button, Typography } from '@rbx/ui';
import React, { FunctionComponent, useState } from 'react';

export interface ExpandableTextProps {
  children?: string;
  lengthBeforeTrim?: number;
}
const ExpandableText: FunctionComponent<React.PropsWithChildren<ExpandableTextProps>> = ({
  children,
  lengthBeforeTrim = 70,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayText = children?.trim() || '';
  if (displayText.length > lengthBeforeTrim) {
    const shortText = `${displayText.substring(0, lengthBeforeTrim)}...`;
    const finalText = isExpanded ? displayText : shortText;
    const moreOrLess = isExpanded ? 'less' : 'more';
    return (
      <Typography variant='body2' sx={{ wordWrap: 'break-word' }}>
        {finalText}
        <Button
          sx={{ textTransform: 'none' }}
          size='small'
          onClick={() => setIsExpanded(!isExpanded)}>
          read {moreOrLess}
        </Button>
      </Typography>
    );
  }

  return <Typography variant='body2'>{displayText || '-'}</Typography>;
};

export default ExpandableText;
