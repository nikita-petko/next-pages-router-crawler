import React, { useMemo } from 'react';
import { TITLE_SEPARATOR } from '@rbx/creator-hub-history';
import { getSecondaryDisplayParts, DISPLAY_SEPARATOR } from './searchListItemUtils';
import useSecondaryDisplayTextStyles from './SecondaryDisplayText.styles';
import type { TSearchListItem } from './types/SearchListItem';
import { sanitizeHighlightHtml } from './utils/sanitizeHighlightHtml';

/**
 * Renders the secondary display line for a search/recently-visited item.
 *
 * When both breadcrumb and detail are present, uses an inline-flex layout
 * so that `detail` is always visible and the breadcrumb truncates with
 * ellipsis at its segment boundary (middle of the full string).
 *
 * Security: the `detail` half comes from two distinct sources. `detailText`
 * (group / creator name) is user-controlled and is always rendered as text.
 * `detailHtml` (search-highlight markup from the docs backend) is sanitized
 * via `sanitizeHighlightHtml` before being injected through
 * `dangerouslySetInnerHTML`. Bypassing either of these guards would re-open
 * the Stored XSS.
 */
const SecondaryDisplayText: React.FC<{ item: TSearchListItem }> = ({ item }) => {
  const { classes } = useSecondaryDisplayTextStyles();
  const { breadcrumb, detailText, detailHtml } = getSecondaryDisplayParts(item);

  const sanitizedDetailHtml = useMemo(() => sanitizeHighlightHtml(detailHtml), [detailHtml]);
  const hasDetail = !!detailText || !!sanitizedDetailHtml;

  const renderDetail = (className?: string) => {
    if (detailText) {
      return <span className={className}>{detailText}</span>;
    }
    // eslint-disable-next-line react/no-danger -- sanitized via sanitizeHighlightHtml.
    return <span className={className} dangerouslySetInnerHTML={{ __html: sanitizedDetailHtml }} />;
  };

  if (!breadcrumb && !hasDetail) {
    return null;
  }
  if (!breadcrumb) {
    return renderDetail();
  }
  if (!hasDetail) {
    return <>{breadcrumb}</>;
  }

  const segments = breadcrumb.split(TITLE_SEPARATOR);

  if (segments.length > 1) {
    const startSegments = segments.slice(0, -1).join(TITLE_SEPARATOR);
    const endSegment = segments[segments.length - 1];

    return (
      <span className={classes.container}>
        <span className={classes.shrinkable}>{startSegments}</span>
        <span className={classes.fixed}>{`${TITLE_SEPARATOR}${endSegment}`}</span>
        <span className={classes.boldSeparator}>{DISPLAY_SEPARATOR}</span>
        {renderDetail(classes.fixed)}
      </span>
    );
  }

  return (
    <span className={classes.container}>
      <span className={classes.shrinkable}>{breadcrumb}</span>
      <span className={classes.boldSeparator}>{DISPLAY_SEPARATOR}</span>
      {renderDetail(classes.fixed)}
    </span>
  );
};

export default SecondaryDisplayText;
