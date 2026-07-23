import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import ReferralRewardDetailsContainer from '@modules/creations/referralRewardDetails/containers/ReferralRewardDetailsContainer';

const ListReferralRewardDetails: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ReferralRewardDetailsContainer.ListDetailsContainer />
    </Authenticated>
  );
};

ListReferralRewardDetails.getPageLayout = (page) =>
  getCreationsPageLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.ReferralRewards' />
    ),
  });
ListReferralRewardDetails.loggerConfig = { rosId: RosTeams.CreatorSettings };

export default ListReferralRewardDetails;
