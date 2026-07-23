import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { useRouter } from 'next/router';
import GameProvider from '@modules/providers/game/GameProvider';
import { EventProvider, ConfigureEventContainer, getCreationsPageLayout } from '@modules/creations';

const ConfigureEvent: NextLayoutPage = () => {
  const router = useRouter();
  const eventId = router.query.eventId as string;

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

ConfigureEvent.getPageLayout = (page) => getCreationsPageLayout(page, { title: 'Heading.Events' });

export default ConfigureEvent;
