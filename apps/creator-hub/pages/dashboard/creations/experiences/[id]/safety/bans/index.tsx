import type { NextLayoutPage } from 'next';
import UserBansContainer from '@modules/safety-controls/components/UserBansContainer';
import getUserBansPageLayout from '@modules/safety-controls/layout/GetUserBansPageLayout';

const UserBans: NextLayoutPage = () => {
  return <UserBansContainer />;
};

UserBans.getPageLayout = getUserBansPageLayout;
UserBans.loggerConfig = { rosId: RosTeams.Safety };

export default UserBans;
