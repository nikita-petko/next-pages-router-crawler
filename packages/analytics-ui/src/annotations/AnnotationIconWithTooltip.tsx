import React, { FC } from 'react';
import { makeStyles, Tooltip } from '@rbx/ui';
import { AnnotationWithPosition } from '../types/Annotation';
import { useActivatedAnnotation } from '../context/ActivatedAnnotationContext';

export const iconSize = 28;

const useStyles = makeStyles()((theme) => ({
  tooltipContainer: {
    padding: '0',
    margin: '0',
    borderRadius: theme.border.radius.small.borderRadius,
    overflow: 'hidden',
  },
  icon: {
    backgroundColor: theme.palette.surface[300],
    boxSizing: 'border-box',
    fontSize: `${iconSize}px`,
    padding: '4px',
    borderRadius: theme.border.radius.small.borderRadius,
    boxShadow: theme.elevation.subtle,
  },
  iconActive: {
    backgroundColor: theme.palette.content.standard,
    color: theme.palette.content.inverse,
  },
}));

type AnnotationIconWithTooltipProps = {
  annotation: AnnotationWithPosition;
};

const AnnotationIconWithTooltip: FC<AnnotationIconWithTooltipProps> = ({ annotation }) => {
  const {
    classes: { tooltipContainer, icon, iconActive },
    cx,
  } = useStyles();

  const { activeAnnotationId } = useActivatedAnnotation();
  const active = activeAnnotationId === annotation.id;

  return (
    <Tooltip
      title={annotation.tooltip}
      placement='top'
      classes={{
        tooltip: tooltipContainer,
      }}
      open={activeAnnotationId === annotation.id}>
      <annotation.Icon classes={{ root: cx(icon, { [iconActive]: active }) }} />
    </Tooltip>
  );
};

export default React.memo(AnnotationIconWithTooltip);
