import type { NextLayoutPage } from 'next';
import UserBansContainer from '@modules/safety-controls/bans/components/UserBansContainer';
import getUserBansPageLayout from '@modules/safety-controls/bans/layout/GetUserBansPageLayout';
import ModerationTabs, { ModerationTab } from '@modules/safety-controls/ModerationTabs';

const UserBans: NextLayoutPage = () => {
  return (
    <ModerationTabs activeTab={ModerationTab.Bans}>
      <UserBansContainer />
    </ModerationTabs>
  );
};

UserBans.getPageLayout = getUserBansPageLayout;
UserBans.loggerConfig = { rosId: RosTeams.Safety };

export default UserBans;
