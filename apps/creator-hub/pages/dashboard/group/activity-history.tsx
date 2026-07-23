import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import GroupActivityHistoryContainer from '@modules/group/containers/GroupActivityHistoryContainer';
import getOrganizationLayout from '@modules/group/layout/getOrganizationLayout';

const GroupActivityHistory: NextLayoutPage = () => {
  return (
    <Authenticated>
      <GroupActivityHistoryContainer />
    </Authenticated>
  );
};

GroupActivityHistory.getPageLayout = (page) =>
  getOrganizationLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Label.ActivityHistory' />
    ),
  });
GroupActivityHistory.loggerConfig = { rosId: RosTeams.Organizations };

export default GroupActivityHistory;
