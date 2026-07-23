import type { ReactNode, FC } from 'react';
import React, { useContext, createContext, useCallback, useMemo, useState } from 'react';
import { Grid } from '@rbx/ui';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useGetInsightsV2Specs from '@modules/experience-analytics-shared/hooks/useGetInsightsV2Specs';
import type {
  SummaryReport7DaysCardSpec,
  SummaryReportCardSpec,
} from '@modules/experience-analytics-shared/types/insights';
import { InsightTypeV2 } from '@modules/experience-analytics-shared/types/insights';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import AssistantSummaryDisplayConfigs from '../constants/AssistantSummaryDisplayConfigs';
import useGetAssistantSummaryInsightSpecByInsightId from '../hooks/useGetAssistantSummaryInsightSpecs';
import type { AssistantSummaryInsightSpec } from '../types/AssistantSummaryInsightSpec';

export interface AssistantSurfaceContextProps {
  assistantSummarySpec: AssistantSummaryInsightSpec | null;
  isAssistantSummarySpecLoading: boolean;
  historicalSummaryInsights: (SummaryReportCardSpec | SummaryReport7DaysCardSpec)[] | null;
  isHistoricalSummaryReportInsightsLoading: boolean;
  activeSection: string;
  canvasElementsBySectionId: Record<string, React.ReactNode>;
  canvasContent: React.ReactNode;
  setActiveSection: (sectionId: string) => void;
  registerCanvasElement: (sectionId: string, element: React.ReactNode) => void;
}

export const AssistantSurfaceContext = createContext<AssistantSurfaceContextProps>({
  assistantSummarySpec: null,
  isAssistantSummarySpecLoading: false,
  historicalSummaryInsights: null,
  isHistoricalSummaryReportInsightsLoading: true,
  activeSection: '',
  canvasElementsBySectionId: {},
  canvasContent: null,
  setActiveSection: () => {},
  registerCanvasElement: () => {},
});

export interface AssistantSurfaceProviderProps {
  children: ReactNode;
  initialCanvasVisible?: boolean;
}

const DEFAULT_SECTION_ID = '0';
const getQueryActiveSection = (section: string | string[] | null | undefined): string => {
  return typeof section === 'string' ? section : DEFAULT_SECTION_ID;
};

export const AssistantSurfaceProvider: FC<React.PropsWithChildren> = ({ children }) => {
  const { id: universeId } = useUniverseResource();

  // NOTE(lucaswang, 2025-02-28): Unless otherwise specified, we default to the first section.
  // If the section is invalid on page load, we do not show the canvas until the user clicks on a valid section.
  const [
    {
      [AnalyticsQueryParams.ActiveSection]: queryParamActiveSectionId,
      [AnalyticsQueryParams.InsightId]: queryParamInsightId,
    },
    setQueryParamValues,
  ] = useQueryParams([AnalyticsQueryParams.ActiveSection, AnalyticsQueryParams.InsightId]);

  const [activeSectionId, setActiveSectionId] = useState<string>(
    getQueryActiveSection(queryParamActiveSectionId),
  );
  const [canvasElementsBySectionId, setCanvasElementsBySectionId] = useState<
    Record<string, React.ReactNode>
  >({});

  const insightId = useMemo(() => {
    if (!queryParamInsightId) {
      return undefined;
    }
    if (Array.isArray(queryParamInsightId)) {
      return queryParamInsightId[0];
    }

    return queryParamInsightId;
  }, [queryParamInsightId]);

  const { data: assistantSummarySpec, isLoading: isAssistantSummarySpecLoading } =
    useGetAssistantSummaryInsightSpecByInsightId(universeId, insightId);

  const { data: insightsData, isDataLoading: isHistoricalSummaryReportInsightsLoading } =
    useGetInsightsV2Specs(
      universeId,
      [InsightTypeV2.SummaryReport, InsightTypeV2.SummaryReport7Days],
      12,
    );

  const historicalSummaryInsights = useMemo(() => {
    if (isHistoricalSummaryReportInsightsLoading) {
      return null;
    }

    const specs = insightsData?.insightCardSpecs;
    if (!specs) {
      return null;
    }
    const filtered = specs.filter(
      (spec) =>
        spec.type === InsightTypeV2.SummaryReport || spec.type === InsightTypeV2.SummaryReport7Days,
    );
    // Selector order: newest report end first (not merge order from insightCardSpecs).
    return [...filtered].sort((a, b) => b.endDate.getTime() - a.endDate.getTime());
  }, [insightsData, isHistoricalSummaryReportInsightsLoading]);

  // --- Internal preload state (not exposed in context interface) ---
  const preloadEnabled = useMemo(() => {
    if (!assistantSummarySpec) {
      return false;
    }
    return AssistantSummaryDisplayConfigs[assistantSummarySpec.type].preloadCanvasSections ?? false;
  }, [assistantSummarySpec]);

  const registerCanvasElement = useCallback((sectionId: string, element: React.ReactNode) => {
    setCanvasElementsBySectionId((prev) => {
      if (prev[sectionId] === element) {
        return prev;
      }
      return { ...prev, [sectionId]: element };
    });
  }, []);

  const setActiveSection = useCallback(
    (sectionId: string) => {
      setActiveSectionId(sectionId);
      setQueryParamValues({ [AnalyticsQueryParams.ActiveSection]: sectionId });
    },
    [setQueryParamValues],
  );

  const canvasContent = useMemo(() => {
    if (!canvasElementsBySectionId[activeSectionId]) {
      return null;
    }

    if (preloadEnabled) {
      return Object.entries(canvasElementsBySectionId).map(([sectionId, element]) => (
        <div key={sectionId} style={{ display: sectionId === activeSectionId ? 'block' : 'none' }}>
          <Grid container direction='row' spacing={2}>
            {element}
          </Grid>
        </div>
      ));
    }

    return (
      <Grid container direction='row' spacing={2}>
        {canvasElementsBySectionId[activeSectionId]}
      </Grid>
    );
  }, [canvasElementsBySectionId, activeSectionId, preloadEnabled]);

  const value = useMemo(
    () => ({
      assistantSummarySpec,
      isAssistantSummarySpecLoading,
      historicalSummaryInsights,
      isHistoricalSummaryReportInsightsLoading,
      activeSection: activeSectionId,
      canvasElementsBySectionId,
      canvasContent,
      setActiveSection,
      registerCanvasElement,
    }),
    [
      assistantSummarySpec,
      isAssistantSummarySpecLoading,
      historicalSummaryInsights,
      isHistoricalSummaryReportInsightsLoading,
      activeSectionId,
      canvasElementsBySectionId,
      canvasContent,
      setActiveSection,
      registerCanvasElement,
    ],
  );
  return (
    <AssistantSurfaceContext.Provider value={value}>{children}</AssistantSurfaceContext.Provider>
  );
};

export const useAssistantSurfaceContext = () => {
  const context = useContext(AssistantSurfaceContext);
  if (!context) {
    throw new Error('useAssistantSurfaceContext must be used within an AssistantSurfaceProvider');
  }
  return context;
};
