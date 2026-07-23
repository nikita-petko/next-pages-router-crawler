// Credit: https://github.rbx.com/Roblox/creator-doc-site/blob/master/services/doc-site-ssr/app/modules/assistant/markdown/components/Markdown.tsx
import type { ComponentPropsWithoutRef, FC } from 'react';
import React from 'react';
import { Typography } from '@rbx/ui';
import MarkdownCode, { MarkdownCodeBlockContext } from '../components/MarkdownCode';
import styles from './aliasComponents.module.css';

type MarkdownHeaderComponentProps = ComponentPropsWithoutRef<'h1'>;

type HeaderLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

const mergeClassNames = (...classNames: Array<string | undefined>) =>
  classNames.filter(Boolean).join(' ');

const getHeaderComponent = (headerLevel: HeaderLevel) => {
  const component = ({ children, className }: MarkdownHeaderComponentProps) => (
    <Typography
      variant={headerLevel}
      component={headerLevel}
      className={mergeClassNames(styles.header, className)}>
      {children}
    </Typography>
  );
  component.displayName = `Header.[${headerLevel}]`;
  return component;
};

const H1: FC<React.PropsWithChildren<MarkdownHeaderComponentProps>> = getHeaderComponent('h1');
const H2: FC<React.PropsWithChildren<MarkdownHeaderComponentProps>> = getHeaderComponent('h2');
const H3: FC<React.PropsWithChildren<MarkdownHeaderComponentProps>> = getHeaderComponent('h3');
const H4: FC<React.PropsWithChildren<MarkdownHeaderComponentProps>> = getHeaderComponent('h4');
const H5: FC<React.PropsWithChildren<MarkdownHeaderComponentProps>> = getHeaderComponent('h5');
const H6: FC<React.PropsWithChildren<MarkdownHeaderComponentProps>> = getHeaderComponent('h6');
const P: FC<React.PropsWithChildren<ComponentPropsWithoutRef<'p'>>> = ({ children, className }) => {
  return (
    <Typography
      variant='body1'
      component='p'
      className={mergeClassNames(styles.paragraph, className)}>
      {children}
    </Typography>
  );
};
const LI: FC<React.PropsWithChildren<ComponentPropsWithoutRef<'li'>>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <li {...props} className={mergeClassNames(styles.listItem, className)}>
      {children}
    </li>
  );
};
const UL: FC<React.PropsWithChildren<ComponentPropsWithoutRef<'ul'>>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <ul {...props} className={mergeClassNames(styles.list, className)}>
      {children}
    </ul>
  );
};
const OL: FC<React.PropsWithChildren<ComponentPropsWithoutRef<'ol'>>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <ol {...props} className={mergeClassNames(styles.list, className)}>
      {children}
    </ol>
  );
};

const Blockquote: FC<React.PropsWithChildren<ComponentPropsWithoutRef<'blockquote'>>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <blockquote {...props} className={mergeClassNames(styles.blockquote, className)}>
      {children}
    </blockquote>
  );
};

const A: FC<React.PropsWithChildren<ComponentPropsWithoutRef<'a'>>> = ({
  children,
  href,
  ...props
}) => (
  <a {...props} href={href} target='_blank' rel='noopener noreferrer'>
    {children}
  </a>
);

const HR: FC<ComponentPropsWithoutRef<'hr'>> = ({ className, ...props }) => {
  return <hr {...props} className={mergeClassNames(styles.horizontalRule, className)} />;
};

const Table: FC<React.PropsWithChildren<ComponentPropsWithoutRef<'table'>>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={styles.tableWrapper}>
      <table {...props} className={mergeClassNames(styles.table, className)}>
        {children}
      </table>
    </div>
  );
};

const TH: FC<React.PropsWithChildren<ComponentPropsWithoutRef<'th'>>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <th {...props} className={mergeClassNames(styles.tableHeader, className)}>
      {children}
    </th>
  );
};

const TD: FC<React.PropsWithChildren<ComponentPropsWithoutRef<'td'>>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <td {...props} className={mergeClassNames(styles.tableCell, className)}>
      {children}
    </td>
  );
};

const Pre: FC<React.PropsWithChildren<ComponentPropsWithoutRef<'pre'>>> = ({ children }) => (
  <MarkdownCodeBlockContext.Provider value>{children}</MarkdownCodeBlockContext.Provider>
);

export default {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  p: P,
  li: LI,
  ul: UL,
  ol: OL,
  blockquote: Blockquote,
  a: A,
  hr: HR,
  table: Table,
  th: TH,
  td: TD,
  pre: Pre,
  code: MarkdownCode,
};
