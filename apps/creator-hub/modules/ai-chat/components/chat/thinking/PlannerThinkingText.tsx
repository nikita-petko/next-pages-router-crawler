import type { FC } from 'react';
import MdxContent from '@modules/analytics-assistant/components/markdown/MDX';
import type { ThinkingStep } from '@modules/analytics-assistant/types/AnalyticsChatTypes';
import styles from './PlannerThinkingText.module.css';

interface PlannerThinkingTextProps {
  step: ThinkingStep;
}

const PlannerThinkingText: FC<PlannerThinkingTextProps> = ({ step }) => {
  if (!step.body) {
    return null;
  }

  return (
    <div className={`${styles.plannerText} text-body-small content-muted`}>
      <MdxContent content={step.body} />
    </div>
  );
};

export default PlannerThinkingText;
