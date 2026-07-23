import type { FunctionComponent, ReactElement } from 'react';
import React, { useMemo } from 'react';
import type { AppBar } from '@rbx/ui';
import { Grid } from '@rbx/ui';
import type { HorizontalTabs } from '@modules/miscellaneous/components';
import type { StatusBanners } from '../components/StatusBanner';
import useAnalyticsPageStyles from './AnalyticsPage.styles';
import type { AnalyticsPageDescription } from './AnalyticsPageDescription';
import type { AnalyticsPageTitle } from './AnalyticsPageTitle';

export type AnalyticsPageLayoutProps = {
  title?: ReactElement<typeof AnalyticsPageTitle>;
  description?: ReactElement<typeof AnalyticsPageDescription>;
  action?: ReactElement;
  tabs?: ReactElement<typeof HorizontalTabs>;
  fullScreen?: boolean;

  /**
   * An optional banner to show at the top of the page
   */
  banners?: ReactElement<typeof StatusBanners>;

  /**
   * An optional element to show above the floater bar
   */
  heroElement?: React.JSX.Element;

  /**
   * Optional boolean to add a divider after hero Element
   */
  addHeroDivider?: boolean;

  /**
   * An optional <AppBar> that will float above the charts
   */
  floaterBar?: ReactElement<typeof AppBar>;

  children: React.ReactNode;
};

export const AnalyticsPageLayout: FunctionComponent<AnalyticsPageLayoutProps> = ({
  title,
  fullScreen = false,
  description,
  action,
  banners,
  tabs: tabsProp,
  floaterBar,
  heroElement: heroElementGiven,
  addHeroDivider = true,
  children,
}) => {
  const {
    classes: { sidePadding, dividerStyle, overflowFix },
  } = useAnalyticsPageStyles();

  const tabs = tabsProp ? <Grid item>{tabsProp}</Grid> : null;

  const heroElement = useMemo(() => {
    if (!heroElementGiven) {
      return null;
    }

    if (addHeroDivider) {
      return (
        <>
          {heroElementGiven}
          <hr className={dividerStyle} />
        </>
      );
    }

    return <Grid item>{heroElementGiven}</Grid>;
  }, [heroElementGiven, addHeroDivider, dividerStyle]);

  return (
    <Grid container className={sidePadding} direction='column' wrap='nowrap'>
      {fullScreen && title}
      {(description ?? action) && (
        <Grid
          container
          item
          justifyContent='space-between'
          alignItems='center'
          wrap='nowrap'
          spacing={2}>
          {description}
          {action ? <Grid item>{action}</Grid> : null}
        </Grid>
      )}
      {banners}
      {tabs}
      <Grid className={overflowFix}>
        {heroElement}
        {floaterBar}
        {children}
      </Grid>
    </Grid>
  );
};
