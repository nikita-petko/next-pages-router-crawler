import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import GroupModerationContainer from '@modules/group/containers/GroupModerationContainer';
import getOrganizationLayout from '@modules/group/layout/getOrganizationLayout';

const GroupModeration: NextLayoutPage = () => {
  return (
    <Authenticated>
      <GroupModerationContainer />
    </Authenticated>
  );
};

GroupModeration.getPageLayout = (page) =>
  getOrganizationLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Moderation' />
    ),
  });
GroupModeration.loggerConfig = { rosId: RosTeams.Organizations };

export default GroupModeration;
