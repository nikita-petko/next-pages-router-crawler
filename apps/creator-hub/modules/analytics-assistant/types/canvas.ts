import { InsightTypeV2 } from '@modules/experience-analytics-shared';
import PlayerFeedbackDetailsTableContainer from '../components/canvas/PlayerFeedbackDetailsTableContainer';
import SummaryReportCanvas from '../components/canvas/SummaryReportCanvas';
import { TAssistantSummaryInsight } from './AssistantSummaryInsightType';
import { SignalTypeForInsight } from './AssistantUISignal';

type CanvasComponentProps<T extends TAssistantSummaryInsight> = {
  signals: SignalTypeForInsight<T>[];
};

const canvasComponents: {
  [T in TAssistantSummaryInsight]: React.FC<CanvasComponentProps<T>>;
} = {
  [InsightTypeV2.SummaryReport]: SummaryReportCanvas,
  [InsightTypeV2.SummaryReport7Days]: SummaryReportCanvas,
  [InsightTypeV2.PlayerFeedbackReport7Days]: PlayerFeedbackDetailsTableContainer,
  [InsightTypeV2.PlayerFeedbackReport28Days]: PlayerFeedbackDetailsTableContainer,
  [InsightTypeV2.MetricsSummary]: SummaryReportCanvas,
};

const getCanvasComponent = <T extends TAssistantSummaryInsight>(
  type: T,
): React.FC<CanvasComponentProps<T>> => {
  return canvasComponents[type];
};

export default getCanvasComponent;
