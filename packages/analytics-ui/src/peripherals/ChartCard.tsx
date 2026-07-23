import React, { FC, useMemo, memo, Fragment } from 'react';
import {
  Button,
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
import { SystemBanner, type TSystemBannerProps } from '@rbx/foundation-ui';
import ChartPlaceholder, { ChartPlaceholderProps } from './ChartPlaceholder';
import { ChartIsInAbnormalStateProvider } from '../context/ChartIsInAbnormalStateContext';
import { useChartCardDragDropOptions } from './ChartCardDragDropContext';

const useStyles = makeStyles()((theme) => ({
  titleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  card: {
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
    position: 'relative',
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
  downloadButton: {
    minWidth: 'fit-content',
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
  abnormalState?: ChartPlaceholderProps;
  chartBanner?: TSystemBannerProps;
};

const ChartCard: FC<React.PropsWithChildren<ChartCardProps>> = ({
  children,
  titleLabel,
  titleTooltipLabel,
  titleSuffix,
  subTitle,
  chartControl,
  downloadAction,
  secondaryAction,
  footerContent,
  abnormalState,
  chartBanner,
}) => {
  const {
    classes: {
      titleContainer,
      card,
      draggingCard,
      titleContent,
      titleLabel: titleLabelClass,
      tooltipIcon,
      downloadButton,
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

  const secondaryButton = useMemo(() => {
    if (!secondaryAction) return null;

    const { Wrapper: GivenWrapper, label, tooltip, onClick } = secondaryAction;
    const Wrapper = GivenWrapper || Fragment;

    return (
      <Wrapper>
        <Tooltip title={tooltip} arrow>
          <Button
            onClick={onClick}
            variant='contained'
            color='secondary'
            size='small'
            disableRipple>
            {label}
          </Button>
        </Tooltip>
      </Wrapper>
    );
  }, [secondaryAction]);

  const title = useMemo(() => {
    const isDownloadDisabled = !!abnormalState;
    const shouldRenderAtLeastOneAction = !!downloadAction || !!secondaryAction;

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
            {secondaryButton}
            {downloadAction && (
              <Tooltip title={isDownloadDisabled ? '' : downloadAction.tooltip} arrow>
                <span>
                  <Button
                    onClick={downloadAction.onClick}
                    variant='contained'
                    color='secondary'
                    size='small'
                    disableRipple
                    disabled={isDownloadDisabled}
                    classes={{ root: downloadButton }}
                    data-testid='chart-download-button'>
                    <DownloadIcon fontSize='small' />
                  </Button>
                </span>
              </Tooltip>
            )}
          </CardActions>
        )}
      </Container>
    );
  }, [
    abnormalState,
    cardActions,
    downloadAction,
    downloadButton,
    secondaryAction,
    secondaryButton,
    titleContainer,
    titleContent,
    titleLabel,
    titleLabelClass,
    titleSuffix,
    titleTooltipLabel,
    tooltipIcon,
  ]);

  const mobileControls = useMemo(() => {
    if (!isCompactView || !chartControl) return null;

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
