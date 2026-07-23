import type { FC } from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button, ChevronRightIcon, Typography } from '@rbx/ui';
import MdxContent from '@modules/analytics-assistant/components/markdown/MDX';
import {
  ThinkingStepStatus,
  type ThinkingStep,
} from '@modules/analytics-assistant/types/AnalyticsChatTypes';
import ThinkingStepStatusIcon from './ThinkingStepStatusIcon';
import styles from './StepItem.module.css';

export interface StepItemProps {
  step: ThinkingStep;
  depth?: number;
  isRunning?: boolean;
}

const CHEVRON_ICON_STYLE = { fontSize: 16 };

const StepItem: FC<StepItemProps> = ({ step, depth = 0, isRunning = false }) => {
  const hasChildren = Boolean(step.children && step.children.length > 0);
  const hasBody = Boolean(step.body);
  const isExpandable = hasChildren;
  const shouldAutoExpand = isRunning && step.status === ThinkingStepStatus.InProgress;
  const [manualExpanded, setManualExpanded] = useState<boolean | null>(null);
  const expanded = manualExpanded ?? shouldAutoExpand;

  const chevron = isExpandable ? (
    <span className={`${styles.chevronIcon} ${expanded ? styles.chevronExpanded : ''}`}>
      <ChevronRightIcon style={CHEVRON_ICON_STYLE} />
    </span>
  ) : null;

  return (
    <motion.div
      key={step.id ?? step.title}
      className={styles.step}
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}>
      <div className={`${styles.stepContent}${depth > 0 ? ' [padding-left:0]' : ''}`}>
        <Button
          variant='text'
          color='secondary'
          size='small'
          className={styles.toggleButton}
          startIcon={<ThinkingStepStatusIcon status={step.status} />}
          endIcon={chevron}
          onClick={
            isExpandable
              ? () => setManualExpanded((prev) => !(prev ?? shouldAutoExpand))
              : undefined
          }
          disabled={!isExpandable}>
          <Typography variant='smallLabel1' className={`${styles.stepTitle} content-muted`}>
            {step.title}
          </Typography>
        </Button>
        {hasBody && (
          <div className={styles.stepBodyWrapper}>
            <div className={`${styles.stepBody} text-body-small content-muted`}>
              <MdxContent content={step.body ?? ''} />
            </div>
          </div>
        )}
        {hasChildren && (
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key='step-children'
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className={`${styles.stepBodyWrapper} [overflow:hidden]`}>
                <div className={styles.childSteps}>
                  {step.children?.map((child) => (
                    <StepItem
                      key={child.id ?? child.title}
                      step={child}
                      depth={depth + 1}
                      isRunning={isRunning}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

export default StepItem;
