import { createContext, useContext } from 'react';
import type { ChartCardHeaderAction } from '@rbx/analytics-ui';

export type ChartHeaderActionLayout = {
  readonly showExploreAction?: boolean;
  readonly showDownloadAction?: boolean;
  readonly showCreateAlertAction?: boolean;
  readonly showViewSourceQueryAction?: boolean;
};

export type ChartSecondaryAction = {
  readonly menuAction: ChartCardHeaderAction;
  readonly inlineAction?: ChartCardHeaderAction;
};

export type ChartActionsReplacementPolicy = {
  readonly actions: readonly ChartCardHeaderAction[];
};

export type ChartActionsCompositionPolicy = {
  readonly strategy: 'compose';
  readonly overrides?: ChartHeaderActionLayout;
  readonly primaryActions?: readonly ChartCardHeaderAction[];
  readonly secondaryActions?: readonly ChartSecondaryAction[];
};

/**
 * Surface-installed policy for chart header chrome.
 *
 * - `false`: hide all header actions
 * - `actions`: replace the RAQI defaults
 * - `compose`: override defaults and contribute actions before layout resolution
 * - omitted: use RAQI defaults
 */
export type ChartActionsPolicy =
  | false
  | ChartActionsReplacementPolicy
  | ChartActionsCompositionPolicy;

const ChartActionsContext = createContext<ChartActionsPolicy | null>(null);

export const ChartActionsProvider = ChartActionsContext.Provider;

export function useChartActionsPolicy(): ChartActionsPolicy | null {
  return useContext(ChartActionsContext);
}
