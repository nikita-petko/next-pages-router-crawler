import { useUniverseResource } from '@modules/experience-analytics-shared';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { BarChartIcon } from '@rbx/ui';
import React, { FC, useMemo, useCallback, useEffect } from 'react';
import {
  logAssistantEvent,
  AssistantImpressionEventName,
  AssistantClickEventName,
} from '../../../../utils/AssistantLogger';
import { useAssistantSurfaceContext } from '../../../../context/AssistantSurfaceContextProvider';
import { TAssistantSummaryInsight } from '../../../../types/AssistantSummaryInsightType';
import { ReportSectionType } from '../../../../types/AssistantSummaryInsightSpec';
import GenericReportSectionV2 from './GenericReportSectionV2';
import getCanvasComponent from '../../../../types/canvas';
import { SectionComponentProps } from './types';

const CanvasReportSection: FC<SectionComponentProps<TAssistantSummaryInsight>> = ({
  section,
  children,
}) => {
  if (section.type !== ReportSectionType.Canvas) {
    throw new Error('CanvasReportSection can only render Canvas type sections');
  }

  const { id: universeId } = useUniverseResource();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { assistantSummarySpec, activeSection, setActiveSection, registerCanvasElement } =
    useAssistantSurfaceContext();

  const sectionId = useMemo(
    () => (section.canvas.length === 0 ? null : section.sectionId),
    [section],
  );

  const CanvasComponent = useMemo(() => {
    if (!assistantSummarySpec) return null;
    return getCanvasComponent(assistantSummarySpec.type);
  }, [assistantSummarySpec]);

  const canvasElement = useMemo(() => {
    if (!CanvasComponent || section.canvas.length === 0) {
      return null;
    }

    return <CanvasComponent signals={section.canvas} />;
  }, [section.canvas, CanvasComponent]);

  const iconComponent = useMemo(() => {
    // Don't show icon if there's no canvas OR if there's only one section
    if (!CanvasComponent || (assistantSummarySpec?.report?.sections?.length ?? 0) <= 1) {
      return undefined;
    }
    return BarChartIcon;
  }, [CanvasComponent, assistantSummarySpec?.report?.sections?.length]);

  const logData = useMemo(() => {
    if (!assistantSummarySpec || !sectionId) return undefined;
    return {
      universeId,
      insightId: assistantSummarySpec.insightId,
      insightType: assistantSummarySpec.type,
      reportStartDate: assistantSummarySpec.startDate,
      reportEndDate: assistantSummarySpec.endDate,
      sectionId,
    };
  }, [assistantSummarySpec, universeId, sectionId]);

  const sendImpressionEvent = useCallback(() => {
    if (logData) {
      logAssistantEvent(
        unifiedLogger,
        AssistantImpressionEventName.AssistantReportSectionImpression,
        logData,
      );
    }
  }, [logData, unifiedLogger]);

  const onClick = useCallback(() => {
    if (logData) {
      logAssistantEvent(
        unifiedLogger,
        AssistantClickEventName.AssistantReportSectionClick,
        logData,
      );
    }

    if (sectionId) {
      setActiveSection(sectionId);
    }
  }, [sectionId, setActiveSection, logData, unifiedLogger]);

  useEffect(() => {
    if (sectionId && canvasElement) {
      registerCanvasElement(sectionId, canvasElement);
    }
  }, [sectionId, canvasElement, registerCanvasElement]);

  return (
    <GenericReportSectionV2
      iconComponent={iconComponent}
      onClick={onClick}
      isActive={activeSection === sectionId}
      onImpression={sendImpressionEvent}>
      {children}
    </GenericReportSectionV2>
  );
};

export default CanvasReportSection;
