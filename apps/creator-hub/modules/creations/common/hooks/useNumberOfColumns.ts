import { useEffect, useMemo, useState } from 'react';
import type { TTheme } from '@rbx/ui';
import { useMediaQuery, useTheme } from '@rbx/ui';
import { leftNavigationWidths } from '@modules/navigation/layout/components/Layout.styles';

export function getNumColumns(
  pageWidth: number,
  gridItemWidth: number,
  numColumnsCompact: number,
  gridGapThemeValue: number,
  gridGapThemeValueCompact: number,
  compact: boolean,
  theme: TTheme,
) {
  const leftNavigationWidth = compact ? 0 : leftNavigationWidths.large;
  const gridGapValue = compact ? gridGapThemeValueCompact : gridGapThemeValue;
  const gridGapSpacing = parseInt(theme.spacing(gridGapValue), 10);

  const gridSize = pageWidth - leftNavigationWidth - gridGapSpacing;
  const gridItemWidthWithPadding = gridItemWidth + gridGapSpacing;

  return Math.max(Math.floor(gridSize / gridItemWidthWithPadding), numColumnsCompact);
}

/** Calculates the number of columns to display based on the *initial* page width, does not update on resize */
function useNumberOfColumns(
  gridItemWidth: number,
  numColumnsCompact: number,
  gridGapThemeValue: number,
  gridGapThemeValueCompact: number,
) {
  const theme = useTheme();
  // noSsr is necessary otherwise this returns false on page load
  const isCompactView = useMediaQuery(theme.breakpoints.down('Medium'), { noSsr: true });

  const [isCompact, setIsCompact] = useState(isCompactView);
  const [pageWidth, setPageWidth] = useState(
    typeof document !== 'undefined' ? document.body.scrollWidth : 0,
  );

  useEffect(() => {
    setIsCompact(isCompactView);
    setPageWidth(document.body.scrollWidth);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- capture real client values once after SSR hydration; intentionally not reactive to viewport changes
  }, []);

  return useMemo(
    () =>
      getNumColumns(
        pageWidth,
        gridItemWidth,
        numColumnsCompact,
        gridGapThemeValue,
        gridGapThemeValueCompact,
        isCompact,
        theme,
      ),
    [
      pageWidth,
      gridItemWidth,
      numColumnsCompact,
      gridGapThemeValue,
      gridGapThemeValueCompact,
      isCompact,
      theme,
    ],
  );
}

export default useNumberOfColumns;
