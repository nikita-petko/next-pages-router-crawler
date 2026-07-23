import type { CSSProperties, FC } from 'react';
import React from 'react';
import { Chip } from '@rbx/foundation-ui';
import type { RpnTokenChipSegment } from '../utils/getRpnTokenChipSegments';

export const RPN_TOKEN_CHIP_TEXT_CLASSNAME = 'text-caption-medium font-semibold';

const defaultJoinerStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-content-muted)',
  paddingLeft: 2,
  paddingRight: 2,
  flexShrink: 0,
};

type RpnTokenChipSegmentRowProps = {
  segments: ReadonlyArray<RpnTokenChipSegment>;
  chipTextClassName?: string;
  showJoiners?: boolean;
};

const RpnTokenChipSegmentRow: FC<RpnTokenChipSegmentRowProps> = ({
  segments,
  chipTextClassName,
  showJoiners = true,
}) => {
  return (
    <>
      {segments.map((segment) => {
        const chipStyle: CSSProperties = {
          pointerEvents: 'none',
          flexShrink: 0,
          minWidth: 0,
          maxWidth: '100%',
        };

        return (
          <React.Fragment key={segment.key}>
            <Chip
              text={segment.text}
              size='Small'
              variant='Standard'
              isChecked={false}
              className={chipTextClassName}
              style={chipStyle}
            />
            {showJoiners && !segment.isLast ? (
              <span style={defaultJoinerStyle}>{segment.joiner}</span>
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
};

export default RpnTokenChipSegmentRow;
