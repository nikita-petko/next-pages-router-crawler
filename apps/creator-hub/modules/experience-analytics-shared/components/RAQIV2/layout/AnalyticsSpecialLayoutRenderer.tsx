import React, { useMemo, useState } from 'react';
import type { SelectionCallback } from '@rbx/analytics-ui';
import type { TGridProps } from '@rbx/ui';
import { Grid, MenuItem, Select } from '@rbx/ui';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import { useScrollToHashTarget } from '../../../hooks/useScrollToHashTarget';
import type { RAQIV2ChartUpdatePolicy } from '../../../types/GenericRAQIV2ChartProps';
import type RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import type { AnalyticsComponentConfig } from '../../../types/RAQIV2PageConfig';
import type {
  RAQIV2SpecialLayoutConfig,
  RAQIV2VerticalPriorityLayoutConfig,
  RAQIV2FullWidthLayoutConfig,
  RAQIV2RowLayoutConfig,
  RAQIV2TwoPerRowLayoutConfig,
  RAQIV2DropdownSelectorLayoutConfig,
  RAQIV2SectionTitleLayoutConfig,
} from '../../../types/RAQIV2SpecialLayoutConfig';
import { RAQIV2SpecialLayoutType } from '../../../types/RAQIV2SpecialLayoutConfig';
import computeRAQIV2SpecialLayoutGridContainerStylingOverride from '../../../utils/computeRAQIV2SpecialLayoutGridContainerStylingOverride';
import getUniqueKeyForAnalyticsComponent from '../../../utils/getUniqueKeyForAnalyticsComponent';
import type { UniqueKeyForAnalyticsComponent } from '../../../utils/getUniqueKeyForKeyOrConfig';
import RAQIV2SectionTitle from '../RAQIV2SectionTitle';
import AnalyticsComponent from './AnalyticsComponent';
import useDropdownSelectorLayoutStyles from './DropdownSelectorLayout.styles';
import GenericAnalyticsLayoutItem from './GenericAnalyticsLayoutItem';
import getReactKey from './getReactKey';

type SpecialLayoutChartProps = {
  chartContext: RAQIV2ChartContext;
  onSelectChartRegion: null | SelectionCallback<number>;
  chartUpdatePolicy?: RAQIV2ChartUpdatePolicy;
};

const VerticalPriorityLayoutComponent: React.FC<
  {
    config: RAQIV2VerticalPriorityLayoutConfig<AnalyticsComponentConfig>;
  } & SpecialLayoutChartProps
> = ({ config, chartContext, onSelectChartRegion, chartUpdatePolicy }) => {
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
            chartUpdatePolicy={chartUpdatePolicy}
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
            chartUpdatePolicy={chartUpdatePolicy}
          />
        ))}
      </GenericAnalyticsLayoutItem>
    </Grid>
  );
};

const FullWidthLayoutComponent: React.FC<
  {
    config: RAQIV2FullWidthLayoutConfig<AnalyticsComponentConfig>;
  } & SpecialLayoutChartProps
> = ({ config, chartContext, onSelectChartRegion, chartUpdatePolicy }) => {
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
            chartUpdatePolicy={chartUpdatePolicy}
          />
        </GenericAnalyticsLayoutItem>
      ))}
    </Grid>
  );
};

/**
 * Renders all items side-by-side at their NATURAL CONTENT WIDTH (no flex
 * sizing). Items do not wrap; this is intended for compact rows of summary
 * cards. See `RAQIV2SpecialLayoutType.RowLayout` for when to choose this over
 * `TwoPerRowLayout`.
 */
const RowLayoutComponent: React.FC<
  {
    config: RAQIV2RowLayoutConfig<AnalyticsComponentConfig>;
  } & SpecialLayoutChartProps
> = ({ config, chartContext, onSelectChartRegion, chartUpdatePolicy }) => {
  const styleOverride = computeRAQIV2SpecialLayoutGridContainerStylingOverride(
    RAQIV2SpecialLayoutType.RowLayout,
    config,
  );

  return (
    <Grid {...styleOverride}>
      {config.items.map((item) => (
        <GenericAnalyticsLayoutItem
          layout={RAQIV2SpecialLayoutType.RowLayout}
          key={getReactKey(item)}>
          <AnalyticsComponent
            config={item}
            chartContext={chartContext}
            onSelectChartRegion={onSelectChartRegion}
            chartUpdatePolicy={chartUpdatePolicy}
          />
        </GenericAnalyticsLayoutItem>
      ))}
    </Grid>
  );
};

// Opt-in responsive item sizing for TwoPerRowLayout: full-width on compact
// screens, then 50% width (two-per-row) from the Medium breakpoint up. Applied
// per-instance only when the config sets `stackOnCompact`. Hoisted to a module
// constant so the reference stays stable across renders for the item's memo.
const TWO_PER_ROW_STACK_ON_COMPACT_ITEM_PROPS: TGridProps = {
  XSmall: 12,
  Medium: 6,
};

/**
 * Renders items in fixed 50/50 columns that WRAP onto additional rows of two
 * as needed (ceil(N / 2) rows; odd final item takes the left half).
 *
 * Responsiveness is opt-in via `config.stackOnCompact`: when set, items render
 * full-width on compact screens and switch to two-per-row from Medium up;
 * otherwise items stay at 50% width at every breakpoint.
 *
 * Differs from `RowLayoutComponent` in that:
 *   - Each item has an enforced 50% width (from Medium up when responsive)
 *     rather than its intrinsic content width.
 *   - Overflow wraps to a new row instead of overflowing horizontally.
 *   - The container is tagged with `data-raqi-layout="row"` so the
 *     resizable-charts drag/drop logic (see `draganddropcharts.stories.tsx`)
 *     can locate it for resize math. Keep this attribute on `TwoPerRowLayout`
 *     only; `RowLayout` should not carry it because its items are not
 *     equal-width and would confuse the resize logic.
 */
const TwoPerRowLayoutComponent: React.FC<
  {
    config: RAQIV2TwoPerRowLayoutConfig<AnalyticsComponentConfig>;
  } & SpecialLayoutChartProps
> = ({ config, chartContext, onSelectChartRegion, chartUpdatePolicy }) => {
  const styleOverride = computeRAQIV2SpecialLayoutGridContainerStylingOverride(
    RAQIV2SpecialLayoutType.TwoPerRowLayout,
    config,
  );

  const itemGridPropsOverride = config.stackOnCompact
    ? TWO_PER_ROW_STACK_ON_COMPACT_ITEM_PROPS
    : undefined;

  return (
    <Grid {...styleOverride} data-raqi-layout='row'>
      {config.items.map((item) => (
        <GenericAnalyticsLayoutItem
          layout={RAQIV2SpecialLayoutType.TwoPerRowLayout}
          gridPropsOverride={itemGridPropsOverride}
          key={getReactKey(item)}>
          <AnalyticsComponent
            config={item}
            chartContext={chartContext}
            onSelectChartRegion={onSelectChartRegion}
            chartUpdatePolicy={chartUpdatePolicy}
          />
        </GenericAnalyticsLayoutItem>
      ))}
    </Grid>
  );
};

const DropdownSelectorLayoutComponent: React.FC<
  {
    config: RAQIV2DropdownSelectorLayoutConfig<AnalyticsComponentConfig>;
  } & SpecialLayoutChartProps
> = ({ config, chartContext, onSelectChartRegion, chartUpdatePolicy }) => {
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
              // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- MUI Select returns unknown; value is constrained to valid keys via the items prop above.
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
                chartUpdatePolicy={chartUpdatePolicy}
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
} & SpecialLayoutChartProps;

const AnalyticsSpecialLayoutRenderer: React.FC<AnalyticsSpecialLayoutRendererProps> = ({
  component,
  chartContext,
  onSelectChartRegion,
  chartUpdatePolicy,
}) => {
  switch (component.type) {
    case RAQIV2SpecialLayoutType.VerticalPriorityLayout: {
      return (
        <VerticalPriorityLayoutComponent
          config={component}
          chartContext={chartContext}
          onSelectChartRegion={onSelectChartRegion}
          chartUpdatePolicy={chartUpdatePolicy}
        />
      );
    }
    case RAQIV2SpecialLayoutType.FullWidthLayout: {
      return (
        <FullWidthLayoutComponent
          config={component}
          chartContext={chartContext}
          onSelectChartRegion={onSelectChartRegion}
          chartUpdatePolicy={chartUpdatePolicy}
        />
      );
    }
    case RAQIV2SpecialLayoutType.RowLayout: {
      return (
        <RowLayoutComponent
          config={component}
          chartContext={chartContext}
          onSelectChartRegion={onSelectChartRegion}
          chartUpdatePolicy={chartUpdatePolicy}
        />
      );
    }
    case RAQIV2SpecialLayoutType.TwoPerRowLayout: {
      return (
        <TwoPerRowLayoutComponent
          config={component}
          chartContext={chartContext}
          onSelectChartRegion={onSelectChartRegion}
          chartUpdatePolicy={chartUpdatePolicy}
        />
      );
    }
    case RAQIV2SpecialLayoutType.DropdownSelectorLayout: {
      return (
        <DropdownSelectorLayoutComponent
          config={component}
          chartContext={chartContext}
          onSelectChartRegion={onSelectChartRegion}
          chartUpdatePolicy={chartUpdatePolicy}
        />
      );
    }
    case RAQIV2SpecialLayoutType.SectionTitle: {
      return <AnalyticsSectionTitleLayout config={component} />;
    }
    default: {
      const exhaustiveCheck: never = component;
      throw new Error(`Unsupported special layout type ${String(exhaustiveCheck)}`);
    }
  }
};

export default AnalyticsSpecialLayoutRenderer;
