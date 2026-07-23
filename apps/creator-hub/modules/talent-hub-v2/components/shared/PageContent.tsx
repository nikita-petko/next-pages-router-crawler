import React from 'react';
import { clsx } from '@rbx/foundation-ui';
import styles from './Layout.module.css';

type PageContentProps = (
  | ({ as?: 'div' } & React.ComponentPropsWithoutRef<'div'>)
  | ({ as: 'form' } & React.ComponentPropsWithoutRef<'form'>)
) & {
  testId: string;
  gap?: 'medium' | 'large';
};

const PageContent: React.FC<PageContentProps> = ({
  testId,
  gap = 'large',
  children,
  as = 'div',
  className: extra,
  ...rest
}) => {
  const className = clsx(
    'width-full margin-x-auto padding-small small:padding-medium large:padding-large flex flex-col',
    `gap-${gap}`,
    styles.pageContent,
    extra,
  );

  const Component = as as React.ElementType;

  return (
    <Component {...rest} className={className} data-testid={testId}>
      {children}
    </Component>
  );
};

export default PageContent;
