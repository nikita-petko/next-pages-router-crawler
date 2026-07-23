import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import ConfigureExperienceSubscriptionContainer from '@modules/creations/experienceSubscriptions/components/ConfigureExperienceSubscriptionForm/ConfigureExperienceSubscriptionContainer';
import getExperienceSubscriptionConfigureLayout from '@modules/creations/experienceSubscriptions/utils/getExperienceSubscriptionConfigureLayout';

const Configure: NextLayoutPage = () => (
  <Authenticated>
    <ConfigureExperienceSubscriptionContainer />
  </Authenticated>
);

Configure.getPageLayout = (page) => getExperienceSubscriptionConfigureLayout(page);
Configure.loggerConfig = { rosId: RosTeams.MonetizationProducts };

export default Configure;
