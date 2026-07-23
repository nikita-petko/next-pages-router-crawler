import React from 'react';
import { Typography } from '@rbx/ui';

const ContentItem = ({
  title,
  content,
  secondary = false,
}: {
  title: string;
  content: string;
  secondary?: boolean;
}) => {
  return (
    <div>
      <Typography variant='body2' color={secondary ? 'secondary' : 'primary'}>
        {title}
      </Typography>
      <Typography variant='body2' paragraph color='secondary'>
        {content}
      </Typography>
    </div>
  );
};

export default ContentItem;
