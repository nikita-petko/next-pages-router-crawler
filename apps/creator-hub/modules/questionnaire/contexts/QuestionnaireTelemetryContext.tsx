import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext } from 'react';
import type { QuestionnaireViewTiming } from '../utils/questionnaireEvents';

export interface QuestionnaireTelemetryContextValue {
  onQuestionViewed?: (questionId: string, timing: QuestionnaireViewTiming) => void;
  onSectionViewed?: (sectionId: string, timing: QuestionnaireViewTiming) => void;
}

const QuestionnaireTelemetryContext = createContext<QuestionnaireTelemetryContextValue>({});
const QuestionnaireSectionActiveContext = createContext(true);

interface QuestionnaireTelemetryProviderProps extends PropsWithChildren {
  value: QuestionnaireTelemetryContextValue;
}

export const QuestionnaireTelemetryProvider: FC<QuestionnaireTelemetryProviderProps> = ({
  children,
  value,
}) => (
  <QuestionnaireTelemetryContext.Provider value={value}>
    {children}
  </QuestionnaireTelemetryContext.Provider>
);

interface QuestionnaireSectionTelemetryProviderProps extends PropsWithChildren {
  isActive: boolean;
}

export const QuestionnaireSectionTelemetryProvider: FC<
  QuestionnaireSectionTelemetryProviderProps
> = ({ children, isActive }) => (
  <QuestionnaireSectionActiveContext.Provider value={isActive}>
    {children}
  </QuestionnaireSectionActiveContext.Provider>
);

export const useQuestionnaireTelemetryContext = (): QuestionnaireTelemetryContextValue =>
  useContext(QuestionnaireTelemetryContext);

export const useIsQuestionnaireSectionActive = (): boolean =>
  useContext(QuestionnaireSectionActiveContext);
