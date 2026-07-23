import type { NextLayoutPage } from 'next';
import { ExperienceEventsContainer } from '@modules/creations';
import Authenticated from '@modules/authentication/Authenticated';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';

const EventsPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ExperienceEventsContainer />
    </Authenticated>
  );
};

EventsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { noNavigationItem: true, context: { title: 'Heading.Events' } });

export default EventsPage;
