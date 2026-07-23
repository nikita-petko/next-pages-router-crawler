import React, { memo, ReactNode, useCallback, useMemo } from 'react';
import { Container, makeStyles, Tab, Tabs } from '@rbx/ui';
import ChartCard, { ChartCardProps } from './ChartCard';
import { ChartPlaceholderProps } from './ChartPlaceholder';

type LabelOnlyTabSpec<TTabKey> = {
  key: TTabKey;
  label: ReactNode;
  abnormalState?: ChartPlaceholderProps;
};

type TabbedTimeComparatorChartsCardContainerProps<TTabKey> = Omit<
  ChartCardProps,
  'subTitle' | 'abnormalState'
> & {
  tabSpecs: Array<LabelOnlyTabSpec<TTabKey>>;
  subtitleComponent?: ReactNode;
  activeTabKey: TTabKey;
  onActiveTabChanged: (tabKey: TTabKey) => void;
};

const useStyles = makeStyles()(() => ({
  subTitleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0px 4px',
    flexDirection: 'column',
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

const TabbedTimeComparatorChartsCardContainer = <TTabKey extends string | number>({
  children,
  titleLabel,
  titleTooltipLabel,
  footerContent,
  downloadAction,
  subtitleComponent,
  tabSpecs,
  activeTabKey,
  onActiveTabChanged,
}: React.PropsWithChildren<TabbedTimeComparatorChartsCardContainerProps<TTabKey>>) => {
  const {
    classes: { subTitleContainer, tabContainer },
  } = useStyles();

  const handleTabChange = useCallback(
    (_: React.ChangeEvent<object>, newValue: TTabKey) => {
      onActiveTabChanged(newValue);
    },
    [onActiveTabChanged],
  );

  const subTitle = useMemo(() => {
    return (
      <Container disableGutters classes={{ root: subTitleContainer }} maxWidth={false}>
        {subtitleComponent}
        <Tabs
          value={activeTabKey}
          variant='scrollable'
          onChange={handleTabChange}
          aria-label='tabs'
          scrollButtons={false}>
          {tabSpecs.map(({ key, label }) => {
            return <Tab label={label} value={key} key={key} classes={{ root: tabContainer }} />;
          })}
        </Tabs>
      </Container>
    );
  }, [activeTabKey, handleTabChange, subTitleContainer, subtitleComponent, tabContainer, tabSpecs]);

  const abnormalState = useMemo(() => {
    const activeTab = tabSpecs.find((tab) => tab.key === activeTabKey);
    return activeTab?.abnormalState;
  }, [activeTabKey, tabSpecs]);

  return (
    <ChartCard
      titleLabel={titleLabel}
      titleTooltipLabel={titleTooltipLabel}
      downloadAction={downloadAction}
      footerContent={footerContent}
      subTitle={subTitle}
      abnormalState={abnormalState}>
      {children}
    </ChartCard>
  );
};

export default memo(TabbedTimeComparatorChartsCardContainer);
