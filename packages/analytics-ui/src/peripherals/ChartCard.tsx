import type { FC } from 'react';
import React, { useMemo, memo } from 'react';
import { SystemBanner, type TSystemBannerProps } from '@rbx/foundation-ui';
import {
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  DownloadIcon,
  InfoOutlinedIcon,
  makeStyles,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@rbx/ui';
import { ChartIsInAbnormalStateProvider } from '../context/ChartIsInAbnormalStateContext';
import { useChartCardDragDropOptions } from './ChartCardDragDropContext';
import ChartCardHeaderActions, { type ChartCardHeaderAction } from './ChartCardHeaderActions';
import { useChartCardSlots, type ChartCardSlots } from './ChartCardSlotsContext';
import type { ChartPlaceholderProps } from './ChartPlaceholder';
import ChartPlaceholder from './ChartPlaceholder';

const useStyles = makeStyles()((theme) => ({
  titleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  card: {
    position: 'relative',
    transition: 'border-color 120ms ease, box-shadow 120ms ease',
  },
  draggingCard: {
    borderColor: theme.palette.actionV2.primaryBrand.fill,
    boxShadow: `0 0 0 1px ${theme.palette.actionV2.primaryBrand.fill}`,
  },
  titleContent: {
    lineHeight: '34px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    marginRight: '4px',
    overflow: 'hidden',
    minWidth: 0,
  },
  titleLabel: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  tooltipIcon: {
    verticalAlign: 'middle',
    margin: '0 0 2px 4px',
  },
  cardHeader: {
    padding: '24px 24px 0px',
  },
  cardHeaderContent: {
    maxWidth: '100%',
  },
  cardContent: {
    padding: '8px 16px 24px',
  },
  cardActions: {
    padding: '0 0 0 4px',
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  footerContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '16px 8px 0',
  },
  mobileControlsRow: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 24px 0',
    [theme.breakpoints.up('Medium')]: {
      display: 'none',
    },
  },
}));

export type ChartCardProps = {
  titleLabel: string;
  titleTooltipLabel?: string;
  titleSuffix?: React.ReactNode;
  subTitle?: React.ReactNode;
  /** Optional chart control (e.g. date range dropdown) rendered separately for mobile layout */
  chartControl?: React.ReactNode;
  footerContent?: React.ReactNode;
  secondaryAction?: {
    label: string;
    onClick: () => void;
    tooltip?: string;
    /** When provided, render Wrapper around the secondary action */
    Wrapper?: FC<React.PropsWithChildren>;
  };
  downloadAction?: {
    onClick: () => void;
    tooltip?: string;
  };
  /** Structured chart header actions. Preferred over legacy secondary/download/overflow props. */
  headerActionItems?: readonly ChartCardHeaderAction[];
  /** Replaces the full header actions region. When set, legacy action props are ignored. */
  headerActions?: React.ReactNode;
  /** When provided, renders in the header actions area and hides the download button (download should be inside the menu). */
  overflowMenuContent?: React.ReactNode;
  abnormalState?: ChartPlaceholderProps;
  chartBanner?: TSystemBannerProps;
  /**
   * Per-card override for decoration slots (e.g. ownership watermark).
   * When a slot is provided here, it takes precedence over the value
   * supplied by the nearest `ChartCardSlotsProvider`; omitted fields
   * fall back to the provider value, and fully-omitted `slots` falls
   * back entirely to context. This keeps `analytics-ui` free of product
   * dependencies while still letting individual call sites swap in a
   * stand-in (stories, tests) or opt a single card out (`slots={{}}`).
   */
  slots?: ChartCardSlots;
};

const ChartCard: FC<React.PropsWithChildren<ChartCardProps>> = ({
  children,
  titleLabel,
  titleTooltipLabel,
  titleSuffix,
  subTitle,
  chartControl,
  headerActionItems,
  headerActions,
  downloadAction,
  overflowMenuContent,
  secondaryAction,
  footerContent,
  abnormalState,
  chartBanner,
  slots,
}) => {
  const {
    classes: {
      titleContainer,
      card,
      draggingCard,
      titleContent,
      titleLabel: titleLabelClass,
      tooltipIcon,
      cardHeader,
      cardHeaderContent,
      cardContent,
      cardActions,
      footerContainer,
      mobileControlsRow,
    },
    cx,
  } = useStyles();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const dragDropOptions = useChartCardDragDropOptions();
  // Per-instance `slots` wins over context; if the caller omits a field,
  // we fall back to the provider value (or undefined, which renders as
  // nothing). Kept as a plain destructure -- no useMemo needed because
  // the values flow straight into JSX and React already bails out of
  // re-rendering unchanged children.
  const contextSlots = useChartCardSlots();
  const watermarkSlot = slots?.watermark ?? contextSlots.watermark;

  const title = useMemo(() => {
    const isDownloadDisabled = !!abnormalState;
    const hasHeaderActionsOverride = headerActions !== undefined;
    const legacyActions: ChartCardHeaderAction[] = [];
    if (secondaryAction) {
      legacyActions.push({
        id: 'secondary',
        kind: 'button',
        label: secondaryAction.label,
        onClick: secondaryAction.onClick,
        tooltip: secondaryAction.tooltip,
        renderButton: secondaryAction.Wrapper
          ? ({ defaultButton }) => {
              const Wrapper = secondaryAction.Wrapper;
              return Wrapper ? <Wrapper>{defaultButton}</Wrapper> : defaultButton;
            }
          : undefined,
      });
    }
    if (!overflowMenuContent && downloadAction) {
      legacyActions.push({
        id: 'download',
        kind: 'button',
        label: downloadAction.tooltip ?? '',
        onClick: downloadAction.onClick,
        tooltip: downloadAction.tooltip,
        icon: <DownloadIcon fontSize='small' />,
        disabled: isDownloadDisabled,
        testId: 'chart-download-button',
      });
    }
    if (overflowMenuContent) {
      legacyActions.push({
        id: 'legacy-overflow-menu',
        kind: 'custom',
        label: 'Overflow menu',
        render: () => overflowMenuContent,
      });
    }
    const resolvedActionItems = headerActionItems ?? legacyActions;
    const shouldRenderAtLeastOneAction = hasHeaderActionsOverride
      ? headerActions !== null && headerActions !== false
      : resolvedActionItems.length > 0;

    return (
      <Container disableGutters classes={{ root: titleContainer }} maxWidth={false}>
        <Typography variant='subtitle1' classes={{ root: titleContent }}>
          <span className={titleLabelClass}>{titleLabel}</span>
          {titleTooltipLabel ? (
            <Tooltip title={titleTooltipLabel} arrow>
              <InfoOutlinedIcon classes={{ root: tooltipIcon }} />
            </Tooltip>
          ) : null}
          {titleSuffix}
        </Typography>
        {shouldRenderAtLeastOneAction && (
          <CardActions classes={{ root: cardActions }}>
            {hasHeaderActionsOverride ? (
              headerActions
            ) : (
              <ChartCardHeaderActions actions={resolvedActionItems} />
            )}
          </CardActions>
        )}
      </Container>
    );
  }, [
    abnormalState,
    cardActions,
    downloadAction,
    headerActionItems,
    headerActions,
    overflowMenuContent,
    secondaryAction,
    titleContainer,
    titleContent,
    titleLabel,
    titleLabelClass,
    titleSuffix,
    titleTooltipLabel,
    tooltipIcon,
  ]);

  const mobileControls = useMemo(() => {
    if (!isCompactView || !chartControl) {
      return null;
    }

    return <div className={mobileControlsRow}>{chartControl}</div>;
  }, [chartControl, isCompactView, mobileControlsRow]);

  return (
    <Card
      variant='outlined'
      classes={{
        root: cx(card, {
          [draggingCard]: !!dragDropOptions?.isDragging,
        }),
      }}>
      {/*
        Slot for an overlay decoration (currently used for the ownership
        watermark in creator-hub). The slot node is expected to be
        self-positioning (`position: absolute; inset: 0;
        pointer-events: none`) and to blanket the whole card so the card
        root stays `position: relative`. Rendered here rather than inside
        `CardContent` so the overlay covers the header and footer too.
        Renders nothing when no slot is provided -- analytics-ui has no
        product dependency on the watermark implementation itself.
      */}
      {watermarkSlot}
      <CardHeader
        title={title}
        classes={{ root: cardHeader, content: cardHeaderContent }}
        disableTypography
        subheader={subTitle}
      />
      {mobileControls}
      {chartBanner && <SystemBanner {...chartBanner} />}
      <CardContent classes={{ root: cardContent }}>
        <ChartIsInAbnormalStateProvider value={!!abnormalState}>
          {children}
        </ChartIsInAbnormalStateProvider>
        {!abnormalState && footerContent ? (
          <div className={footerContainer}>{footerContent}</div>
        ) : null}
        {abnormalState ? <ChartPlaceholder {...abnormalState} /> : null}
      </CardContent>
    </Card>
  );
};

export default memo(ChartCard);
