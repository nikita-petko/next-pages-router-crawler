/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import '@rbx/foundation-ui/style';
import '../styles/webfont.css';
import '../styles/globals.css';

import { useFoundationTheme } from '@rbx/foundation-ui';

import type { NextComponentType, NextGetPageLayout } from 'next';
import type { AppContext, AppInitialProps, AppLayoutProps } from 'next/app';

const getDefaultPageLayout: NextGetPageLayout = (page) => page;

type CustomAppFC = NextComponentType<
  AppContext,
  AppInitialProps,
  AppLayoutProps
>;

export const CustomApp: CustomAppFC = ({ Component, pageProps, cache }) => {
  const getPageLayout = Component.getPageLayout ?? getDefaultPageLayout;

  useFoundationTheme(
    'system',
    typeof document !== 'undefined' ? document.documentElement : undefined,
  );

  return getPageLayout(<Component {...pageProps} />);
};

export default CustomApp;
