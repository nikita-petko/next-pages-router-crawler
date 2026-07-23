import React, { FunctionComponent, useEffect } from 'react';
import RoadMapContainer from '@modules/roadMap/RoadMapContainer';
import { captureUpdatesPageEvent, captureUpdatesPageView, EUpdatesPageSection } from './eventUtils';

const RoadmapTab: FunctionComponent = () => {
  useEffect(() => {
    captureUpdatesPageView('roadmapTabView', EUpdatesPageSection.RoadmapTabView);
  }, []);

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
