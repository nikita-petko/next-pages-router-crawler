import React, { FC } from 'react';
import { motion } from 'motion/react';
import MDX from '@modules/analytics-assistant/components/markdown/MDX';
import type { ThinkingStep } from '@modules/analytics-assistant/types/AnalyticsChatTypes';
import { Typography } from '@rbx/ui';
import styles from './StepItem.module.css';

export interface StepItemProps {
  step: ThinkingStep;
  depth?: number;
}

const StepItem: FC<StepItemProps> = ({ step, depth = 0 }) => (
  <motion.div
    key={step.id ?? step.title}
    className={styles.step}
    initial={{ y: 15, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}>
    <div className={styles.stepContent}>
      <Typography variant='smallLabel1' color='secondary'>
        {step.title}
      </Typography>
      {step.body && (
        <div className={`${styles.stepBody} text-body-small content-muted`}>
          <MDX content={step.body} />
        </div>
      )}
      {step.children && step.children.length > 0 && (
        <div className={styles.childSteps}>
          {step.children.map((child) => (
            <StepItem key={child.id ?? child.title} step={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  </motion.div>
);

export default StepItem;
