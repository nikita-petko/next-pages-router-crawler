import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import CommunicationSettingsContainer from '@modules/communication-settings/CommunicationSettingsContainer';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';

const CommunicationSettings: NextLayoutPage = () => {
  return (
    <Authenticated>
      <CommunicationSettingsContainer />
    </Authenticated>
  );
};

CommunicationSettings.getPageLayout = getCreationsPageLayout;
CommunicationSettings.loggerConfig = { rosId: RosTeams.CommunicationCreatorServices };

export default CommunicationSettings;
