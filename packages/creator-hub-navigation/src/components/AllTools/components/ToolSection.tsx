import React, { useMemo } from 'react';
import { Divider, makeStyles } from '@rbx/ui';
import { RAIL_HORIZONTAL_PADDING } from '../../../layout/constants';
import type { TTool } from '../hooks/useTools';
import ToolsList from './ToolsList';

type TToolSectionProps = {
  tools: (TTool | undefined)[];
  columns: number;
  onToolSelect: (key: string) => void;
  /** Most-specific active key across all All Tools links. */
  selectedKey: string | null;
  /** First section under the All Tools title — keeps ~20px from title text to divider */
  isFirst?: boolean;
};

// First section sits under the 40px header (title band ends at y=56). 7px drops
// the divider line to y=63 — matching the Figma flyout header divider — and 8px
// below the line lands the first tool row at y=72, exactly where the primary
// rail's first nav item sits.
const FIRST_DIVIDER_PAD_TOP = 7;
// 8px below the divider → first tool row at y=72 (was 10 — 2px too low).
const FIRST_DIVIDER_PAD_BOTTOM = 8;
// Between sections, mirror the primary rail's divider footprint so tool rows
// share the same 48px grid as primary nav. Primary draws
// `<div className='padding-y-small'><Divider/></div>` inside a `gap: 8` flex
// container → 8 (gap) + 8 (pad) + 1 (line) + 8 (pad) + 8 (gap) = 33px between
// item boxes, hairline centered. 16px on each side of the line reproduces it.
const SECTION_DIVIDER_PAD = RAIL_HORIZONTAL_PADDING;
// AllTools container already provides RAIL_HORIZONTAL_PADDING from the panel
// edge, so section dividers need no extra horizontal inset.
const DIVIDER_HORIZONTAL_PAD = 0;
const ROW_GAP = 8;
const COLUMN_GAP = RAIL_HORIZONTAL_PADDING;

const useStyles = makeStyles<{ isFirst: boolean }>()((_theme, { isFirst }) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  divider: {
    paddingTop: isFirst ? FIRST_DIVIDER_PAD_TOP : SECTION_DIVIDER_PAD,
    paddingBottom: isFirst ? FIRST_DIVIDER_PAD_BOTTOM : SECTION_DIVIDER_PAD,
    paddingLeft: DIVIDER_HORIZONTAL_PAD,
    paddingRight: DIVIDER_HORIZONTAL_PAD,
    flexShrink: 0,
  },
  // Explicit flex columns (not CSS multi-column). Flex `gap` never leaves a
  // trailing margin on the last item of a column, so section height is exactly
  // rows*40 + (rows-1)*8 and every divider lands on the same grid as primary
  // nav. CSS multi-column kept a bottom margin on column 1's last item, which
  // pushed the divider (and all rows below it) ~8px off the grid.
  columnsRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: COLUMN_GAP,
    margin: 0,
    padding: 0,
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 0',
    minWidth: 0,
    gap: ROW_GAP,
    margin: 0,
    padding: 0,
  },
}));

/** A tool occupies one row for its heading plus one row per sub-item. */
const rowCount = (tool: TTool): number => 1 + (tool.items?.length ?? 0);

/**
 * Split tools into columns by minimizing height difference (same balance CSS
 * multi-column aimed for on master — e.g. Finance/Analytics | Collaboration/Ads).
 * On a tie, prefer the later split so User+IP keeps Analytics with Finance
 * (5|4) instead of cutting after Finance alone (4|5).
 */
const splitIntoColumns = (tools: TTool[], columnCount: number): TTool[][] => {
  if (columnCount <= 1 || tools.length <= 1) {
    return [tools];
  }
  const total = tools.reduce((sum, tool) => sum + rowCount(tool), 0);
  let left = 0;
  let bestSplit = 1;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (let i = 0; i < tools.length - 1; i += 1) {
    left += rowCount(tools[i]);
    const diff = Math.abs(left - (total - left));
    if (diff <= bestDiff) {
      bestDiff = diff;
      bestSplit = i + 1;
    }
  }
  return [tools.slice(0, bestSplit), tools.slice(bestSplit)];
};

const ToolSection: React.FC<TToolSectionProps> = ({
  onToolSelect,
  columns,
  tools,
  selectedKey,
  isFirst = false,
}) => {
  const {
    classes: { container, divider, columnsRow, column },
  } = useStyles({ isFirst });
  const filtered = useMemo(() => tools.filter((tool): tool is TTool => Boolean(tool)), [tools]);
  const toolColumns = useMemo(() => splitIntoColumns(filtered, columns), [filtered, columns]);

  if (filtered.length === 0) {
    return null;
  }

  return (
    <div className={container}>
      <div className={divider}>
        <Divider />
      </div>
      <div className={columnsRow}>
        {toolColumns.map((columnTools) => (
          <div key={columnTools.map((tool) => tool.key).join('-')} className={column}>
            {columnTools.map((tool) => (
              <ToolsList
                onToolSelect={onToolSelect}
                key={tool.key}
                tool={tool}
                selectedKey={selectedKey}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToolSection;
