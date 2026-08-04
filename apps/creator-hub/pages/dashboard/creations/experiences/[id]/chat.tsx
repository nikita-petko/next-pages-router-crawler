import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import PresetChatPageContent from '@modules/preset-chat/components/PresetChatPageContent';

const Chat: NextLayoutPage = () => {
  return (
    <Authenticated>
      <PresetChatPageContent />
    </Authenticated>
  );
};

Chat.getPageLayout = getCreationsPageLayout;
Chat.loggerConfig = { rosId: RosTeams.PublicCommunication };

export default Chat;
