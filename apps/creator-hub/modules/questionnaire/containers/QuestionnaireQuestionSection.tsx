import type { FunctionComponent } from 'react';
import React from 'react';
import useQuestionnaireStyles from './QuestionnaireContainer.styles';

export interface QuestionnaireQuestionSectionProps {
  isSubQuestion?: boolean;
  children: React.ReactNode;
}

const QuestionnaireQuestionSection: FunctionComponent<QuestionnaireQuestionSectionProps> = ({
  isSubQuestion,
  children,
}) => {
  const {
    classes: { sectionQuestion, sectionSubQuestion },
  } = useQuestionnaireStyles();
  return (
    <section className={isSubQuestion ? sectionSubQuestion : sectionQuestion}>{children}</section>
  );
};

export default QuestionnaireQuestionSection;
