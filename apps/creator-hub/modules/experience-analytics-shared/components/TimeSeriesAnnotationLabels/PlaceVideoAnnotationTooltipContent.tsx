import React, { forwardRef } from 'react';
import type { TIconProps } from '@rbx/ui';
import FoundationIconAnnotationWrapper from '../FoundationIconAnnotationsWrapper/FoundationIconAnnotationsWrapper';

const PlaceVideoAnnotationTooltipContent: React.ForwardRefRenderFunction<
  SVGSVGElement,
  TIconProps
> = (props, ref) => (
  <FoundationIconAnnotationWrapper
    iconName='icon-regular-video-camera'
    size='Medium'
    ref={ref}
    {...props}
  />
);

export const PlaceVideoIcon = forwardRef(PlaceVideoAnnotationTooltipContent);

export default PlaceVideoIcon;
