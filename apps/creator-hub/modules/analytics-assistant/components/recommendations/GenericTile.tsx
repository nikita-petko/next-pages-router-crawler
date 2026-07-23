import React, { FC, useCallback, useRef, useState, useEffect } from 'react';
import {
  Card,
  CardActionArea,
  CardContent,
  ChevronRightIcon,
  Grid,
  makeStyles,
  Typography,
} from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/common/components';
import { GenericActionMenu, ActionItem } from '@modules/experience-analytics-shared';
import { useImpressionObserver } from '@modules/charts-generic';

import { FormattedText } from '@modules/analytics-translations';

interface GenericTileProps {
  headerText: FormattedText;
  subheadingText: FormattedText;
  actionItems?: ActionItem[];
  onClick: () => void;
  onImpression?: () => void;
}

const useTileStyles = makeStyles()((theme) => ({
  cardContainer: {
    background: theme.palette.surface[400],
    display: 'flex',
    flexDirection: 'column',
    width: '230px',
    minWidth: '230px',
  },
  cardContent: {
    height: '100%',
    padding: theme.spacing(1.5, 2),
    marginTop: '-4px',
  },
  title: {
    display: 'block',
    overflow: 'wrap',
    fontWeight: theme.typography.fontWeightMedium,
    width: '100%',
    padding: '4px 0px',
  },
  titleHovered: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 'calc(100% - 32px)', // Account for action menu width
  },
  subheading: {
    display: 'block',
    overflow: 'wrap',
    width: '100%',
    marginTop: '4px',
  },
}));

const GenericTile: FC<GenericTileProps> = ({
  headerText,
  subheadingText,
  actionItems = [],
  onClick,
  onImpression,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isWrapping, setIsWrapping] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const {
    classes: { cardContainer, cardContent, title, titleHovered, subheading },
    cx,
  } = useTileStyles();

  useImpressionObserver(cardRef, onImpression || (() => {}));

  // NOTE(lucaswang, 2025-05-16): This is a workaround to check if the text is wrapping.
  // If not wrapped (i.e. 1 line), we choose to truncate the text when the action menu is open.
  // Otherwise, if already wrapped, we show the full text.
  useEffect(() => {
    if (titleRef.current) {
      const style = window.getComputedStyle(titleRef.current);

      const lineHeight = parseInt(style.lineHeight, 10);
      const paddingTop = parseInt(style.paddingTop, 10);
      const paddingBottom = parseInt(style.paddingBottom, 10);
      const contentHeight = titleRef.current.offsetHeight - paddingTop - paddingBottom;

      setIsWrapping(contentHeight > lineHeight);
    }
  }, [headerText]);

  const onCardMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const onCardMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const header = (
    <Flex justifyContent='space-between' alignItems='center'>
      <Typography
        ref={titleRef}
        variant='body1'
        color='primary'
        className={cx(title, {
          [titleHovered]: isHovered && actionItems.length > 0 && !isWrapping,
        })}>
        {headerText}
      </Typography>
      {isHovered && actionItems.length > 0 && (
        <GenericActionMenu actions={actionItems} onClose={onCardMouseLeave} />
      )}
    </Flex>
  );

  return (
    <Card
      classes={{ root: cardContainer }}
      onMouseEnter={onCardMouseEnter}
      onMouseLeave={onCardMouseLeave}
      ref={cardRef}>
      <CardActionArea onClick={onClick} sx={{ height: '100%' }} disableRipple>
        <CardContent classes={{ root: cardContent }}>
          <Grid container direction='row' spacing={0}>
            <Grid item XSmall={12}>
              {header}
            </Grid>
            <Grid
              item
              XSmall={12}
              container
              direction='row'
              alignItems='center'
              spacing={1}
              sx={{ marginTop: '-12px' }}>
              <Grid item>
                <Typography variant='body1' color='secondary' className={subheading}>
                  {subheadingText}
                </Typography>
              </Grid>
              <Grid item sx={{ marginBottom: '-8px' }}>
                <ChevronRightIcon fontSize='medium' color='secondary' />
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default GenericTile;
