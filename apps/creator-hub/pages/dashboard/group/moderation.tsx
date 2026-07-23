import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import getOrganizationLayout from '@modules/group/layout/getOrganizationLayout';
import GroupModerationContainer from '@modules/group/containers/GroupModerationContainer';

const GroupModeration: NextLayoutPage = () => {
  return (
    <Authenticated>
      <GroupModerationContainer />
    </Authenticated>
  );
};

GroupModeration.getPageLayout = (page) =>
  getOrganizationLayout(page, { title: 'Heading.Moderation' });

export default GroupModeration;
