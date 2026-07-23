import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Button, ChevronRightIcon } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { motion, AnimatePresence } from 'motion/react';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  ThinkingStepStatus,
  type ThinkingStep,
} from '@modules/analytics-assistant/types/AnalyticsChatTypes';
import StepItem from './StepItem';
import styles from './ThinkingSteps.module.css';

interface ThinkingStepsProps {
  steps: ThinkingStep[];
  isLoading?: boolean;
}

function getActiveStepTitle(steps: ThinkingStep[]): string | undefined {
  return [...steps].reverse().reduce<string | undefined>((found, step) => {
    if (found) return found;
    if (step.children) {
      const childActive = getActiveStepTitle(step.children);
      if (childActive) return childActive;
    }
    return step.status === ThinkingStepStatus.InProgress ? step.title : undefined;
  }, undefined);
}

const textSwipeTransition = { duration: 0.35, ease: 'easeInOut' as const };

const ScrollThreshold = 5;

const ThinkingSteps: FC<ThinkingStepsProps> = ({ steps, isLoading }) => {
  const [expanded, setExpanded] = useState(false);
  const [showFade, setShowFade] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasSteps = steps.length > 0;

  useEffect(() => {
    if (!isLoading) {
      setExpanded(false);
    }
  }, [isLoading]);

  const checkScrollFade = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < ScrollThreshold;
    setShowFade(hasOverflow && !isAtBottom);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    requestAnimationFrame(checkScrollFade);
  }, [expanded, steps, checkScrollFade]);

  const { translate } = useTranslationWrapper(useTranslation());
  const activeTitle = getActiveStepTitle(steps);

  const headerText = isLoading
    ? (activeTitle ??
      translate(
        translationKey(
          'Label.Thinking' /* in TranslationNamespace.AnalyticsAssistant */,
          TranslationNamespace.AnalyticsAssistant,
        ),
      ))
    : translate(
        translationKey(
          'Label.ShowThinking' /* in TranslationNamespace.AnalyticsAssistant */,
          TranslationNamespace.AnalyticsAssistant,
        ),
      );

  const chevron = hasSteps ? (
    <span className={`${styles.chevronIcon} ${expanded ? styles.chevronExpanded : ''}`}>
      <ChevronRightIcon style={{ fontSize: 16 }} />
    </span>
  ) : undefined;

  return (
    <div className={styles.root}>
      <Button
        variant='text'
        color='secondary'
        size='small'
        className={styles.toggleButton}
        startIcon={chevron}
        onClick={hasSteps ? () => setExpanded((prev) => !prev) : undefined}>
        <span className={styles.toggleButtonLabel}>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={headerText}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={textSwipeTransition}
              className={`${styles.toggleButtonText} ${isLoading ? styles.shimmerText : ''}`}>
              {headerText}
            </motion.span>
          </AnimatePresence>
        </span>
      </Button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key='steps'
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
            className={styles.stepsAnimationWrapper}>
            <div
              ref={scrollRef}
              onScroll={checkScrollFade}
              className={`${styles.stepsScrollable} ${showFade ? styles.stepsScrollableFade : ''}`}>
              {steps.map((step) => (
                <StepItem key={step.id ?? step.title} step={step} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThinkingSteps;
