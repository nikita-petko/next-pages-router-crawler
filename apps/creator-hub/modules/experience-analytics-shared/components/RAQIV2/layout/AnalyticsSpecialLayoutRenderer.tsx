import React, { useMemo, useState } from 'react';
import { Grid, MenuItem, Select } from '@rbx/ui';
import { SelectionCallback } from '@rbx/analytics-ui';
import {
  RAQIV2SpecialLayoutType,
  RAQIV2SpecialLayoutConfig,
  RAQIV2VerticalPriorityLayoutConfig,
  RAQIV2FullWidthLayoutConfig,
  RAQIV2RowLayoutConfig,
  RAQIV2DropdownSelectorLayoutConfig,
  RAQIV2SectionTitleLayoutConfig,
} from '../../../types/RAQIV2SpecialLayoutConfig';
import RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import { AnalyticsComponentConfig } from '../../../types/RAQIV2PageConfig';
import computeRAQIV2SpecialLayoutGridContainerStylingOverride from '../../../utils/computeRAQIV2SpecialLayoutGridContainerStylingOverride';
import GenericAnalyticsLayoutItem from './GenericAnalyticsLayoutItem';
import AnalyticsComponent from './AnalyticsComponent';
import getReactKey from './getReactKey';
import getUniqueKeyForAnalyticsComponent, {
  UniqueKeyForAnalyticsComponent,
} from '../../../utils/getUniqueKeyForAnalyticsComponent';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import useDropdownSelectorLayoutStyles from './DropdownSelectorLayout.styles';
import RAQIV2SectionTitle from '../RAQIV2SectionTitle';
import useScrollToHashTarget from '../../../hooks/useScrollToHashTarget';

const VerticalPriorityLayoutComponent: React.FC<{
  config: RAQIV2VerticalPriorityLayoutConfig<AnalyticsComponentConfig>;
  chartContext: RAQIV2ChartContext;
  onSelectChartRegion: null | SelectionCallback<number>;
}> = ({ config, chartContext, onSelectChartRegion }) => {
  const styleOverride = computeRAQIV2SpecialLayoutGridContainerStylingOverride(
    RAQIV2SpecialLayoutType.VerticalPriorityLayout,
    config,
  );
  const { firstColumn, secondColumn } = config;

  return (
    <Grid {...styleOverride}>
      <GenericAnalyticsLayoutItem layout={RAQIV2SpecialLayoutType.VerticalPriorityLayout}>
        {firstColumn.map((item) => (
          <AnalyticsComponent
            key={getReactKey(item)}
            config={item}
            chartContext={chartContext}
            onSelectChartRegion={onSelectChartRegion}
          />
        ))}
      </GenericAnalyticsLayoutItem>
      <GenericAnalyticsLayoutItem layout={RAQIV2SpecialLayoutType.VerticalPriorityLayout}>
        {secondColumn.map((item) => (
          <AnalyticsComponent
            key={getReactKey(item)}
            config={item}
            chartContext={chartContext}
            onSelectChartRegion={onSelectChartRegion}
          />
        ))}
      </GenericAnalyticsLayoutItem>
    </Grid>
  );
};

const FullWidthLayoutComponent: React.FC<{
  config: RAQIV2FullWidthLayoutConfig<AnalyticsComponentConfig>;
  chartContext: RAQIV2ChartContext;
  onSelectChartRegion: null | SelectionCallback<number>;
}> = ({ config, chartContext, onSelectChartRegion }) => {
  const styleOverride = computeRAQIV2SpecialLayoutGridContainerStylingOverride(
    RAQIV2SpecialLayoutType.FullWidthLayout,
    config,
  );

  return (
    <Grid {...styleOverride}>
      {config.items.map((item) => (
        <GenericAnalyticsLayoutItem
          layout={RAQIV2SpecialLayoutType.FullWidthLayout}
          key={getReactKey(item)}>
          <AnalyticsComponent
            config={item}
            chartContext={chartContext}
            onSelectChartRegion={onSelectChartRegion}
          />
        </GenericAnalyticsLayoutItem>
      ))}
    </Grid>
  );
};

const RowLayoutComponent: React.FC<{
  config: RAQIV2RowLayoutConfig<AnalyticsComponentConfig>;
  chartContext: RAQIV2ChartContext;
  onSelectChartRegion: null | SelectionCallback<number>;
}> = ({ config, chartContext, onSelectChartRegion }) => {
  const styleOverride = computeRAQIV2SpecialLayoutGridContainerStylingOverride(
    RAQIV2SpecialLayoutType.RowLayout,
    config,
  );

  return (
    <Grid {...styleOverride} data-raqi-layout='row'>
      {config.items.map((item) => (
        <GenericAnalyticsLayoutItem
          layout={RAQIV2SpecialLayoutType.RowLayout}
          key={getReactKey(item)}>
          <AnalyticsComponent
            config={item}
            chartContext={chartContext}
            onSelectChartRegion={onSelectChartRegion}
          />
        </GenericAnalyticsLayoutItem>
      ))}
    </Grid>
  );
};

const DropdownSelectorLayoutComponent: React.FC<{
  config: RAQIV2DropdownSelectorLayoutConfig<AnalyticsComponentConfig>;
  chartContext: RAQIV2ChartContext;
  onSelectChartRegion: null | SelectionCallback<number>;
}> = ({ config, chartContext, onSelectChartRegion }) => {
  const { items: givenItems, label, id } = config;
  const items = useMemo(
    () =>
      givenItems.map((item) => ({
        ...item,
        uniqueKey: getUniqueKeyForAnalyticsComponent(item.value),
      })),
    [givenItems],
  );
  const [selectedKey, setSelectedKey] = useState<UniqueKeyForAnalyticsComponent | null>(
    items[0].uniqueKey,
  );
  const selectedComponent = useMemo(
    () => items.find((item) => item.uniqueKey === selectedKey)?.value,
    [items, selectedKey],
  );

  const { translate } = useRAQIV2TranslationDependencies();

  const selectorLabel = useMemo(() => translate(label), [label, translate]);

  const {
    classes: { selectorWidth },
  } = useDropdownSelectorLayoutStyles();

  // Scroll to element when URL hash matches, waiting for content to load
  const scrollTargetRef = useScrollToHashTarget({
    targetId: id ?? '',
    enabled: !!id,
  });

  const styleOverride = computeRAQIV2SpecialLayoutGridContainerStylingOverride(
    RAQIV2SpecialLayoutType.DropdownSelectorLayout,
    config,
  );

  return (
    <Grid {...styleOverride}>
      <Grid container direction='column' spacing={2}>
        <Grid item>
          <Select
            label={selectorLabel}
            size='medium'
            className={selectorWidth}
            value={selectedKey}
            onChange={(event) =>
              setSelectedKey(event.target.value as UniqueKeyForAnalyticsComponent)
            }>
            {items.map((item) => (
              <MenuItem key={item.uniqueKey} value={item.uniqueKey}>
                {translate(item.label)}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item id={id} ref={scrollTargetRef}>
          {selectedComponent && (
            <GenericAnalyticsLayoutItem
              layout={RAQIV2SpecialLayoutType.DropdownSelectorLayout}
              key={selectedKey}>
              <AnalyticsComponent
                config={selectedComponent}
                chartContext={chartContext}
                onSelectChartRegion={onSelectChartRegion}
              />
            </GenericAnalyticsLayoutItem>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

const AnalyticsSectionTitleLayout: React.FC<{
  config: RAQIV2SectionTitleLayoutConfig;
}> = ({ config }) => {
  const styleOverride = computeRAQIV2SpecialLayoutGridContainerStylingOverride(
    RAQIV2SpecialLayoutType.SectionTitle,
    config,
  );

  return (
    <Grid {...styleOverride}>
      <RAQIV2SectionTitle {...config} />
    </Grid>
  );
};

type AnalyticsSpecialLayoutRendererProps = {
  component: RAQIV2SpecialLayoutConfig<AnalyticsComponentConfig>;
  chartContext: RAQIV2ChartContext;
  onSelectChartRegion: null | SelectionCallback<number>;
};

const AnalyticsSpecialLayoutRenderer: React.FC<AnalyticsSpecialLayoutRendererProps> = ({
  component,
  chartContext,
  onSelectChartRegion,
}) => {
  switch (component.type) {
    case RAQIV2SpecialLayoutType.VerticalPriorityLayout: {
      return (
        <VerticalPriorityLayoutComponent
          config={component}
          chartContext={chartContext}
          onSelectChartRegion={onSelectChartRegion}
        />
      );
    }
    case RAQIV2SpecialLayoutType.FullWidthLayout: {
      return (
        <FullWidthLayoutComponent
          config={component}
          chartContext={chartContext}
          onSelectChartRegion={onSelectChartRegion}
        />
      );
    }
    case RAQIV2SpecialLayoutType.RowLayout: {
      return (
        <RowLayoutComponent
          config={component}
          chartContext={chartContext}
          onSelectChartRegion={onSelectChartRegion}
        />
      );
    }
    case RAQIV2SpecialLayoutType.DropdownSelectorLayout: {
      return (
        <DropdownSelectorLayoutComponent
          config={component}
          chartContext={chartContext}
          onSelectChartRegion={onSelectChartRegion}
        />
      );
    }
    case RAQIV2SpecialLayoutType.SectionTitle: {
      return <AnalyticsSectionTitleLayout config={component} />;
    }
    default: {
      const exhaustiveCheck: never = component;
      throw new Error(`Unsupported special layout type ${exhaustiveCheck}`);
    }
  }
};

export default AnalyticsSpecialLayoutRenderer;
