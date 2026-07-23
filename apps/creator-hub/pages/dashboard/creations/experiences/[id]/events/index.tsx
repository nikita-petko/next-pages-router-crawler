import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import ExperienceEventsContainer from '@modules/creations/event/components/common/ExperienceEventsContainer';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';

const EventsPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ExperienceEventsContainer />
    </Authenticated>
  );
};

EventsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { noNavigationItem: true, context: { title: 'Heading.Events' } });
EventsPage.loggerConfig = { rosId: RosTeams.GameOperations };

export default EventsPage;
