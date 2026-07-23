import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from '@rbx/foundation-ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { Button, ChevronRightIcon, Typography } from '@rbx/ui';
import {
  ThinkingStepKind,
  ThinkingStepStatus,
  type ThinkingStep,
} from '@modules/analytics-assistant/types/AnalyticsChatTypes';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { formatCompactDuration } from './compactDuration';
import PlannerThinkingText from './PlannerThinkingText';
import StepItem from './StepItem';
import { useLiveElapsedMs } from './useLiveElapsedMs';
import styles from './ThinkingSteps.module.css';

interface ThinkingStepsProps {
  steps: ThinkingStep[];
  isRunning?: boolean;
  thinkingDurationMs?: number;
  turnStartedAtMs?: number;
}

export function getExpandedFooterDurationMs({
  isRunning,
  liveElapsedMs,
  thinkingDurationMs,
}: {
  isRunning: boolean;
  liveElapsedMs: number;
  thinkingDurationMs?: number;
}): number | undefined {
  if (thinkingDurationMs != null) {
    return thinkingDurationMs;
  }
  return isRunning ? liveElapsedMs : undefined;
}

export function getActiveStepTitle(steps: ThinkingStep[]): string | undefined {
  let activeTitle: string | undefined;

  const walk = (items: ThinkingStep[]) => {
    items.forEach((step) => {
      if (step.status === ThinkingStepStatus.InProgress) {
        activeTitle = step.title;
      }
      if (step.children?.length) {
        walk(step.children);
      }
    });
  };

  walk(steps);
  return activeTitle;
}

const textSwipeTransition = { duration: 0.35, ease: 'easeInOut' as const };
const CHEVRON_ICON_STYLE = { fontSize: 16 };
const ScrollThreshold = 5;

export function shouldShowScrollFade({
  scrollHeight,
  scrollTop,
  clientHeight,
}: {
  scrollHeight: number;
  scrollTop: number;
  clientHeight: number;
}): boolean {
  const hasOverflow = scrollHeight > clientHeight;
  const isAtBottom = scrollHeight - scrollTop - clientHeight < ScrollThreshold;
  return hasOverflow && !isAtBottom;
}

const ThinkingSteps: FC<ThinkingStepsProps> = ({
  steps,
  isRunning = false,
  thinkingDurationMs,
  turnStartedAtMs,
}) => {
  const [manualExpanded, setManualExpanded] = useState<boolean | null>(null);
  const [showFade, setShowFade] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [mountStartedAtMs] = useState(() => Date.now());
  const hasSteps = steps.length > 0;
  const expanded = manualExpanded ?? isRunning;
  const [prevExpanded, setPrevExpanded] = useState(expanded);
  // Clear any stale fade the moment the panel collapses, following React's
  // "adjust state during render" guidance instead of a synchronous effect
  // setState, so the gradient never lingers into the next expand.
  if (expanded !== prevExpanded) {
    setPrevExpanded(expanded);
    if (!expanded) {
      setShowFade(false);
    }
  }
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { locale } = useLocalization();
  const resolvedLocale = locale ?? Locale.English;
  const anchorStartedAtMs = turnStartedAtMs ?? mountStartedAtMs;

  const checkScrollFade = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    setShowFade(
      shouldShowScrollFade({
        scrollHeight: el.scrollHeight,
        scrollTop: el.scrollTop,
        clientHeight: el.clientHeight,
      }),
    );
  }, []);

  const scheduleScrollFadeCheck = useCallback(() => {
    if (rafRef.current != null) {
      return;
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      checkScrollFade();
    });
  }, [checkScrollFade]);

  useEffect(() => {
    if (!expanded) {
      return undefined;
    }
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    scheduleScrollFadeCheck();
    if (typeof ResizeObserver === 'undefined' || !scrollEl) {
      return () => {
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };
    }
    const observer = new ResizeObserver(scheduleScrollFadeCheck);
    observer.observe(scrollEl);
    if (contentEl) {
      observer.observe(contentEl);
    }
    return () => {
      observer.disconnect();
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [expanded, steps, scheduleScrollFadeCheck]);

  const activeTitle = getActiveStepTitle(steps);
  const liveElapsedMs = useLiveElapsedMs(
    isRunning && thinkingDurationMs == null,
    anchorStartedAtMs,
  );
  const footerDurationMs = getExpandedFooterDurationMs({
    isRunning,
    liveElapsedMs,
    thinkingDurationMs,
  });
  // Once complete, the header already reads "Thought for {duration}", so the
  // footer duration is redundant; keep it only for the live timer while running.
  const showFooter = isRunning && footerDurationMs != null;

  const formatDuration = useCallback(
    (durationMs: number): string => formatCompactDuration(durationMs, resolvedLocale),
    [resolvedLocale],
  );

  const completedDurationLabel = useMemo(() => {
    if (thinkingDurationMs == null) {
      return tPendingTranslation(
        'Show thinking',
        'Collapsed thinking header when completed without duration metadata',
        translationKey('Label.ShowThinking', TranslationNamespace.AnalyticsAssistant),
      );
    }
    return tPendingTranslation(
      'Thought for {duration}',
      'Completed thinking header; {duration} is a compact duration like "4s"',
      translationKey('Label.ThoughtForDuration', TranslationNamespace.AnalyticsAssistant),
      { duration: formatDuration(thinkingDurationMs) },
    );
  }, [thinkingDurationMs, tPendingTranslation, formatDuration]);

  const headerText = isRunning
    ? (activeTitle ??
      tPendingTranslation(
        'Thinking',
        'In-progress thinking header',
        translationKey('Label.Thinking', TranslationNamespace.AnalyticsAssistant),
      ))
    : completedDurationLabel;

  const chevron = hasSteps ? (
    <span className={`${styles.chevronIcon} ${expanded ? styles.chevronExpanded : ''}`}>
      <ChevronRightIcon style={CHEVRON_ICON_STYLE} />
    </span>
  ) : undefined;

  return (
    <div className={styles.root}>
      <Button
        variant='text'
        color='secondary'
        size='small'
        className={styles.toggleButton}
        endIcon={chevron}
        onClick={hasSteps ? () => setManualExpanded((prev) => !(prev ?? isRunning)) : undefined}>
        <span className={styles.toggleButtonLabel}>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={headerText}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={textSwipeTransition}
              className={`${styles.toggleButtonText} ${isRunning ? styles.shimmerText : ''}`}>
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
            onAnimationComplete={scheduleScrollFadeCheck}
            className={`${styles.stepsAnimationWrapper} [overflow:hidden]`}>
            <div className={styles.stepsBordered}>
              <div
                ref={scrollRef}
                onScroll={scheduleScrollFadeCheck}
                className={`${styles.stepsScrollable} ${showFade ? styles.stepsScrollableFade : ''}`}>
                <div ref={contentRef}>
                  {steps.map((step) =>
                    step.kind === ThinkingStepKind.Planner ? (
                      <PlannerThinkingText key={step.id ?? step.title} step={step} />
                    ) : (
                      <StepItem key={step.id ?? step.title} step={step} isRunning={isRunning} />
                    ),
                  )}
                </div>
              </div>
            </div>
            {showFooter ? (
              <div className={styles.footer}>
                <Icon name='icon-filled-nebula' size='Small' className={styles.footerIcon} />
                <Typography
                  variant='smallLabel1'
                  color='secondary'
                  className={styles.footerDuration}>
                  {formatDuration(footerDurationMs)}
                </Typography>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThinkingSteps;
