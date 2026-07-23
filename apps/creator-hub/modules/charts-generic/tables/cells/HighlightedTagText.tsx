import type { CSSProperties, FC } from 'react';
import { Typography } from '@rbx/ui';

/** Elasticsearch highlighter tags from universe-performance-raqi `ErrorLoggingQueryService`. */
export const HIGHLIGHT_PRE_TAG = '<|highlight|>';
export const HIGHLIGHT_POST_TAG = '</|highlight|>';

export const containsHighlightTags = (input: string): boolean => input.includes(HIGHLIGHT_PRE_TAG);

const highlightStyle: CSSProperties = {
  backgroundColor: 'var(--color-shift-200)',
  fontWeight: 'bold',
};

export type HighlightedTagTextProps = {
  text: string;
  preTag?: string;
  postTag?: string;
};

/**
 * Renders strings that may contain Elasticsearch `PreTags`/`PostTags`
 * as visually highlighted spans (see error log keyword search).
 */
const HighlightedTagText: FC<HighlightedTagTextProps> = ({
  text,
  preTag = HIGHLIGHT_PRE_TAG,
  postTag = HIGHLIGHT_POST_TAG,
}) => {
  const parts = text.split(postTag).map((part, i) => {
    const [start, highlight] = part.split(preTag);
    return (
      // eslint-disable-next-line react/no-array-index-key
      <span key={i}>
        {start}
        {highlight ? (
          <span style={highlightStyle} data-testid='highlight-tag'>
            {highlight}
          </span>
        ) : null}
      </span>
    );
  });

  return <Typography>{parts}</Typography>;
};

export default HighlightedTagText;
