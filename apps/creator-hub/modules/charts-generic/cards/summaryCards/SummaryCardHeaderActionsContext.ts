import { createContext, useContext, type ReactNode } from 'react';

/**
 * Optional header actions (e.g. editor edit/overflow chrome) rendered inline
 * with the summary card title. Surfaces like the custom-dashboard editor
 * install this via `SummaryCardHeaderActionsProvider`.
 */
const SummaryCardHeaderActionsContext = createContext<ReactNode>(null);

export const SummaryCardHeaderActionsProvider = SummaryCardHeaderActionsContext.Provider;

export function useSummaryCardHeaderActions(): ReactNode {
  return useContext(SummaryCardHeaderActionsContext);
}
