import ContentRestrictionBanner from '@modules/experience-analytics-shared/components/Banners/ContentRestrictionBanner';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';

// AudienceContentRestrictionBanner passes through universe id to content restriction banner
const AudienceContentRestrictionBanner = () => {
  const { id } = useUniverseResource();
  return <ContentRestrictionBanner contentId={String(id)} contentType='universe' />;
};

export default AudienceContentRestrictionBanner;
