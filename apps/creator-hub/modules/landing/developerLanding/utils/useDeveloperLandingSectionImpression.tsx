import { RefObject, useEffect, useRef } from 'react';
import {
  DEVELOPER_LANDING_PAGE_IMPRESSION_THRESHOLD,
  EDeveloperLandingSection,
  captureDeveloperLandingSectionImpression,
} from './eventUtils';
import useHasIntersected from './useHasIntersected';

const useDeveloperLandingSectionImpression = (
  intersectionMarkerRef: RefObject<HTMLElement | null>,
  section: EDeveloperLandingSection,
  threshold = DEVELOPER_LANDING_PAGE_IMPRESSION_THRESHOLD,
) => {
  const hasIntersected = useHasIntersected(intersectionMarkerRef, threshold);

  const hasCapturedImpression = useRef<boolean>(false);

  useEffect(() => {
    if (hasIntersected && !hasCapturedImpression.current) {
      hasCapturedImpression.current = true;
      captureDeveloperLandingSectionImpression(section);
    }
  }, [hasIntersected, section]);
};
export default useDeveloperLandingSectionImpression;
