import React, { forwardRef } from 'react';
import { Icon as FoundationIcon, TIconSize } from '@rbx/foundation-ui';
import type { TTailwindIconClass } from '@rbx/foundation-tailwind/classes';

export type FoundationIconAnnotationWrapperProps = {
  iconName: TTailwindIconClass;
  size?: TIconSize;
  classes?: { root?: string };
};

/**
 * A FoundationIcon wrapper component compatible with the annotations system.
 * This wrapper makes FoundationIcons work with annotations system
 * by forwarding refs and applying the necessary classes.
 *
 * @param iconName - The Tailwind icon class name (e.g., 'icon-regular-video-camera')
 * @param size - Optional icon size (defaults to 'Medium')
 * @param classes - Optional classes object with root property for styling
 */
const FoundationIconAnnotationWrapper = forwardRef<
  SVGSVGElement,
  FoundationIconAnnotationWrapperProps
>(({ iconName, size = 'Medium', classes }, ref) => (
  <span className={classes?.root}>
    <FoundationIcon name={iconName} size={size} ref={ref as React.Ref<HTMLSpanElement>} />
  </span>
));

FoundationIconAnnotationWrapper.displayName = 'FoundationIconAnnotationWrapper';

export default FoundationIconAnnotationWrapper;
