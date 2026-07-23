import { HorizontalTabs } from '@modules/miscellaneous/common';
import { AppBar, Grid } from '@rbx/ui';
import React, { FunctionComponent, ReactElement, useMemo } from 'react';
import useAnalyticsPageStyles from './AnalyticsPage.styles';
import { AnalyticsPageDescription } from './AnalyticsPageDescription';
import { AnalyticsPageTitle } from './AnalyticsPageTitle';
import { StatusBanners } from '../components/StatusBanner';

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
    classes: { sidePadding, dividerStyle, heroElementMargin, overflowFix },
  } = useAnalyticsPageStyles();

  const tabs = tabsProp ? <Grid item>{tabsProp}</Grid> : null;

  const heroElement = useMemo(() => {
    if (!heroElementGiven) {
      return null;
    }

    if (addHeroDivider) {
      return (
        <React.Fragment>
          {heroElementGiven}
          <hr className={dividerStyle} />
        </React.Fragment>
      );
    }

    return (
      <Grid item className={heroElementMargin}>
        {heroElementGiven}
      </Grid>
    );
  }, [heroElementGiven, addHeroDivider, heroElementMargin, dividerStyle]);

  return (
    <Grid container className={sidePadding} direction='column' wrap='nowrap'>
      {fullScreen && title}
      {(description || action) && (
        <Grid container item justifyContent='space-between' alignItems='center'>
          {description}
          {action}
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
