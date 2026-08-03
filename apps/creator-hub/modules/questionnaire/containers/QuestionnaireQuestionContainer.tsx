import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  useIsQuestionnaireSectionActive,
  useQuestionnaireTelemetryContext,
} from '../contexts/QuestionnaireTelemetryContext';
import useTimedQuestionnaireView from '../hooks/useTimedQuestionnaireView';
import QuestionnaireQuestionSection from './QuestionnaireQuestionSection';
import QuestionnaireQuestionSwitch from './QuestionnaireQuestionSwitch';
import type { QuestionnaireQuestionContainerProps } from './types';

export type { QuestionnaireQuestionContainerProps } from './types';

const QuestionnaireQuestionContainer: FunctionComponent<
  React.PropsWithChildren<QuestionnaireQuestionContainerProps>
> = ({ validatedAnswers, errors, question, updateAnswer, isSubQuestion, depth = 0 }) => {
  const elementRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const isSectionActive = useIsQuestionnaireSectionActive();
  const { onQuestionViewed } = useQuestionnaireTelemetryContext();

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !onQuestionViewed || !isSectionActive) {
      return undefined;
    }
    if (typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry?.isIntersecting ?? false),
      { threshold: 0 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      // The observer is disconnected before the browser animates the section closed, so it
      // never reports the question as non-intersecting. Reset here, otherwise a stale `true`
      // starts a view on re-expand that ends immediately and logs a ~0ms QuestionViewed.
      setIsVisible(false);
    };
  }, [isSectionActive, onQuestionViewed]);

  const handleQuestionViewEnd = useCallback(
    (timing: Parameters<NonNullable<typeof onQuestionViewed>>[1]) => {
      onQuestionViewed?.(question.id, timing);
    },
    [onQuestionViewed, question.id],
  );
  const isQuestionVisible =
    isSectionActive &&
    !!onQuestionViewed &&
    (typeof IntersectionObserver === 'undefined' || isVisible);
  useTimedQuestionnaireView(isQuestionVisible, handleQuestionViewEnd);

  return (
    <QuestionnaireQuestionSection ref={elementRef} isSubQuestion={isSubQuestion}>
      <QuestionnaireQuestionSwitch
        validatedAnswers={validatedAnswers}
        errors={errors}
        question={question}
        updateAnswer={updateAnswer}
        depth={depth}
        questionComponent={QuestionnaireQuestionContainer}
      />
    </QuestionnaireQuestionSection>
  );
};

export default QuestionnaireQuestionContainer;
