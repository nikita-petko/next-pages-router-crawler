import React, { FC, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  type AnalyticsNavigationItem,
  buildExperienceAnalyticsUrlWithParams,
  getChartThemedColors,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import AppBreadcrumbs from '@modules/navigation/layout/components/AppBreadcrumbs';
import { withTranslation } from '@rbx/intl';
import { useRailContext } from '@rbx/creator-hub-navigation';
import { Dialog, Grid, makeStyles, Typography, useMediaQuery } from '@rbx/ui';
import {
  useRAQIV2TranslationDependencies,
  ExperienceAnalyticsPermalinkIcon,
  ExperienceAnalyticsFullScreenModeExitControl,
  useUniverseResource,
  AnalyticsContextLayerInnerProvider,
  defaultAnalyticsPageSurfaceConfig,
} from '@modules/experience-analytics-shared';

const useAssistantPageStyles = makeStyles()((theme) => {
  const { layoutBackground: background } = getChartThemedColors(theme);

  return {
    // Dialog mode styles
    fullScreen: {
      maxWidth: '100%',
      maxHeight: '100%',
      width: '100%',
      height: '100%',
      background,

      [theme.breakpoints.between('XSmall', 'Large')]: {
        margin: `-24px 0`,
        padding: '24px 32px',
      },
      [theme.breakpoints.between('Large', 'XLarge')]: {
        margin: `-32px 0`,
        padding: '32px 48px',
      },
      [theme.breakpoints.up('XLarge')]: {
        margin: `-48px 0`,
        padding: '48px 96px',
      },
    },
    bodyContainer: {
      display: 'flex',
      [theme.breakpoints.up('Large')]: {
        height: '100%',
      },
    },
    wrapper: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minHeight: 0,
      margin: '0 auto',
      width: '100%',
    },
    contentContainer: {
      display: 'flex',
      flex: 1,
      minHeight: 0,
      width: '100%',
    },

    // Inline mode styles
    inlineRoot: {
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - var(--app-header-height, 56px) - 128px)',
    },
    inlineContentArea: {
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
      gap: '32px',
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
  };
});

type GenericAssistantPageLayoutProps = {
  prevPage: AnalyticsNavigationItem;
  banner?: React.JSX.Element | null;
  assistantPanel: React.JSX.Element | null;
  canvasPanel: React.JSX.Element | null;
  useInlineLayout?: boolean;
};

const GenericAssistantPageLayout: FC<GenericAssistantPageLayoutProps> = ({
  prevPage,
  banner,
  assistantPanel,
  canvasPanel,
  useInlineLayout = false,
}) => {
  const {
    classes: {
      fullScreen,
      bodyContainer,
      wrapper,
      contentContainer,
      inlineRoot,
      inlineContentArea,
      desktopContainer,
      motionCard,
      card,
    },
    cx,
  } = useAssistantPageStyles();
  const isCanvasVisible = useMemo(() => canvasPanel !== null, [canvasPanel]);
  const { id: universeId } = useUniverseResource();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Large'));

  const { translate } = useRAQIV2TranslationDependencies();
  const { primaryRailOpen, setPrimaryRailOpen } = useRailContext();
  const railOpenBeforeInlineRef = useRef(false);

  useEffect(() => {
    if (!useInlineLayout) {
      return undefined;
    }
    // Snapshot once when inline mode is active; omitting primaryRailOpen from deps avoids
    // overwriting the ref after we collapse the rail.
    railOpenBeforeInlineRef.current = primaryRailOpen;
    setPrimaryRailOpen(false);
    return () => {
      setPrimaryRailOpen(railOpenBeforeInlineRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional snapshot when entering inline layout only
  }, [useInlineLayout, setPrimaryRailOpen]);

  const priorUri = useMemo(() => {
    if (useInlineLayout) return '';
    return buildExperienceAnalyticsUrlWithParams(prevPage, {}, universeId);
  }, [useInlineLayout, prevPage, universeId]);

  const pageTitleAndExitButton = useMemo(() => {
    if (useInlineLayout) return null;
    return (
      <Grid container justifyContent='space-between'>
        <AppBreadcrumbs />
        <Grid item>
          <ExperienceAnalyticsPermalinkIcon />
          <ExperienceAnalyticsFullScreenModeExitControl
            iconKey={translationKey(
              'Description.CloseAssistantButton',
              TranslationNamespace.Analytics,
            )}
            priorUri={priorUri}
          />
        </Grid>
      </Grid>
    );
  }, [useInlineLayout, priorUri]);

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
    if (!assistantPanel) {
      return (
        <Typography align='center'>
          {translate(translationKey('Message.NoDataReturn', TranslationNamespace.Analytics))}
        </Typography>
      );
    }

    return isCompactView ? mobileContent : desktopContent;
  }, [translate, isCompactView, mobileContent, desktopContent, assistantPanel]);

  if (useInlineLayout) {
    return (
      <AnalyticsContextLayerInnerProvider config={defaultAnalyticsPageSurfaceConfig}>
        <div className={inlineRoot}>
          {banner}
          <div className={inlineContentArea}>{content}</div>
        </div>
      </AnalyticsContextLayerInnerProvider>
    );
  }

  return (
    <AnalyticsContextLayerInnerProvider config={defaultAnalyticsPageSurfaceConfig}>
      <Dialog open fullScreen classes={{ paper: fullScreen }}>
        <Grid container direction='column' className={bodyContainer}>
          <Grid item>{pageTitleAndExitButton}</Grid>
          {banner && <Grid item>{banner}</Grid>}
          <Grid container direction='column' className={wrapper}>
            <Grid item className={contentContainer}>
              {content}
            </Grid>
          </Grid>
        </Grid>
      </Dialog>
    </AnalyticsContextLayerInnerProvider>
  );
};

export default withTranslation(GenericAssistantPageLayout, [
  TranslationNamespace.Analytics,
  TranslationNamespace.AnalyticsAssistant,
  TranslationNamespace.Navigation,
  TranslationNamespace.DocsAssistant,
  TranslationNamespace.AvatarAnalytics,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.Creations,
  TranslationNamespace.Insights,
  TranslationNamespace.Table,
]);
