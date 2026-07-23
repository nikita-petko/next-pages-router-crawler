import React, { memo, useCallback, useMemo, useState } from 'react';
import type { TSystemBannerProps } from '@rbx/foundation-ui';
import {
  Container,
  IconButton,
  makeStyles,
  NavigateBeforeIcon,
  NavigateNextIcon,
  Tab,
  Tabs,
  useMediaQuery,
} from '@rbx/ui';
import type { ChartCardProps } from './ChartCard';
import ChartCard from './ChartCard';
import ChartCardDragAndResizeContainer from './ChartCardDragAndResizeContainer';
import type { ChartCardDragDropOptions, ChartCardResizeOptions } from './ChartCardDragDropContext';
import type { ChartPlaceholderProps } from './ChartPlaceholder';
import ChartSummary from './ChartSummary';
import type { ComparisonChipProps } from './ComparisonChip';
import useMuiTabsScroller from './useMuiTabsScroller';

type TabSpec<TTabKey> = {
  key: TTabKey;
  summaryValue: string;
  description: string;
  comparisonChipSpec?: ComparisonChipProps;
  abnormalState?: ChartPlaceholderProps;
  tooltip?: string;
  chartBanner?: TSystemBannerProps;
};

type TabbedChartsCardContainerProps<TTabKey> = Omit<
  ChartCardProps,
  'subTitle' | 'abnormalState' | 'chartBanner'
> & {
  chartControl?: React.ReactNode;
  tabSpecs: Array<TabSpec<TTabKey>>;
  activeTabKey: TTabKey;
  onActiveTabChanged: (tabKey: TTabKey) => void;
  dragAndDropOptions?: ChartCardDragDropOptions;
  resizeOptions?: ChartCardResizeOptions;
};

const useStyles = makeStyles()((theme) => ({
  subTitleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0px 4px',
  },
  tabsWrapper: {
    position: 'relative',
    flex: 1,
    minWidth: 0,
  },
  scrollBumper: {
    display: 'flex',
    alignItems: 'center',
    zIndex: theme.zIndex.speedDial,
    position: 'absolute',
    height: '100%',
    top: 0,
  },
  scrollBumperLeft: {
    left: 0,
  },
  scrollBumperRight: {
    right: 0,
  },
  scrollBumperHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  scrollButton: {
    opacity: 1,
    alignSelf: 'center',
  },
  chartControlContainer: {
    flex: '0 1 auto',
    marginLeft: '16px',
  },
  tabContainer: {
    paddingTop: '0px',
    paddingBottom: '4px',
    lineHeight: '110%',
  },
}));

const TabbedChartsCardContainer = <TTabKey extends string | number>({
  children,
  titleLabel,
  titleTooltipLabel,
  titleSuffix,
  footerContent,
  headerActionItems,
  headerActions,
  downloadAction,
  overflowMenuContent,
  secondaryAction,
  chartControl,
  tabSpecs,
  activeTabKey,
  onActiveTabChanged,
  dragAndDropOptions,
  resizeOptions,
  slots,
}: React.PropsWithChildren<TabbedChartsCardContainerProps<TTabKey>>) => {
  const {
    classes: {
      subTitleContainer,
      tabsWrapper,
      scrollBumper,
      scrollBumperLeft,
      scrollBumperRight,
      scrollBumperHidden,
      scrollButton,
      chartControlContainer,
      tabContainer,
    },
    cx,
  } = useStyles();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  // Scroll bumper (desktop only)
  const { wrapperRef, isStartOfScroll, isEndOfScroll, handleScroll, refreshScrollState } =
    useMuiTabsScroller(!isCompactView);
  const [isHover, setIsHover] = useState(false);

  // --- Tab change handler ---
  const handleValueChange = useCallback(
    (_: React.ChangeEvent<object>, newValue: TTabKey) => {
      onActiveTabChanged(newValue);
    },
    [onActiveTabChanged],
  );

  // Memoize the Tabs element (the expensive part)
  const tabs = useMemo(
    () => (
      <Tabs
        value={activeTabKey}
        variant='scrollable'
        scrollButtons={false}
        onChange={handleValueChange}
        aria-label='tabs'>
        {tabSpecs.map(
          ({ key, comparisonChipSpec, description, summaryValue, abnormalState, tooltip }) => (
            <Tab
              label={
                <ChartSummary
                  summaryValue={summaryValue}
                  description={description}
                  comparisonChipSpec={comparisonChipSpec}
                  abnormalStatus={abnormalState?.status}
                  tooltip={tooltip}
                  centered
                />
              }
              value={key}
              key={key}
              classes={{ root: tabContainer }}
            />
          ),
        )}
      </Tabs>
    ),
    [activeTabKey, handleValueChange, tabContainer, tabSpecs],
  );

  const subTitle = (
    <Container disableGutters classes={{ root: subTitleContainer }} maxWidth={false}>
      <div
        ref={wrapperRef}
        className={tabsWrapper}
        onMouseEnter={() => {
          setIsHover(true);
          refreshScrollState();
        }}
        onMouseLeave={() => setIsHover(false)}>
        {tabs}
        {!isCompactView && (
          <>
            <div
              className={cx(scrollBumper, scrollBumperLeft, {
                [scrollBumperHidden]: !isHover || isStartOfScroll,
              })}>
              <IconButton
                classes={{ root: scrollButton }}
                onClick={() => handleScroll('left')}
                color='onMediaLight'
                variant='contained'
                aria-label='scroll left'
                size='small'>
                <NavigateBeforeIcon fontSize='small' />
              </IconButton>
            </div>
            <div
              className={cx(scrollBumper, scrollBumperRight, {
                [scrollBumperHidden]: !isHover || isEndOfScroll,
              })}>
              <IconButton
                classes={{ root: scrollButton }}
                onClick={() => handleScroll('right')}
                color='onMediaLight'
                variant='contained'
                aria-label='scroll right'
                size='small'>
                <NavigateNextIcon fontSize='small' />
              </IconButton>
            </div>
          </>
        )}
      </div>
      {!isCompactView && chartControl && (
        <div className={chartControlContainer}>{chartControl}</div>
      )}
    </Container>
  );

  const abnormalState = useMemo(() => {
    const activeTab = tabSpecs.find((tab) => tab.key === activeTabKey);
    return activeTab?.abnormalState;
  }, [activeTabKey, tabSpecs]);

  const chartBanner = useMemo(() => {
    const activeTab = tabSpecs.find((tab) => tab.key === activeTabKey);
    return activeTab?.chartBanner;
  }, [activeTabKey, tabSpecs]);

  return (
    <ChartCardDragAndResizeContainer
      dragAndDropOptions={dragAndDropOptions}
      resizeOptions={resizeOptions}>
      <ChartCard
        titleLabel={titleLabel}
        titleTooltipLabel={titleTooltipLabel}
        titleSuffix={titleSuffix}
        secondaryAction={secondaryAction}
        headerActionItems={headerActionItems}
        headerActions={headerActions}
        downloadAction={downloadAction}
        overflowMenuContent={overflowMenuContent}
        footerContent={footerContent}
        subTitle={subTitle}
        chartControl={isCompactView ? chartControl : undefined}
        abnormalState={abnormalState}
        chartBanner={chartBanner}
        slots={slots}>
        {children}
      </ChartCard>
    </ChartCardDragAndResizeContainer>
  );
};

// memo() erases generic type parameters; cast through unknown to restore them
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- restoring generic type params erased by memo()
export default memo(TabbedChartsCardContainer) as unknown as typeof TabbedChartsCardContainer;
