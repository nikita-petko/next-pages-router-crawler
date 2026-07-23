import type { FunctionComponent } from 'react';
import React, { useEffect } from 'react';
import { useFlag } from '@rbx/flags';
import { creatorRoadmapEnabled } from '@generated/flags/creatorRoadmap';
import RoadMapContainer from '@modules/roadMap/RoadMapContainer';
import CreatorRoadmapV2 from '@modules/roadMap/v2/CreatorRoadmapV2';
import { captureUpdatesPageEvent, captureUpdatesPageView, EUpdatesPageSection } from './eventUtils';

const RoadmapTab: FunctionComponent = () => {
  const { ready, value: isRoadmapV2Enabled } = useFlag(creatorRoadmapEnabled);

  useEffect(() => {
    captureUpdatesPageView('roadmapTabView', EUpdatesPageSection.RoadmapTabView);
  }, []);

  // Wait for the flag to resolve so V2 users don't flash the legacy roadmap on first paint.
  if (!ready) {
    return null;
  }

  if (isRoadmapV2Enabled) {
    return <CreatorRoadmapV2 />;
  }

  return (
    <RoadMapContainer
      onReadAnnouncementClick={() =>
        captureUpdatesPageEvent('clickReadAnnouncement', EUpdatesPageSection.RoadmapBanner)
      }
      onDiscussRoadmapClick={() =>
        captureUpdatesPageEvent('clickDiscussRoadmap', EUpdatesPageSection.RoadmapBanner)
      }
    />
  );
};

export default RoadmapTab;
