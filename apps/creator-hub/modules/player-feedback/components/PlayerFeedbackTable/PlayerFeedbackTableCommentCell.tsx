import type { FunctionComponent } from 'react';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import type { ExperienceReview } from '@rbx/client-player-generated-reviews-service/v1';
import { useTranslation } from '@rbx/intl';
import { Grid, List, ListItem, ListItemText, makeStyles } from '@rbx/ui';
import PlayerFeedbackContextMenu from './PlayerFeedbackContextMenu';
import type { TranslationState } from './types/types';

type PlayerFeedbackTableRatingCommentProps = {
  review: ExperienceReview;
  renderConextMenu: boolean;
  translationState?: TranslationState;
};
const EMPTY_COMMENT = '--';
const ONE_LINE_HEIGHT = 20;
const TWO_LINES_HEIGHT = 40;

const useStyles = makeStyles<{ showMenuIcon: boolean }>()((theme, { showMenuIcon }) => ({
  contextMenu: {
    visibility: showMenuIcon ? 'visible' : 'hidden',
  },
  contentContainer: {
    position: 'relative',
  },
  singleLineContent: {
    [theme.breakpoints.down('Medium')]: {
      textAlign: 'right',
    },
  },
  hoverPointer: {
    cursor: 'pointer',
  },
  hiddenContainer: {
    visibility: 'hidden',
    position: 'absolute',
    top: 0,
  },
  overflowMarkerContainer: {
    textDecoration: 'underline',
  },
  secondaryActionsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
}));

const PlayerFeedbackTableCommmentCell: FunctionComponent<PlayerFeedbackTableRatingCommentProps> = ({
  review,
  renderConextMenu,
  translationState,
}) => {
  const { translate } = useTranslation();
  const [comment, setComment] = useState(review.comment ? review.comment : EMPTY_COMMENT);
  const emptyComment = comment === EMPTY_COMMENT;
  const [showMenuIcon, setShowMenuIcon] = React.useState(false);
  const {
    classes: {
      contextMenu,
      contentContainer,
      hiddenContainer,
      overflowMarkerContainer,
      hoverPointer,
      singleLineContent,
      secondaryActionsContainer,
    },
    cx,
  } = useStyles({ showMenuIcon });
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenContainerRef = useRef<HTMLDivElement>(null);
  const [truncatedText, setTruncatedText] = useState(comment);
  const overflowMarker = translate('Action.More');
  const hasTruncatedText = comment.length > truncatedText.length;
  const [isSingleLine, setIsSingleLine] = useState(false);

  // Use translation state from props or provide defaults
  const {
    showTranslation = false,
    isTranslating = false,
    translationData,
    onClickTranslateComment = () => {},
  } = translationState || {};

  const truncateText = useCallback(() => {
    if (!hiddenContainerRef.current) {
      return;
    }

    const hiddenText = hiddenContainerRef.current.firstChild as HTMLSpanElement;
    const words = comment.split(' ');
    let truncated = comment;

    hiddenText.innerText = truncated;
    while (hiddenContainerRef.current.offsetHeight > TWO_LINES_HEIGHT && words.length > 0) {
      words.pop(); // remove & check one word at a time
      truncated = words.join(' ');
      hiddenText.innerText = `${truncated}... ${overflowMarker}`;
    }
    setTruncatedText(truncated);

    if (hiddenContainerRef.current.offsetHeight <= ONE_LINE_HEIGHT) {
      setIsSingleLine(true);
    } else {
      setIsSingleLine(false);
    }
  }, [comment, overflowMarker]);

  // Updates the comment text between the original and translated comment
  useEffect(() => {
    if (showTranslation && translationData && translationData.translatedComment) {
      setComment(translationData.translatedComment);
    } else {
      setComment(review.comment ? review.comment : EMPTY_COMMENT);
    }
  }, [showTranslation, translationData, review.comment]);

  useEffect(() => {
    truncateText();

    const resizeObserver = new ResizeObserver(truncateText);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [comment, truncateText]);

  const handleMouseEnter = useCallback(() => {
    setShowMenuIcon(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowMenuIcon(false);
  }, []);

  const onClick = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const content = (
    <Grid
      className={cx({
        [contentContainer]: true,
        [hoverPointer]: hasTruncatedText,
        [singleLineContent]: isSingleLine,
      })}
      ref={containerRef}
      onClick={onClick}>
      {/* Visible truncated text */}
      <span>{isExpanded ? comment : truncatedText}</span>
      {!isExpanded && hasTruncatedText && (
        <>
          <span>... </span>
          <span className={overflowMarkerContainer}>{overflowMarker}</span>
        </>
      )}
      {/* Hidden div for measuring text size */}
      <div className={hiddenContainer} ref={hiddenContainerRef}>
        <span>{comment}</span>
      </div>
    </Grid>
  );
  return (
    <List disablePadding dense onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <ListItem
        disableGutters
        secondaryAction={
          !emptyComment ? (
            <div className={secondaryActionsContainer}>
              {renderConextMenu && (
                <div className={contextMenu} data-context-menu>
                  <PlayerFeedbackContextMenu
                    review={review}
                    onTranslationToggle={onClickTranslateComment}
                    isTranslating={isTranslating}
                    showTranslation={showTranslation}
                    isTranslated={Boolean(translationData && translationData.translatedComment)}
                    setShowMenuIcon={setShowMenuIcon}
                  />
                </div>
              )}
            </div>
          ) : null
        }>
        <ListItemText primary={content} />
      </ListItem>
    </List>
  );
};
export default PlayerFeedbackTableCommmentCell;
