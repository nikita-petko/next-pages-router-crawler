import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { ConfigureExperienceSubscriptionContainer } from '@modules/creations';
import { getExperienceSubscriptionConfigureLayout } from '@modules/creations/experienceSubscriptions';

const Configure: NextLayoutPage = () => (
  <Authenticated>
    <ConfigureExperienceSubscriptionContainer />
  </Authenticated>
);

Configure.getPageLayout = (page) => getExperienceSubscriptionConfigureLayout(page);

export default Configure;
