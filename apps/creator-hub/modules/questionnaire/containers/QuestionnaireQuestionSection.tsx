import type { ForwardedRef } from 'react';
import React, { forwardRef } from 'react';
import useQuestionnaireStyles from './QuestionnaireContainer.styles';

export interface QuestionnaireQuestionSectionProps {
  isSubQuestion?: boolean;
  children: React.ReactNode;
}

const QuestionnaireQuestionSection = (
  { isSubQuestion, children }: QuestionnaireQuestionSectionProps,
  ref: ForwardedRef<HTMLElement>,
) => {
  const {
    classes: { sectionQuestion, sectionSubQuestion },
  } = useQuestionnaireStyles();
  return (
    <section ref={ref} className={isSubQuestion ? sectionSubQuestion : sectionQuestion}>
      {children}
    </section>
  );
};

export default forwardRef(QuestionnaireQuestionSection);
