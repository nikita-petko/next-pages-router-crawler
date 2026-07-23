import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { CreateExperienceSubscriptionContainer } from '@modules/creations';
import { getExperienceSubscriptionCreationLayout } from '@modules/creations/experienceSubscriptions';

const Create: NextLayoutPage = () => (
  <Authenticated>
    <CreateExperienceSubscriptionContainer />
  </Authenticated>
);

Create.getPageLayout = (page) => getExperienceSubscriptionCreationLayout(page);

export default Create;
