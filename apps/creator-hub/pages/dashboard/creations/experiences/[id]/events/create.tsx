import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import CreateEventContainer from '@modules/creations/event/components/CreateEventForm/CreateEventContainer';

const Create: NextLayoutPage = () => {
  return (
    <Authenticated>
      <CreateEventContainer />
    </Authenticated>
  );
};

Create.getPageLayout = (page) =>
  getCreationsPageLayout(page, {
    title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Events' />,
  });
Create.loggerConfig = { rosId: RosTeams.GameOperations };

export default Create;
