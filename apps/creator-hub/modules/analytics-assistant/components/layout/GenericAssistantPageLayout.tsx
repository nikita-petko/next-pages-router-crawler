import type { FC } from 'react';
import React, { useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRailContext } from '@rbx/creator-hub-navigation';
import { withTranslation } from '@rbx/intl';
import { CircularProgress, Grid, makeStyles, Typography, useMediaQuery } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { AnalyticsContextLayerInnerProvider } from '@modules/experience-analytics-shared/context/AnalyticsContextLayerProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { defaultAnalyticsPageSurfaceConfig } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const useAssistantPageStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - var(--app-header-height, 56px) - 128px)',
  },
  contentArea: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    width: '100%',
  },

  // Shared desktop/mobile content styles
  desktopContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 'var(--margin-medium)',
  },
  motionCard: {
    width: '100%',
    maxWidth: '900px',
    height: '100%',
    overflowY: 'auto',
    flex: '1 1 0',
    minWidth: 0,
  },
  card: {
    [theme.breakpoints.up('Large')]: {
      height: '100%',
    },
  },
}));

type GenericAssistantPageLayoutProps = {
  banner?: React.JSX.Element | null;
  assistantPanel: React.JSX.Element | null;
  canvasPanel: React.JSX.Element | null;
  isLoading?: boolean;
};

const GenericAssistantPageLayout: FC<GenericAssistantPageLayoutProps> = ({
  banner,
  assistantPanel,
  canvasPanel,
  isLoading = false,
}) => {
  const {
    classes: { root, contentArea, desktopContainer, motionCard, card },
    cx,
  } = useAssistantPageStyles();
  const isCanvasVisible = useMemo(() => canvasPanel !== null, [canvasPanel]);
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Large'));

  const { translate } = useRAQIV2TranslationDependencies();
  const { primaryRailOpen, setPrimaryRailOpen } = useRailContext();
  const railOpenBeforeInlineRef = useRef(false);

  useEffect(() => {
    // Snapshot once when inline mode is active; omitting primaryRailOpen from deps avoids
    // overwriting the ref after we collapse the rail.
    railOpenBeforeInlineRef.current = primaryRailOpen;
    setPrimaryRailOpen(false);
    return () => {
      setPrimaryRailOpen(railOpenBeforeInlineRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional snapshot when entering inline layout only
  }, [setPrimaryRailOpen]);

  // Desktop view content with motion layout animations
  const desktopContent = useMemo(() => {
    const animationConfig = {
      duration: 0.5,
      ease: 'easeOut' as const,
    };

    const canvasCardAnimation = {
      initial: { opacity: 0, x: '100vw', scale: 0.8 },
      animate: { opacity: 1, x: 0, scale: 1 },
      exit: { opacity: 0, x: '100vw', scale: 0.8 },
      transition: animationConfig,
    };

    return (
      <motion.div layout className={desktopContainer} transition={animationConfig}>
        <motion.div layout className={cx(motionCard)}>
          {assistantPanel}
        </motion.div>
        <AnimatePresence mode='popLayout'>
          {isCanvasVisible && (
            <motion.div key='canvas-card' className={cx(motionCard)} {...canvasCardAnimation}>
              {canvasPanel}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }, [desktopContainer, cx, motionCard, isCanvasVisible, assistantPanel, canvasPanel]);

  // Mobile view content with original Grid layout
  const mobileContent = useMemo(() => {
    // NOTE(lucaswang, 2025-02-19): If no active charts, hide the chart card.
    return (
      <Grid container spacing={2}>
        <Grid item XSmall={12} className={card}>
          {assistantPanel}
        </Grid>
        {isCanvasVisible && (
          <Grid item XSmall={12} className={card}>
            {canvasPanel}
          </Grid>
        )}
      </Grid>
    );
  }, [isCanvasVisible, card, assistantPanel, canvasPanel]);

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <EmptyGrid>
          <CircularProgress />
        </EmptyGrid>
      );
    }

    if (!assistantPanel) {
      return (
        <Typography align='center'>
          {translate(translationKey('Message.NoDataReturn', TranslationNamespace.Analytics))}
        </Typography>
      );
    }

    return isCompactView ? mobileContent : desktopContent;
  }, [isLoading, translate, isCompactView, mobileContent, desktopContent, assistantPanel]);

  return (
    <AnalyticsContextLayerInnerProvider config={defaultAnalyticsPageSurfaceConfig}>
      <div className={root}>
        {banner}
        <div className={contentArea}>{content}</div>
      </div>
    </AnalyticsContextLayerInnerProvider>
  );
};

export default withTranslation(GenericAssistantPageLayout, [
  TranslationNamespace.Analytics,
  TranslationNamespace.AnalyticsAssistant,
  TranslationNamespace.Navigation,
  TranslationNamespace.DocsAssistant,
  TranslationNamespace.Creations,
  TranslationNamespace.Insights,
]);
