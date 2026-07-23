import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import ConfigureEventContainer from '@modules/creations/event/components/CreateEventForm/ConfigureEventContainer';
import EventProvider from '@modules/creations/event/components/EventProvider';
import GameProvider from '@modules/providers/game/GameProvider';

const ConfigureEvent: NextLayoutPage = () => {
  const router = useRouter();
  const eventId = String(router.query.eventId);

  return (
    <EventProvider eventId={eventId}>
      <Authenticated>
        <GameProvider>
          <ConfigureEventContainer />
        </GameProvider>
      </Authenticated>
    </EventProvider>
  );
};

ConfigureEvent.getPageLayout = (page) =>
  getCreationsPageLayout(page, {
    title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Events' />,
  });
ConfigureEvent.loggerConfig = { rosId: RosTeams.GameOperations };

export default ConfigureEvent;
