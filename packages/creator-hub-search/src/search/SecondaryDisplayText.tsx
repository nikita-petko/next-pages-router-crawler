import React from 'react';
import { TITLE_SEPARATOR } from '@rbx/creator-hub-history';
import { getSecondaryDisplayParts, DISPLAY_SEPARATOR } from './searchListItemUtils';
import { TSearchListItem } from './types/SearchListItem';
import useSecondaryDisplayTextStyles from './SecondaryDisplayText.styles';

/**
 * Renders the secondary display line for a search/recently-visited item.
 *
 * When both breadcrumb and detail are present, uses an inline-flex layout
 * so that `detail` is always visible and the breadcrumb truncates with
 * ellipsis at its segment boundary (middle of the full string).
 */
const SecondaryDisplayText: React.FC<{ item: TSearchListItem }> = ({ item }) => {
  const { classes } = useSecondaryDisplayTextStyles();
  const { breadcrumb, detail } = getSecondaryDisplayParts(item);

  if (!breadcrumb && !detail) return null;
  if (!breadcrumb) return <span dangerouslySetInnerHTML={{ __html: detail }} />;
  if (!detail) return <React.Fragment>{breadcrumb}</React.Fragment>;

  const segments = breadcrumb.split(TITLE_SEPARATOR);

  if (segments.length > 1) {
    const startSegments = segments.slice(0, -1).join(TITLE_SEPARATOR);
    const endSegment = segments[segments.length - 1];

    return (
      <span className={classes.container}>
        <span className={classes.shrinkable}>{startSegments}</span>
        <span className={classes.fixed}>{`${TITLE_SEPARATOR}${endSegment}`}</span>
        <span className={classes.boldSeparator}>{DISPLAY_SEPARATOR}</span>
        <span className={classes.fixed} dangerouslySetInnerHTML={{ __html: detail }} />
      </span>
    );
  }

  return (
    <span className={classes.container}>
      <span className={classes.shrinkable}>{breadcrumb}</span>
      <span className={classes.boldSeparator}>{DISPLAY_SEPARATOR}</span>
      <span className={classes.fixed} dangerouslySetInnerHTML={{ __html: detail }} />
    </span>
  );
};

export default SecondaryDisplayText;
