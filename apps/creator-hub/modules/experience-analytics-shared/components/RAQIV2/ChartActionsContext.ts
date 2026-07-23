import { createContext, useContext } from 'react';
import type { ChartCardHeaderAction } from '@rbx/analytics-ui';

/**
 * Surface-installed override for chart header chrome.
 *
 * - `false`: hide all header actions
 * - `actions`: replace the RAQI defaults
 * - omitted: use RAQI defaults
 */
export type ChartActionsPolicy =
  | false
  | {
      readonly actions?: readonly ChartCardHeaderAction[];
    };

const ChartActionsContext = createContext<ChartActionsPolicy | null>(null);

export const ChartActionsProvider = ChartActionsContext.Provider;

export function useChartActionsPolicy(): ChartActionsPolicy | null {
  return useContext(ChartActionsContext);
}
