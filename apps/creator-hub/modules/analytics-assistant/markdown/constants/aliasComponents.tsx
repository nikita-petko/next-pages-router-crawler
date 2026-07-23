// Credit: https://github.rbx.com/Roblox/creator-doc-site/blob/master/services/doc-site-ssr/app/modules/assistant/markdown/components/Markdown.tsx
import React, { ComponentPropsWithoutRef, FC } from 'react';
import { Typography } from '@rbx/ui';

type MarkdownHeaderComponentProps =
  | ComponentPropsWithoutRef<'h1'>
  | ComponentPropsWithoutRef<'h2'>
  | ComponentPropsWithoutRef<'h3'>
  | ComponentPropsWithoutRef<'h4'>
  | ComponentPropsWithoutRef<'h5'>
  | ComponentPropsWithoutRef<'h6'>;

type HeaderLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

const getHeaderComponent = (headerLevel: HeaderLevel) => {
  const component = ({ children }: MarkdownHeaderComponentProps) => (
    <Typography
      variant={headerLevel}
      component={headerLevel}
      marginTop='1.75em'
      marginBottom='0.5em'>
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
const P: FC<React.PropsWithChildren<ComponentPropsWithoutRef<'p'>>> = ({ children }) => (
  <Typography variant='body1' component='p'>
    {children}
  </Typography>
);
const LI: FC<React.PropsWithChildren<ComponentPropsWithoutRef<'li'>>> = ({ children }) => (
  <Typography variant='body1' component='p' margin='2px 0'>
    <li style={{ listStyleType: 'square' }}>{children}</li>
  </Typography>
);

export const LIST_LEFT_PADDING = '24px';
const UL: FC<React.PropsWithChildren<ComponentPropsWithoutRef<'ul'>>> = ({ children }) => (
  <ul style={{ margin: '0px', paddingLeft: LIST_LEFT_PADDING }}>{children}</ul>
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
};
