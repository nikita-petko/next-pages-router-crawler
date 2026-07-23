import { Link } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import React from 'react';

const useTranslateWithLink = (
  key: string,
  href: string,
  isLarge: boolean = false,
): React.ReactNode => {
  const { translateHTML } = useTranslation();

  return translateHTML(key, [
    {
      opening: 'startLink',
      closing: 'endLink',
      content(chunks) {
        return (
          <Link href={href} target='_blank' underline='none' variant={isLarge ? 'body1' : 'body2'}>
            {chunks}
          </Link>
        );
      },
    },
  ]);
};

export default useTranslateWithLink;
