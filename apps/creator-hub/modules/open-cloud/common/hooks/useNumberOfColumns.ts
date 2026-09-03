import { useEffect, useMemo, useState } from 'react';
import { useMediaQuery, useTheme } from '@rbx/ui';
import type ItemGridCSSProperties from '../interfaces/ItemGridCSSProperties';
import type ItemGridCursorPagerProperties from '../interfaces/ItemGridCursorPagerProperties';

function useNumberOfColumns(
  itemGridCSSProperties: ItemGridCSSProperties,
  getNumColumns: ItemGridCursorPagerProperties['getNumColumns'],
  getGridWidth: () => number | undefined,
) {
  const theme = useTheme();
  // noSsr is necessary otherwise this returns false on page load
  const isCompactView = useMediaQuery(theme.breakpoints.down('Medium'), { noSsr: true });
  const [pageWidth, setPageWidth] = useState<number>(
    // document is undefined on first page load, pageWidth will be set in useEffect anyway.
    getGridWidth() ?? (typeof document !== 'undefined' ? document.body.scrollWidth : 0),
  );

  const numColumns = useMemo(() => {
    return getNumColumns(pageWidth, itemGridCSSProperties, isCompactView, theme);
  }, [getNumColumns, isCompactView, itemGridCSSProperties, pageWidth, theme]);

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setPageWidth(getGridWidth() ?? document.body.scrollWidth);
    }

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  return numColumns;
}

export default useNumberOfColumns;
