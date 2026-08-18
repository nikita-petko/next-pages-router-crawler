import React from 'react';
import { clsx } from '@rbx/foundation-ui';

/**
 * Renders its children as a sticky footer, with a blur effect.
 * Renders as a flexbox, so Button children can be passed in directly.
 */
const SearchFooter = ({
  children,
  isVisible,
}: {
  children: React.ReactNode;
  isVisible: boolean;
}) => {
  return (
    <div
      className={clsx(
        'sticky bottom-[0px] flex width-full flex-col-reverse items-center justify-end gap-large',
        'padding-top-large padding-bottom-large padding-right-large',
        'medium:flex-row medium:padding-top-xxlarge medium:padding-bottom-xxlarge medium:padding-right-xxlarge',
        'transition-opacity duration-200 ease-standard-out',
        '[backdrop-filter:blur(20px)] [-webkit-backdrop-filter:blur(20px)]',
        isVisible ? 'opacity-[1]' : 'pointer-events-none opacity-[0]',
      )}>
      {children}
    </div>
  );
};
export default SearchFooter;
