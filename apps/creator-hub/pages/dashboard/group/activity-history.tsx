import Authenticated from '@modules/authentication/Authenticated';
import getOrganizationLayout from '@modules/group/layout/getOrganizationLayout';
import GroupActivityHistoryContainer from '@modules/group/containers/GroupActivityHistoryContainer';
import { NextLayoutPage } from 'next';

const GroupActivityHistory: NextLayoutPage = () => {
  return (
    <Authenticated>
      <GroupActivityHistoryContainer />
    </Authenticated>
  );
};

GroupActivityHistory.getPageLayout = (page) =>
  getOrganizationLayout(page, { title: 'Label.ActivityHistory' });

export default GroupActivityHistory;
