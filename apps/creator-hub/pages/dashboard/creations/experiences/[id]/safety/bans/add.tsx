import type { NextLayoutPage } from 'next';
import AddUsersToBanContainer from '@modules/safety-controls/bans/components/AddUsersToBanContainer';
import getUserBansPageLayout from '@modules/safety-controls/bans/layout/GetUserBansPageLayout';

const UserBans: NextLayoutPage = () => {
  return <AddUsersToBanContainer />;
};

UserBans.getPageLayout = getUserBansPageLayout;
UserBans.loggerConfig = { rosId: RosTeams.Safety };

export default UserBans;
