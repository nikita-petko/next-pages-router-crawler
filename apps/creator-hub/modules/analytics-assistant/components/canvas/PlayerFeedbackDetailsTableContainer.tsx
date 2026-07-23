import React, { FC, useMemo } from 'react';
import { useAssistantSurfaceContext } from '../../context/AssistantSurfaceContextProvider';
import PlayerFeedbackDetailsTable from './PlayerFeedbackDetailsTable';
import { PlayerFeedbackReportUISignal } from '../../types/AssistantUISignal';

const dedupeSignals = (signals: PlayerFeedbackReportUISignal[]): PlayerFeedbackReportUISignal[] => {
  const seen = new Set();
  return signals.filter((signal) => {
    const key = JSON.stringify(signal);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const PlayerFeedbackDetailsTableContainer: FC<{ signals: PlayerFeedbackReportUISignal[] }> = ({
  signals,
}) => {
  const { assistantSummarySpec } = useAssistantSurfaceContext();

  const uniqueSignalList = useMemo(() => {
    return dedupeSignals(signals.filter((spec) => spec !== undefined));
  }, [signals]);

  const tables = useMemo(() => {
    if (!assistantSummarySpec) return [];
    return uniqueSignalList.map((signal) => {
      const key = JSON.stringify(signal);
      return (
        <div style={{ width: '100%' }} key={key}>
          <PlayerFeedbackDetailsTable
            sections={signal.feedbackExamples?.playerFeedbackExampleSection || []}
          />
        </div>
      );
    });
  }, [uniqueSignalList, assistantSummarySpec]);

  return useMemo(() => {
    return tables.length > 0 ? tables : null;
  }, [tables]);
};

export default PlayerFeedbackDetailsTableContainer;
