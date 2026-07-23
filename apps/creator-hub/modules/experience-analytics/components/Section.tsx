import { Grid, InfoOutlinedIcon, Tooltip, Typography, makeStyles } from '@rbx/ui';
import React, { FC } from 'react';
import {
  OnboardingTipsCarousel,
  type OnboardingTipsConfigs,
} from '@modules/experience-analytics-shared';

const useStyles = makeStyles()((theme) => ({
  sectionHeader: {
    marginBottom: 8,
  },
  sectionHeaderWithSubtitle: {
    marginBottom: 4,
  },
  tooltipContainer: {
    padding: '8px 12px',
    maxWidth: '380px',
  },
  subtitleContainer: {
    marginBottom: 20,
    width: '100%',
  },
  titleContainer: {
    alignItems: 'center',
    display: 'inline-flex',
    flexDirection: 'row',
    gap: '8px',
    [theme.breakpoints.down('Medium')]: {
      display: 'inline',
    },
  },
  centeredRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    [theme.breakpoints.down('Medium')]: {
      minWidth: 0,
    },
  },
  /** CSS Grid header for default layout (title + optional action) */
  sectionHeaderGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    alignItems: 'center',
    width: '100%',
    [theme.breakpoints.down('Medium')]: {
      gridTemplateColumns: '1fr',
    },
  },
  /** CSS Grid header for subtitle-action layout */
  headerWithSubtitleAction: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    rowGap: '4px',
    width: '100%',
    marginBottom: 20,
    position: 'relative',
    [theme.breakpoints.down('Medium')]: {
      gridTemplateColumns: '1fr',
    },
  },
  headerActionSlot: {
    alignSelf: 'start',
    textAlign: 'right' as const,
    [theme.breakpoints.down('Medium')]: {
      textAlign: 'left' as const,
    },
  },
  headerSubtitleSlot: {
    [theme.breakpoints.down('Medium')]: {
      overflow: 'hidden',
      minWidth: 0,
    },
  },
  headerSubtitleActionSlot: {
    textAlign: 'right' as const,
    [theme.breakpoints.up('Medium')]: {
      position: 'absolute',
      right: 0,
      bottom: 0,
    },
    [theme.breakpoints.down('Medium')]: {
      textAlign: 'left' as const,
    },
  },
}));

type SectionProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  /** Action rendered on the right side of the subtitle row, aligned to the bottom */
  subtitleAction?: React.ReactNode;
  titleTooltip?: React.ReactNode;
  onboardingTipsConfig?: OnboardingTipsConfigs;
};

/**
 * title                   action
 * ------------------------------
 *            children
 * ------------------------------
 */
const Section: FC<React.PropsWithChildren<SectionProps>> = ({
  children,
  title,
  subtitle,
  action,
  subtitleAction,
  titleTooltip,
  onboardingTipsConfig,
}) => {
  const {
    classes: {
      sectionHeader,
      sectionHeaderWithSubtitle,
      tooltipContainer,
      titleContainer,
      subtitleContainer,
      centeredRow,
      sectionHeaderGrid,
      headerWithSubtitleAction,
      headerActionSlot,
      headerSubtitleSlot,
      headerSubtitleActionSlot,
    },
    cx,
  } = useStyles();

  const titleElement = (
    <span className={centeredRow}>
      <Typography
        variant='h2'
        marginRight={titleTooltip ? '6px' : undefined}
        classes={{ root: titleContainer }}>
        {title}
      </Typography>
      {titleTooltip ? (
        <Tooltip title={titleTooltip} classes={{ tooltip: tooltipContainer }}>
          <InfoOutlinedIcon fontSize='small' />
        </Tooltip>
      ) : null}
      {onboardingTipsConfig && (
        <OnboardingTipsCarousel
          featureKey={onboardingTipsConfig.featureKey}
          stepKey={onboardingTipsConfig.stepKey}
        />
      )}
    </span>
  );

  // Two-column layout when subtitleAction is present
  // Desktop:  Title               [action]
  //           Subtitle     [subtitleAction]
  // Mobile:   Title...(overflow)
  //           [action]
  //           Subtitle
  //           [subtitleAction]
  if (subtitleAction && subtitle) {
    return (
      <Grid item container direction='row'>
        <div className={headerWithSubtitleAction}>
          {titleElement}
          <div className={headerActionSlot}>
            {action ? <Typography variant='smallLabel2'>{action}</Typography> : null}
          </div>
          <div className={headerSubtitleSlot}>{subtitle}</div>
          <div className={headerSubtitleActionSlot}>{subtitleAction}</div>
        </div>
        {children}
      </Grid>
    );
  }

  // Default layout
  return (
    <Grid item container direction='row'>
      {/* Header */}
      <div className={cx(sectionHeaderGrid, subtitle ? sectionHeaderWithSubtitle : sectionHeader)}>
        {titleElement}
        {action ? <Typography variant='smallLabel2'>{action}</Typography> : null}
      </div>
      {subtitle && (
        <Grid item classes={{ root: subtitleContainer }}>
          {subtitle}
        </Grid>
      )}

      {/* Content */}
      {children}
    </Grid>
  );
};

export default Section;
