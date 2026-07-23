import React from 'react';
import type { TTooltipProps } from '@rbx/ui';
import { tooltipClasses, Typography } from '@rbx/ui';
import type { AnnotationWithPosition } from '../types/Annotation';

const getXAxisTooltipProps = ({
  annotation,
  formatXForAnnotationTooltip,
}: {
  annotation: AnnotationWithPosition;
  formatXForAnnotationTooltip?: (x: number | string, annotationId: string) => string;
}): Pick<TTooltipProps, 'title' | 'placement' | 'open' | 'slotProps'> => {
  const title = formatXForAnnotationTooltip?.(annotation.start, annotation.id);
  return {
    title: title ? (
      // 11px is to make it compatible with font size we apply on highcharts native
      // tooltip
      <Typography variant='body2' style={{ fontSize: '11px' }}>
        {title}
      </Typography>
    ) : undefined,
    placement: 'bottom',
    open: true,
    slotProps: {
      popper: {
        sx: {
          [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]:
            {
              marginTop: '1px',
            },
        },
        // Prevent annotation x-axis tooltip to auto repositioned by specifying these modifiers
        // so it behaves the same as highchart x-axis tooltip
        modifiers: [
          {
            name: 'flip',
            enabled: false,
          },
          {
            name: 'preventOverflow',
            enabled: false,
          },
        ],
      },
    },
  };
};

export default getXAxisTooltipProps;
