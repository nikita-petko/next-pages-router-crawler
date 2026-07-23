import React from 'react';
import {
  ContentRestrictionBanner,
  useUniverseResource,
} from '@modules/experience-analytics-shared';

// AudienceContentRestrictionBanner passes through universe id to content restriction banner
const AudienceContentRestrictionBanner = () => {
  const { id } = useUniverseResource();
  return <ContentRestrictionBanner contentId={String(id)} contentType='universe' />;
};

export default AudienceContentRestrictionBanner;
